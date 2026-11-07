-- Applied to Skill Bridge production on 2026-11-07.
revoke all on table public.notifications from public,anon,authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;
