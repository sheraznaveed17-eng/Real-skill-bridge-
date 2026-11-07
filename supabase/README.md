# Supabase database notes

The live Skill Bridge database has evolved beyond the original `schema.sql`. Do not rerun that legacy bootstrap file against the live project: it does not describe all current tables, policies, functions, or constraints and may conflict with the current application.

Incremental production changes are tracked in `migrations/`. The migration `20261107172141_fix_marketplace_rls_and_profile_privileges.sql` is already applied to the production Supabase project.

Current live feature areas include profiles, gigs, orders, messages, reviews, conversations, custom offers, favorites, portfolio items, gig analytics, reports, and notifications. Before creating another database change, inspect the live schema and RLS policies, make the change through a Supabase migration, verify it with SQL, and then commit the exact applied migration here.

Never put a Supabase service-role key or other server secret in frontend source or this repository. The Vite app should use only its public client configuration.
