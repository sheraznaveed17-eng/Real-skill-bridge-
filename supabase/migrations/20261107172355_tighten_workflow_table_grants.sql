-- Applied to Skill Bridge production on 2026-11-07.
revoke all on table public.conversations,public.custom_offers,public.orders from public,anon;
grant select,insert on table public.conversations to authenticated;
grant update (last_message,updated_at) on table public.conversations to authenticated;
revoke delete,truncate,references,trigger on table public.conversations from authenticated;
grant select,insert on table public.custom_offers to authenticated;
grant update (status) on table public.custom_offers to authenticated;
revoke delete,truncate,references,trigger on table public.custom_offers from authenticated;
grant select on table public.orders to authenticated;
revoke insert,update,delete,truncate,references,trigger on table public.orders from authenticated;
