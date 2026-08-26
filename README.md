# craftDesk

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

\`\`\`bash
git clone https://github.com/NickSoltau/craftDesk.git
cd craftDesk
npm install
npm run dev
\`\`\`

Requires a Supabase project with matching schema and environment variables
(see `.env.example`) plus a Stripe account for payment link generation.
