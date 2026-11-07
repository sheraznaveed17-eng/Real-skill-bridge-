# Skill Bridge — Work and Services Marketplace

Skill Bridge connects people who need work done with people who have the skills to do it. The platform is designed for both digital services and practical, local work, with a simple mobile-friendly experience.

Built with React, Vite and Supabase.

## Platform setup

- Frontend: React + Vite.
- Backend, database and authentication: Supabase.
- Hosting: Vercel (or another compatible static host).
- Checkout: simulated only. No real payments, bank details or card information are processed.
- Supabase and hosting plans have usage limits that may change. Review the provider terms and limits before scaling the service.

## Configure Supabase

1. Open https://supabase.com and create or sign in to an account.
2. Create a Supabase project and keep its database password private.
3. Open **SQL Editor** → **New query**.
4. Open `supabase/schema.sql`, copy its contents into the SQL Editor, and run the query.
5. In **Project Settings → API** (or API Keys), copy the Project URL and anon/public key. Never expose the `service_role` key.

## Configure environment variables

Add these variables in the hosting provider's project settings:

- `VITE_SUPABASE_URL` = your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` = your Supabase anon/public key

For local development, copy `.env.example` to `.env` and enter the same values. Do not upload `.env` to GitHub.

## Deploy

1. Import this GitHub repository into Vercel or another Vite-compatible host.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add the two environment variables above.
5. Deploy and use the public URL provided by the hosting provider.

## Current platform features

- Email/password signup and login with buyer/seller account types.
- Public service marketplace with category and search filtering.
- Seller service publishing.
- Buyer simulated checkout and order creation.
- Buyer/seller order dashboard and status workflow.
- Order-linked messaging.
- Buyer reviews after an order is completed.
- Basic admin overview and service deactivation.
- Row Level Security policies in `supabase/schema.sql`.

## Admin account

After creating your account, find your user UUID in Supabase **Authentication → Users**. Then run this in SQL Editor, replacing the placeholder with your UUID:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_AUTH_USER_UUID';
```

Only the platform owner should assign the admin role. Do not add an admin signup option.

## Important operational notes

- Checkout is currently a test flow. No real payment gateway is connected and no payment details are collected.
- Email confirmation behavior depends on the Supabase Auth configuration.
- Admin user management is handled through the Supabase dashboard; the in-app admin page provides a basic moderation overview.
- Service listings currently use a decorative illustration rather than user-uploaded images.
- Before accepting real customers at scale, complete security testing, order-state validation, abuse reporting, moderation, backups, privacy and legal review, and payment-provider integration if real payments are required.
