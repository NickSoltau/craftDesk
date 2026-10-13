# CraftDesk

A booking and job-management app for small service businesses (e.g. repair
shops, contractors) — customers submit booking requests, owners approve
them and generate payment links, and jobs move through status stages from
deposit to completion.

**This is a live, fully working example** — not just a UI shell. Every
part of the flow below is functional end to end.

## Try it yourself

1. **Submit a booking as a customer:**
   👉 [Book a service](https://craft-desk-rho.vercel.app/book/mikes-glove-shop)
   Fill out the form and submit — no login needed, this is the public-facing page.

2. **Log in as the shop owner:**
   👉 [Owner dashboard](https://craft-desk-rho.vercel.app/login)
   Email: Mike@mikesgloves.com
   Password: Mike123

3. **See your request appear** under "Pending Requests," **approve it**,
   and a real Stripe payment link is generated automatically.

4. **Track the job** through its status stages (Deposit Paid → In Progress
   → Ready for Pickup → Completed) from the "Active Jobs" tab.

## Testing the payment flow

The Stripe integration runs in test mode. Use Stripe's test card to
complete a payment without real charges:

- **Card number:** 4242 4242 4242 4242
- **Expiry:** any future date
- **CVC:** any 3 digits
- **ZIP:** any 5 digits

## Features

- Public booking form with photo upload, tied to a unique shop URL
- Owner dashboard with pending-request approval/decline
- Stripe payment link generation via Supabase Edge Functions
- Job status tracking through a full lifecycle
- Auth-protected dashboard, public booking page, no login required for customers

## Tech stack

- React + Vite
- Tailwind CSS
- Supabase (auth, database, storage, edge functions)
- Stripe (payment links)
- Deployed on Vercel

## Running locally

```bash
git clone https://github.com/NickSoltau/craftDesk.git
cd craftDesk
npm install
npm run dev
```

Requires a Supabase project with the matching schema. Put `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` in a `.env` file. The Stripe and Resend keys
(`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, and `SITE_URL`) are
set as Supabase Edge Function secrets, and you need a Stripe account for payment links.

## Security

CraftDesk uses Supabase with Row Level Security (RLS) enabled on every table. The public anon key ships with the frontend by design, so RLS policies are what decide who can read or write data.

**How access works**

- **Shop owners** can manage their own shop, services, bookings, and booking photos.
- **Anonymous visitors** can read active services and shops (needed for the public booking page) and can submit a booking. They cannot read bookings.
- **Booking submissions** are validated in the database: the shop must exist, the service must belong to that shop and be active, and visitors cannot pre-fill Stripe payment fields.
- **Photo uploads** are only accepted for a booking submitted within the last hour, using a small helper function kept in a private schema.

**What I found and fixed**

During a pass through Supabase's Security Advisor, I discovered that a policy named "Customers can read their own booking by email" was actually `using (true)`, letting anyone with the public key read every booking. The advisor doesn't flag this pattern, so I found it by reading the policy definitions. I removed it, tightened both public insert policies, and re-tested the booking, owner approval, payment link, and job tracking flows.

**Known remaining advisor warning**

- *Leaked Password Protection Disabled*: this check requires Supabase's Pro plan, and this project runs on the free tier. It would matter for a production deployment with password sign-ups.

This is a portfolio project, not a hardened production system. If it were taken to production, I would add rate limiting on public inserts, CAPTCHA on the booking form, and automated tests for the RLS policies.
