-- Skill Bridge database schema
-- Run this entire file in Supabase Dashboard > SQL Editor > New query.
-- This schema is designed for the public anon key + Row Level Security.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Skill Bridge member',
  role text not null default 'buyer' check (role in ('buyer','seller','admin')),
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 90),
  description text not null check (char_length(description) between 20 and 5000),
  category text not null,
  price numeric(12,2) not null check (price > 0),
  delivery_days integer not null default 3 check (delivery_days between 1 and 60),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  requirements text not null default '',
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','in_progress','delivered','completed','cancelled')),
  payment_status text not null default 'simulated' check (payment_status = 'simulated'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint different_buyer_seller check (buyer_id <> seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  gig_id uuid not null references public.gigs(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists gigs_active_created_idx on public.gigs(is_active, created_at desc);
create index if not exists gigs_seller_idx on public.gigs(seller_id);
create index if not exists orders_buyer_idx on public.orders(buyer_id, created_at desc);
create index if not exists orders_seller_idx on public.orders(seller_id, created_at desc);
create index if not exists messages_order_idx on public.messages(order_id, created_at);

-- Create a profile automatically after signup. Role is restricted to buyer/seller;
-- users cannot grant themselves admin through signup metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'role' = 'seller' then 'seller' else 'buyer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Helper: true when the signed-in user is a marketplace admin.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.gigs enable row level security;
alter table public.orders enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- Profiles: authenticated members can view public seller/buyer names; only owner/admin edits.
drop policy if exists "profiles readable by signed in members" on public.profiles;
drop policy if exists "profiles publicly readable" on public.profiles;
create policy "profiles publicly readable" on public.profiles
for select to anon, authenticated using (true);
drop policy if exists "profile owner updates own profile" on public.profiles;
drop policy if exists "profile owner cannot change role" on public.profiles;
-- Role is not user-editable from the client. Admin role must be granted manually in SQL.
create policy "profile owner cannot change role" on public.profiles
for update to authenticated using (id = auth.uid() or public.is_admin())
with check (
  (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()))
  or public.is_admin()
);

-- Gigs: anyone can view active gigs; sellers manage only their own.
drop policy if exists "active gigs are public" on public.gigs;
create policy "active gigs are public" on public.gigs
for select using (is_active = true or seller_id = auth.uid() or public.is_admin());
drop policy if exists "sellers create own gigs" on public.gigs;
create policy "sellers create own gigs" on public.gigs
for insert to authenticated with check (
  seller_id = auth.uid() and exists(select 1 from public.profiles where id = auth.uid() and role = 'seller')
);
drop policy if exists "sellers update own gigs" on public.gigs;
create policy "sellers update own gigs" on public.gigs
for update to authenticated using (seller_id = auth.uid() or public.is_admin())
with check (seller_id = auth.uid() or public.is_admin());
drop policy if exists "sellers delete own gigs" on public.gigs;
create policy "sellers delete own gigs" on public.gigs
for delete to authenticated using (seller_id = auth.uid() or public.is_admin());

-- Orders: participants only. Buyer creates an order for a gig's actual seller and price.
drop policy if exists "order participants read" on public.orders;
create policy "order participants read" on public.orders
for select to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
drop policy if exists "buyers create orders" on public.orders;
create policy "buyers create orders" on public.orders
for insert to authenticated with check (
  buyer_id = auth.uid()
  and exists(select 1 from public.gigs g where g.id = gig_id and g.seller_id = seller_id and g.is_active = true and g.price = amount)
  and payment_status = 'simulated'
);
drop policy if exists "participants update orders" on public.orders;
create policy "participants update orders" on public.orders
for update to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin())
with check (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
-- The client can change only the status; order amount, parties and payment marker stay fixed.
revoke update on public.orders from authenticated;
grant update (status) on public.orders to authenticated;

-- Messages: only buyer/seller on the order can read and send.
drop policy if exists "order participants read messages" on public.messages;
create policy "order participants read messages" on public.messages
for select to authenticated using (
  exists(select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid()))
  or public.is_admin()
);
drop policy if exists "order participants send messages" on public.messages;
create policy "order participants send messages" on public.messages
for insert to authenticated with check (
  sender_id = auth.uid() and exists(
    select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
  )
);

-- Reviews: buyer may review a completed order once; reviews are public to signed-in users.
drop policy if exists "reviews readable" on public.reviews;
create policy "reviews readable" on public.reviews for select to authenticated using (true);
drop policy if exists "buyers review completed orders" on public.reviews;
create policy "buyers review completed orders" on public.reviews
for insert to authenticated with check (
  reviewer_id = auth.uid() and exists(
    select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()
    and o.seller_id = seller_id and o.gig_id = gig_id and o.status = 'completed'
  )
);

grant usage on schema public to anon, authenticated;
grant select on public.gigs to anon, authenticated;
grant select, insert, update, delete on public.gigs to authenticated;
grant select on public.profiles to anon, authenticated;
grant insert on public.profiles to authenticated;
grant update (full_name, avatar_url, bio) on public.profiles to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert on public.reviews to authenticated;

-- To grant admin access to your own account after signing up, run:
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
