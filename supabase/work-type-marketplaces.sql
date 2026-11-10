-- Skill Bridge: separate Digital Work and Practical Work marketplaces.
-- Existing rows are retained and classified from their current service category.
alter table public.profiles add column if not exists work_type text;
alter table public.gigs add column if not exists work_type text;

update public.gigs
set work_type = case
 when category in ('Construction','Masonry & Labour','Plumbing','Electrical Work','Painting','Carpentry','AC & Appliance Repair','Vehicle Repair','Cleaning & Home Services','Gardening','Transport','Education & Tutoring','Events & Catering')
 then 'practical' else 'digital' end
where work_type is null;

update public.profiles p
set work_type = case
 when exists (select 1 from public.gigs g where g.seller_id=p.id and g.work_type='practical')
  and not exists (select 1 from public.gigs g where g.seller_id=p.id and g.work_type='digital')
 then 'practical' else 'digital' end
where p.work_type is null;

alter table public.profiles add constraint profiles_work_type_check check (work_type in ('digital','practical')) not valid;
alter table public.profiles validate constraint profiles_work_type_check;
alter table public.gigs alter column work_type set default 'digital';
alter table public.gigs alter column work_type set not null;
alter table public.gigs add constraint gigs_work_type_check check (work_type in ('digital','practical')) not valid;
alter table public.gigs validate constraint gigs_work_type_check;

create or replace function public.keep_profile_work_type_immutable()
returns trigger language plpgsql set search_path = ''
as $$
begin
 if tg_op='UPDATE' and old.work_type is not null and new.work_type is distinct from old.work_type then
  raise exception 'Marketplace type cannot be changed after account creation.';
 end if;
 return new;
end;
$$;
drop trigger if exists keep_profile_work_type_immutable on public.profiles;
create trigger keep_profile_work_type_immutable before update of work_type on public.profiles
for each row execute function public.keep_profile_work_type_immutable();

create or replace function public.validate_gig_marketplace_type()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare owner_work_type text;
begin
 select p.work_type into owner_work_type from public.profiles p where p.id=new.seller_id;
 if owner_work_type is null then raise exception 'Choose a Skill Bridge marketplace before publishing a service.'; end if;
 if new.work_type is null then new.work_type:=owner_work_type; end if;
 if new.work_type<>owner_work_type then raise exception 'This service does not belong to your selected Skill Bridge marketplace.'; end if;
 return new;
end;
$$;
revoke all on function public.validate_gig_marketplace_type() from public, anon, authenticated;
drop trigger if exists validate_gig_marketplace_type on public.gigs;
create trigger validate_gig_marketplace_type before insert or update of seller_id,work_type on public.gigs
for each row execute function public.validate_gig_marketplace_type();
create index if not exists gigs_work_type_active_created_idx on public.gigs(work_type,is_active,created_at desc);
