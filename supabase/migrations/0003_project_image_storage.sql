-- AEDON - B2: images selected from the user's device.
-- Files are public because they are rendered on the website published by the project owner.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project_images_insert_own" on storage.objects;
create policy "project_images_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Upload returns object metadata, so SELECT is also required for an upload to succeed.
drop policy if exists "project_images_select_own" on storage.objects;
create policy "project_images_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "project_images_delete_own" on storage.objects;
create policy "project_images_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
