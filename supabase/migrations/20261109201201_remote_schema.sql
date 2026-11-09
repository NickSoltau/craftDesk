SET local check_function_bodies = off;

CREATE SCHEMA "private";

CREATE TABLE "public"."booking_photos" (
  "id"          uuid                        NOT NULL DEFAULT gen_random_uuid(),
  "booking_id"  uuid,
  "storage_url" text                        NOT NULL,
  "uploaded_at" timestamp without time zone DEFAULT now(),
  CONSTRAINT "booking_photos_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."booking_photos"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."bookings" (
  "id"                  uuid                        NOT NULL DEFAULT gen_random_uuid(),
  "shop_id"             uuid,
  "service_id"          uuid,
  "customer_name"       text                        NOT NULL,
  "customer_email"      text                        NOT NULL,
  "customer_phone"      text,
  "notes"               text,
  "status"              text                        DEFAULT 'pending'::text,
  "stripe_payment_link" text,
  "stripe_session_id"   text,
  "deposit_amount"      numeric,
  "submitted_at"        timestamp without time zone DEFAULT now(),
  "updated_at"          timestamp without time zone DEFAULT now(),
  CONSTRAINT "bookings_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."bookings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."services" (
  "id"             uuid                        NOT NULL DEFAULT gen_random_uuid(),
  "shop_id"        uuid,
  "name"           text                        NOT NULL,
  "description"    text,
  "deposit_amount" numeric                     NOT NULL,
  "estimated_days" integer                     NOT NULL,
  "is_active"      boolean                     DEFAULT true,
  "created_at"     timestamp without time zone DEFAULT now(),
  CONSTRAINT "services_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."services"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."shops" (
  "id"            uuid                        NOT NULL DEFAULT gen_random_uuid(),
  "owner_id"      uuid,
  "shop_name"     text                        NOT NULL,
  "contact_email" text                        NOT NULL,
  "slug"          text                        NOT NULL,
  "created_at"    timestamp without time zone DEFAULT now(),
  CONSTRAINT "shops_pkey" PRIMARY KEY (id),
  CONSTRAINT "shops_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."shops"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.booking_is_recent (
  p_booking_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1 from public.bookings b
    where b.id = p_booking_id
      and b.submitted_at > now() - interval '1 hour'
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_booking_status (
  p_booking_id uuid
)
  RETURNS json
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select json_build_object(
    'id', b.id,
    'status', b.status,
    'customer_name', b.customer_name,
    'deposit_amount', b.deposit_amount,
    'stripe_payment_link', b.stripe_payment_link,
    'submitted_at', b.submitted_at,
    'services', json_build_object(
      'name', sv.name,
      'estimated_days', sv.estimated_days
    )
  )
  from public.bookings b
  left join public.services sv on sv.id = b.service_id
  where b.id = p_booking_id;
$function$;

ALTER TABLE "public"."booking_photos"
  ADD CONSTRAINT "booking_photos_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE "public"."bookings"
  ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;

ALTER TABLE "public"."shops"
  ADD CONSTRAINT "shops_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."bookings"
  ADD CONSTRAINT "bookings_shop_id_fkey" FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;

ALTER TABLE "public"."services"
  ADD CONSTRAINT "services_shop_id_fkey" FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;

CREATE POLICY "Owners can view photos for their bookings" ON "public"."booking_photos"
  FOR ALL
  TO PUBLIC
  USING ((booking_id IN ( SELECT b.id
   FROM (public.bookings b
     JOIN public.shops s ON ((s.id = b.shop_id)))
  WHERE (s.owner_id = auth.uid()))));

CREATE POLICY "Public can insert photos" ON "public"."booking_photos"
  FOR INSERT
  TO "anon", "authenticated"
  WITH CHECK (private.booking_is_recent(booking_id));

CREATE POLICY "Owners can manage bookings for their shop" ON "public"."bookings"
  FOR ALL
  TO PUBLIC
  USING ((shop_id IN ( SELECT shops.id
   FROM public.shops
  WHERE (shops.owner_id = auth.uid()))));

CREATE POLICY "Public can insert bookings" ON "public"."bookings"
  FOR INSERT
  TO "anon", "authenticated"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.shops s
  WHERE (s.id = bookings.shop_id))) AND ((service_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.services sv
  WHERE ((sv.id = bookings.service_id) AND (sv.shop_id = bookings.shop_id) AND sv.is_active)))) AND (stripe_payment_link IS NULL) AND (stripe_session_id IS NULL)));

CREATE POLICY "Owners can manage their own services" ON "public"."services"
  FOR ALL
  TO PUBLIC
  USING ((shop_id IN ( SELECT shops.id
   FROM public.shops
  WHERE (shops.owner_id = auth.uid()))));

CREATE POLICY "Public can read active services" ON "public"."services"
  FOR SELECT
  TO PUBLIC
  USING ((is_active = true));

CREATE POLICY "Owners can manage their own shop" ON "public"."shops"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() = owner_id));

CREATE POLICY "Public can read shops by slug" ON "public"."shops"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Public can upload booking photos" ON "storage"."objects"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((bucket_id = 'booking-photos'::text));

REVOKE ALL ON FUNCTION "private"."booking_is_recent"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."booking_is_recent"(uuid) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."get_booking_status"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_booking_status"(uuid) TO "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."get_booking_status"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_booking_status"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_booking_status"(uuid) TO "service_role";

GRANT USAGE ON SCHEMA "private" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."booking_photos" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."booking_photos" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."booking_photos" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."booking_photos" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bookings" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."bookings" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bookings" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bookings" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."services" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."services" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."services" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."services" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."shops" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."shops" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."shops" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."shops" TO "service_role";

