-- Applied to the Skill Bridge production project on 2026-11-07.
-- Tightens participant checks and prevents self-service privilege escalation.

drop policy if exists "Buyers can start conversations" on public.conversations;
create policy "Buyers can start conversations"
on public.conversations for insert to authenticated
with check (
  buyer_id = (select auth.uid())
  and seller_id <> (select auth.uid())
  and exists (
    select 1 from public.gigs g
    where g.id = conversations.gig_id
      and g.seller_id = conversations.seller_id
      and g.is_active = true
  )
);

drop policy if exists "Sellers can create custom offers" on public.custom_offers;
create policy "Sellers can create custom offers"
on public.custom_offers for insert to authenticated
with check (
  seller_id = (select auth.uid())
  and status = 'pending'
  and exists (
    select 1 from public.conversations c
    where c.id = custom_offers.conversation_id
      and c.seller_id = (select auth.uid())
      and c.buyer_id = custom_offers.buyer_id
  )
);

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (
    new.role is distinct from old.role
    or new.account_status is distinct from old.account_status
    or new.ban_reason is distinct from old.ban_reason
    or new.banned_at is distinct from old.banned_at
  ) and not private.is_admin_user((select auth.uid())) then
    raise exception 'Only an authorized administrator can change protected account fields';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_profile_privileges() from public, anon, authenticated;
drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();
