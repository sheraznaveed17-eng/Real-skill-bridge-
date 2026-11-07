-- Applied to Skill Bridge production on 2026-11-07.
revoke update on table public.conversations from authenticated;
grant update (last_message,updated_at) on table public.conversations to authenticated;
drop policy if exists "Buyers can respond to custom offers" on public.custom_offers;
create policy "Buyers can decline pending custom offers" on public.custom_offers for update to authenticated
using (buyer_id=(select auth.uid()) and status='pending')
with check (buyer_id=(select auth.uid()) and status='declined');
revoke update on table public.custom_offers from authenticated;
grant update (status) on table public.custom_offers to authenticated;
revoke insert,update,delete on table public.orders from anon,authenticated;
