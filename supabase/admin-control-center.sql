-- Skill Bridge private admin control center.
-- Admin RPCs validate private.is_admin_user(auth.uid()) on every call.

alter table public.profiles add column if not exists ban_until timestamptz;

create table if not exists private.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  reason text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
revoke all on private.admin_action_logs from public, anon, authenticated;

create or replace function public.admin_list_users()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare result jsonb;
begin
  if auth.uid() is null or not private.is_admin_user(auth.uid()) then raise exception 'Admin access required'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into result
  from (
    select u.id,u.email,u.created_at,u.last_sign_in_at,p.full_name,p.role,p.account_status,
      p.ban_reason,p.banned_at,p.ban_until,p.work_type,p.city,p.country,p.avatar_url,
      (select count(*) from public.gigs g where g.seller_id=u.id) as gigs_count,
      (select count(*) from public.orders o where o.buyer_id=u.id or o.seller_id=u.id) as orders_count,
      (select count(*) from public.messages m where m.sender_id=u.id or exists (
        select 1 from public.conversations c where c.id=m.conversation_id and (c.buyer_id=u.id or c.seller_id=u.id)
      )) as messages_count,
      (select count(*) from public.reports r where r.reported_user_id=u.id) as reports_count
    from auth.users u left join public.profiles p on p.id=u.id
  ) x;
  return result;
end;
$$;
revoke all on function public.admin_list_users() from public,anon;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_get_user_details(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare result jsonb;
begin
  if auth.uid() is null or not private.is_admin_user(auth.uid()) then raise exception 'Admin access required'; end if;
  select jsonb_build_object(
    'account',(select jsonb_build_object('id',u.id,'email',u.email,'created_at',u.created_at,'last_sign_in_at',u.last_sign_in_at,'banned_until',u.banned_until) from auth.users u where u.id=p_user_id),
    'profile',(select to_jsonb(p) from public.profiles p where p.id=p_user_id),
    'gigs',coalesce((select jsonb_agg(to_jsonb(g) order by g.created_at desc) from public.gigs g where g.seller_id=p_user_id),'[]'::jsonb),
    'orders',coalesce((select jsonb_agg(jsonb_build_object(
      'order',to_jsonb(o),'gig_title',g.title,'buyer_name',bp.full_name,'seller_name',sp.full_name,
      'messages',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'sender_id',m.sender_id,'sender_name',mp.full_name,'body',m.body,'created_at',m.created_at) order by m.created_at asc)
        from public.messages m left join public.profiles mp on mp.id=m.sender_id where m.order_id=o.id),'[]'::jsonb)
    ) order by o.created_at desc)
      from public.orders o left join public.gigs g on g.id=o.gig_id left join public.profiles bp on bp.id=o.buyer_id left join public.profiles sp on sp.id=o.seller_id
      where o.buyer_id=p_user_id or o.seller_id=p_user_id),'[]'::jsonb),
    'conversations',coalesce((select jsonb_agg(jsonb_build_object(
      'conversation',to_jsonb(c),'gig_title',g.title,'buyer_name',bp.full_name,'seller_name',sp.full_name,
      'messages',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'sender_id',m.sender_id,'sender_name',mp.full_name,'body',m.body,'created_at',m.created_at) order by m.created_at asc)
        from public.messages m left join public.profiles mp on mp.id=m.sender_id where m.conversation_id=c.id),'[]'::jsonb)
    ) order by c.updated_at desc)
      from public.conversations c left join public.gigs g on g.id=c.gig_id
      left join public.profiles bp on bp.id=c.buyer_id left join public.profiles sp on sp.id=c.seller_id
      where c.buyer_id=p_user_id or c.seller_id=p_user_id),'[]'::jsonb),
    'reports',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.reports r where r.reported_user_id=p_user_id or r.reporter_id=p_user_id),'[]'::jsonb),
    'portfolio',coalesce((select jsonb_agg(to_jsonb(pi) order by pi.created_at desc) from public.portfolio_items pi where pi.user_id=p_user_id),'[]'::jsonb)
  ) into result;
  if result->'account' is null then raise exception 'User not found'; end if;
  return result;
end;
$$;
revoke all on function public.admin_get_user_details(uuid) from public,anon;
grant execute on function public.admin_get_user_details(uuid) to authenticated;

create or replace function public.admin_set_account_status(p_user_id uuid,p_status text,p_reason text default '',p_ban_until timestamptz default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare clean_reason text := left(coalesce(nullif(trim(p_reason),''),'Policy review'),500);
begin
  if auth.uid() is null or not private.is_admin_user(auth.uid()) then raise exception 'Admin access required'; end if;
  if p_user_id=auth.uid() then raise exception 'You cannot change your own admin account status'; end if;
  if p_status not in ('active','suspended','banned') then raise exception 'Invalid account status'; end if;
  if not exists(select 1 from public.profiles where id=p_user_id and role <> 'admin') then raise exception 'User not found or protected admin account'; end if;
  if p_status='suspended' and (p_ban_until is null or p_ban_until<=now() or p_ban_until>now()+interval '365 days') then
    raise exception 'Temporary ban must end within the next 365 days';
  end if;
  update public.profiles set account_status=p_status,
    ban_reason=case when p_status='active' then '' else clean_reason end,
    banned_at=case when p_status='active' then null else now() end,
    ban_until=case when p_status='suspended' then p_ban_until else null end
  where id=p_user_id;
  insert into private.admin_action_logs(admin_id,target_user_id,action,reason,metadata)
  values(auth.uid(),p_user_id,case when p_status='active' then 'unblocked' when p_status='banned' then 'permanent_ban' else 'temporary_ban' end,
    clean_reason,jsonb_build_object('status',p_status,'ban_until',p_ban_until));
end;
$$;
revoke all on function public.admin_set_account_status(uuid,text,text,timestamptz) from public,anon;
grant execute on function public.admin_set_account_status(uuid,text,text,timestamptz) to authenticated;

create or replace function public.admin_set_gig_status(p_gig_id uuid,p_is_active boolean,p_reason text default '')
returns void language plpgsql security definer set search_path = ''
as $$
declare owner_id uuid;
begin
  if auth.uid() is null or not private.is_admin_user(auth.uid()) then raise exception 'Admin access required'; end if;
  select seller_id into owner_id from public.gigs where id=p_gig_id;
  if owner_id is null then raise exception 'Service not found'; end if;
  update public.gigs set is_active=p_is_active where id=p_gig_id;
  insert into private.admin_action_logs(admin_id,target_user_id,action,reason,metadata)
  values(auth.uid(),owner_id,case when p_is_active then 'gig_reactivated' else 'gig_deactivated' end,left(coalesce(p_reason,''),500),
    jsonb_build_object('gig_id',p_gig_id,'is_active',p_is_active));
end;
$$;
revoke all on function public.admin_set_gig_status(uuid,boolean,text) from public,anon;
grant execute on function public.admin_set_gig_status(uuid,boolean,text) to authenticated;

create or replace function public.admin_list_action_logs()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare result jsonb;
begin
  if auth.uid() is null or not private.is_admin_user(auth.uid()) then raise exception 'Admin access required'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into result
  from (
    select l.id,l.action,l.reason,l.metadata,l.created_at,ap.full_name as admin_name,tp.full_name as target_name,l.target_user_id
    from private.admin_action_logs l left join public.profiles ap on ap.id=l.admin_id left join public.profiles tp on tp.id=l.target_user_id
    order by l.created_at desc limit 100
  ) x;
  return result;
end;
$$;
revoke all on function public.admin_list_action_logs() from public,anon;
grant execute on function public.admin_list_action_logs() to authenticated;

create or replace function public.refresh_my_temporary_ban()
returns boolean language plpgsql security definer set search_path = ''
as $$
declare changed boolean := false;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.profiles set account_status='active',ban_reason='',banned_at=null,ban_until=null
  where id=auth.uid() and account_status='suspended' and ban_until is not null and ban_until<=now();
  changed:=found;
  return changed;
end;
$$;
revoke all on function public.refresh_my_temporary_ban() from public,anon;
grant execute on function public.refresh_my_temporary_ban() to authenticated;

create or replace function private.guard_profile_moderation()
returns trigger language plpgsql set search_path = ''
as $$
declare actor uuid := auth.uid();
begin
  if new.account_status is distinct from old.account_status
     or new.ban_reason is distinct from old.ban_reason
     or new.banned_at is distinct from old.banned_at
     or new.ban_until is distinct from old.ban_until then
    if private.is_admin_user(actor) then return new; end if;
    if actor=old.id and old.account_status='suspended' and old.ban_until is not null and old.ban_until<=now()
       and new.account_status='active' and new.ban_reason='' and new.banned_at is null and new.ban_until is null then return new; end if;
    raise exception 'Only administrators can change account moderation status';
  end if;
  return new;
end;
$$;

create or replace function private.block_inactive_account()
returns trigger language plpgsql set search_path = ''
as $$
declare actor uuid; account_state text; until_at timestamptz;
begin
  actor:=(select auth.uid());
  if actor is null or current_user in ('service_role','postgres','supabase_admin') then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  select p.account_status,p.ban_until into account_state,until_at from public.profiles p where p.id=actor;
  if account_state is not null and account_state<>'active'
     and not (account_state='suspended' and until_at is not null and until_at<=now())
     and not private.is_admin_user(actor) then raise exception 'This Skill Bridge account is not active'; end if;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;

create or replace function private.sync_auth_ban_status()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.account_status='banned' then
    update auth.users set banned_until='9999-12-31 23:59:59+00'::timestamptz where id=new.id;
  elsif new.account_status='suspended' and new.ban_until is not null and new.ban_until>now() then
    update auth.users set banned_until=new.ban_until where id=new.id;
  else
    update auth.users set banned_until=null where id=new.id;
  end if;
  if new.account_status in ('suspended','banned')
     and (new.account_status is distinct from old.account_status or new.ban_until is distinct from old.ban_until) then
    delete from auth.sessions where user_id=new.id;
  end if;
  return new;
end;
$$;
