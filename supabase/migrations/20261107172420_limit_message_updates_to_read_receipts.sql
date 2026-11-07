-- Applied to Skill Bridge production on 2026-11-07.
revoke update on table public.messages from public,anon,authenticated;
grant update (read_at) on table public.messages to authenticated;
revoke delete,truncate,references,trigger on table public.messages from public,anon,authenticated;
