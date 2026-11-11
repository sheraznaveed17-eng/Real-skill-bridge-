-- Make seller verification submission atomic and restrict privileged RPC execution.
create or replace function public.submit_seller_verification_request()
returns public.seller_verification_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_request public.seller_verification_requests%rowtype;
begin
  if v_user_id is null then
    raise exception 'Please sign in before requesting seller verification';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Your profile is not ready yet. Please refresh and try again';
  end if;

  if v_profile.seller_verification_status = 'verified' then
    raise exception 'Your seller account is already verified';
  end if;

  select * into v_request
  from public.seller_verification_requests
  where user_id = v_user_id and status = 'pending'
  order by created_at desc
  limit 1;

  if found then
    update public.profiles
    set seller_verification_status = 'pending'
    where id = v_user_id;
    return v_request;
  end if;

  insert into public.seller_verification_requests(user_id, status)
  values (v_user_id, 'pending')
  returning * into v_request;

  update public.profiles
  set seller_verification_status = 'pending'
  where id = v_user_id;

  return v_request;
end;
$$;

revoke all on function public.submit_seller_verification_request() from public, anon;
grant execute on function public.submit_seller_verification_request() to authenticated;

revoke execute on function public.admin_review_seller_verification(uuid, text, text) from public, anon;
grant execute on function public.admin_review_seller_verification(uuid, text, text) to authenticated;

revoke all on function public.admin_set_seller_verification(uuid, text) from public, anon, authenticated;
revoke all on function public.protect_seller_verification_status() from public, anon, authenticated;

drop policy if exists "Users can submit own seller verification requests" on public.seller_verification_requests;
create policy "Users can submit own seller verification requests"
on public.seller_verification_requests
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and admin_reason is null
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "Users can view own seller verification requests" on public.seller_verification_requests;
create policy "Users can view own seller verification requests"
on public.seller_verification_requests
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

create index if not exists seller_verification_requests_reviewed_by_idx
on public.seller_verification_requests(reviewed_by);
