-- Count a gig impression only after its card is visibly on screen.
alter table public.gig_events add column if not exists visitor_key text;

-- Old impressions were recorded for every fetched gig, not just visible cards.
-- Remove those inaccurate historical counts; preserve click events.
delete from public.gig_events where event_type = 'impression';

create unique index if not exists gig_events_unique_user_impression
  on public.gig_events (gig_id, actor_id)
  where event_type = 'impression' and actor_id is not null;

create unique index if not exists gig_events_unique_visitor_impression
  on public.gig_events (gig_id, visitor_key)
  where event_type = 'impression' and actor_id is null and visitor_key is not null;

drop policy if exists "Public visitors can record gig events" on public.gig_events;
create policy "Public visitors can record gig events"
  on public.gig_events for insert to anon
  with check (
    actor_id is null
    and event_type in ('impression', 'click')
    and (event_type <> 'impression' or visitor_key is not null)
    and exists (
      select 1 from public.gigs g
      where g.id = gig_id and g.is_active = true
    )
  );

drop policy if exists "Signed-in users can record gig events" on public.gig_events;
create policy "Signed-in users can record gig events"
  on public.gig_events for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and event_type in ('impression', 'click')
    and (event_type <> 'impression' or visitor_key is not null)
    and exists (
      select 1 from public.gigs g
      where g.id = gig_id
        and g.is_active = true
        and g.seller_id <> (select auth.uid())
    )
  );
