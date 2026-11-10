-- Skill Bridge: private-owner upload, public display for gig cover images.
-- Run once in Supabase Dashboard > SQL Editor > New query.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('gig-images','gig-images',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Gig images are publicly viewable" on storage.objects;
create policy "Gig images are publicly viewable"
on storage.objects for select
using (bucket_id = 'gig-images');

drop policy if exists "Sellers upload images to their own folder" on storage.objects;
create policy "Sellers upload images to their own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'gig-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Sellers update images in their own folder" on storage.objects;
create policy "Sellers update images in their own folder"
on storage.objects for update to authenticated
using (
  bucket_id = 'gig-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'gig-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Sellers delete images in their own folder" on storage.objects;
create policy "Sellers delete images in their own folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'gig-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
