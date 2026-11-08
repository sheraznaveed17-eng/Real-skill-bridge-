# Skill Bridge — Work & Services Marketplace

Skill Bridge is a two-sided marketplace for digital services and practical local work. Buyers can discover services, contact sellers, discuss requirements and price, receive a custom offer, and track the agreed work. Members can switch between Buyer and Seller workspaces.

## Production stack

- Frontend: React 18 + Vite
- Authentication and database: Supabase Auth + PostgreSQL
- Hosting: Vercel
- Styling: responsive custom CSS
- Currency display: Pakistani rupees (Rs.)

## Included product features

### Public marketplace
- Responsive landing page and service discovery
- Search, category, location, budget, delivery-time and sort filters
- Service detail pages with packages, FAQs and buyer requirements
- Seller public profiles, portfolio and reviews
- Saved/favourite services
- Impression and click analytics with duplicate-view controls

### Accounts and profiles
- Real Supabase email/password registration and login
- Email-confirmation flow
- Buyer and Seller workspace modes on the same account
- Profile details, avatar, professional title, skills, languages, experience, education and availability
- Account settings for password and email-change requests
- Language selection saved in the current browser

### Seller workspace
- Create, edit, pause, activate and delete services
- Package options, FAQs and requirements
- Orders and delivery workflow
- Performance dashboard
- Portfolio management
- Custom offers to buyers

### Buyer workspace
- Discover and save services
- Contact sellers and discuss price before agreeing
- Accept or decline custom offers
- Track orders, message the seller, request revisions and approve completed work
- Submit a review after completion

### Communication and trust
- Buyer/seller conversations and order-linked messages
- Realtime notifications and unread indicators
- Service/account reporting
- Admin moderation view and restricted account actions
- Row Level Security (RLS) on all application tables
- Server-side database functions for protected order transitions and offer acceptance

## Payments are intentionally not included

Skill Bridge currently does **not** collect money, process payments, store card/bank details, or provide a wallet or checkout. The buyer and seller agree on the work and price through the conversation/custom-offer flow. Any future payment feature would require a separate, explicitly approved design and secure payment-provider integration.

## Supabase configuration

The Vercel Production environment must contain:

- `VITE_SUPABASE_URL` — the Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — the Supabase anon/public key

Never put a Supabase `service_role` key in frontend code or any `VITE_*` variable. Keep private credentials out of GitHub.

Database migrations are maintained in `supabase/migrations`. The production database has application tables for profiles, services, orders, conversations, messages, custom offers, notifications, favourites, portfolio items, analytics, reports and reviews. RLS is enabled on these public tables.

## Deploy

Vercel is connected to the GitHub repository. The Vite build uses:

- Build command: `npm run build`
- Output directory: `dist`

Push changes to the production branch to trigger a new deployment. Confirm the deployment reaches **Ready** before treating the change as live.

## Final verification checklist

A successful Vercel build confirms that the application compiles; it does not replace end-to-end testing with real accounts. Before inviting public users, test these flows using separate buyer and seller accounts:

1. Register, confirm email and log in on the same device/browser.
2. Complete each profile and switch between Buyer and Seller modes.
3. Publish a service, edit it, pause it and reactivate it.
4. Search/filter services and open a seller profile.
5. Save and unsave a service.
6. Start a conversation, exchange messages and confirm unread/read states.
7. Send a custom offer, decline one, and accept another to create an order.
8. Move an order through accepted, in-progress, delivered, revision and completed states.
9. Submit a review after completion.
10. Check notifications, seller analytics, portfolio and settings.
11. Verify that one account cannot read or change another account's private records.
12. Test the main pages on a small Android screen and check for broken navigation or blank screens.

Email delivery, account confirmation, and moderation should also be checked in the Supabase dashboard before a public launch.
