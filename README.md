# Skill Bridge — Full-stack freelance marketplace

A mobile-friendly Fiverr-style college project built with React + Vite + Supabase.
The database, authentication, gigs, orders, messages and reviews are shared online
between users after the free Supabase project is connected.

## Important: free project, real backend

- Frontend: free/open-source React + Vite.
- Backend/database/auth: Supabase Free plan.
- Hosting: deploy the `dist` folder to a free static host (for example, Vercel or Netlify).
- Checkout: **simulated only**. No real payments, bank details or card information are collected.
- Free services have quotas/limits and can change. This is suitable for a college project, not a high-traffic commercial launch.

## Android-only setup

You can do the setup from your Android browser. A GitHub repository alone does not run the backend.

### 1. Create a free Supabase project
1. Open https://supabase.com and create/sign in to an account.
2. Create a new project. Save the database password somewhere private.
3. Open **SQL Editor** → **New query**.
4. Open `supabase/schema.sql` from this project, copy all its contents, paste into SQL Editor, then press **Run**.
5. In Supabase go to **Project Settings → API** (sometimes labelled API Keys).
6. Copy the **Project URL** and the **anon/public key**. Never copy or expose the `service_role` key.

### 2. Add the two public settings
When deploying with Vercel or Netlify, add these environment variables:

- `VITE_SUPABASE_URL` = your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` = your Supabase anon/public key

For local development, copy `.env.example` to `.env` and fill the same two values. Do not upload `.env` to GitHub.

### 3. Deploy for free
1. Sign in to Vercel or Netlify using GitHub.
2. Import the `skill-bridge` repository.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add the two environment variables above before deploying.
6. Deploy. The host will give you a public website link.

If the repository currently contains an older starter, upload/replace it with the contents of this project folder (the files inside the ZIP, not the ZIP file itself).

## Features included

- Email/password signup and login with buyer/seller account type.
- Public active gig marketplace and category/search filtering.
- Seller gig publishing.
- Buyer simulated checkout and order creation.
- Buyer/seller order dashboard and status workflow.
- Order-linked messaging.
- Buyer reviews after an order is completed.
- Basic admin view and gig deactivation.
- Row Level Security policies in `supabase/schema.sql`.

## Admin account

After you create your own account, find your user UUID in Supabase **Authentication → Users**.
Then run this in SQL Editor, replacing the placeholder with your UUID:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_AUTH_USER_UUID';
```

Admin role must only be assigned by the project owner. Do not add an admin signup option.

## Notes / limitations

- This is a working full-stack foundation, but it is not yet a commercial Fiverr clone.
- No real payment gateway is connected. The checkout is deliberately a demo/test flow.
- Email confirmation settings depend on your Supabase Auth configuration. For a classroom test, you can adjust email confirmation in Supabase Auth settings as appropriate.
- Admin user management is done from Supabase Dashboard; the in-app admin page provides a basic moderation overview.
- The initial UI uses a simple decorative service illustration rather than user-uploaded gig images.
- Before public production use, add stronger order-state validation, abuse reporting, moderation tools, backups and privacy/legal review.
