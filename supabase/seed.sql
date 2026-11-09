-- Local development seed data. Runs on `supabase db reset` only, never on production.
-- Every name, email, and the password below is fake and local-only.

-- Test shop owner: sign in locally with owner@example.com / password123
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'owner@example.com',
  extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'email',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"owner@example.com","email_verified":true}',
  now(), now(), now()
);

-- Demo shop
insert into public.shops (id, owner_id, shop_name, contact_email, slug) values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Mikes Glove Shop', 'mike@example.com', 'mikes-glove-shop'
);

-- Services (the last one is inactive, to test the "public can read active services" policy)
insert into public.services (id, shop_id, name, description, deposit_amount, estimated_days, is_active) values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222222',
   'Relace and restring', 'Fresh leather lacing throughout the glove.', 25, 7, true),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222222',
   'Palm and pocket repair', 'Replace worn palm padding and rebuild the pocket.', 40, 10, true),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222222',
   'Full restoration', 'Clean, condition, relace, and repair.', 75, 21, true),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222222',
   'Custom pocket reshaping (paused)', 'Not accepting requests right now.', 50, 14, false);

-- One booking per status, so every screen has something to show
insert into public.bookings (
  id, shop_id, service_id, customer_name, customer_email, customer_phone,
  notes, status, deposit_amount, stripe_payment_link, stripe_session_id
) values
  ('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333301', 'Test Pending', 'pending@example.com', '555-0101',
   'Laces snapped mid-season.', 'pending', 25, null, null),
  ('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333302', 'Test Approved', 'approved@example.com', '555-0102',
   'Palm is worn through.', 'approved', 40, 'https://example.com/pay/test-link', null),
  ('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333303', 'Test Deposit Paid', 'paid@example.com', '555-0103',
   'Dad''s old first baseman''s mitt.', 'deposit_paid', 75, 'https://example.com/pay/test-link', 'cs_test_seed_0003'),
  ('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333301', 'Test In Progress', 'progress@example.com', null,
   null, 'in_progress', 25, 'https://example.com/pay/test-link', 'cs_test_seed_0004'),
  ('44444444-4444-4444-4444-444444444405', '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333302', 'Test Ready', 'ready@example.com', null,
   null, 'ready', 40, 'https://example.com/pay/test-link', 'cs_test_seed_0005'),
  ('44444444-4444-4444-4444-444444444406', '22222222-2222-2222-2222-222222222222',
   '33333333-3333-3333-3333-333333333303', 'Test Completed', 'done@example.com', null,
   null, 'completed', 75, 'https://example.com/pay/test-link', 'cs_test_seed_0006'),
  ('44444444-4444-4444-4444-444444444407', '22222222-2222-2222-2222-222222222222',
   null, 'Test Declined', 'declined@example.com', null,
   'Wanted a custom job we do not offer.', 'declined', null, null, null);