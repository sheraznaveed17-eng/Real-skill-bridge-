-- Skill Bridge profile photo storage setup
-- Run once in Supabase Dashboard > SQL Editor > New query.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Public avatar images are viewable" on storage.objects;
create policy "Public avatar images are viewable"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Members upload own avatar" on storage.objects;
create policy "Members upload own avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members update own avatar" on storage.objects;
create policy "Members update own avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members delete own avatar" on storage.objects;
create policy "Members delete own avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
