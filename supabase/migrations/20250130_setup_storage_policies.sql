-- Ensure required storage buckets exist
insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Remove existing conflicting policies
drop policy if exists "Public read for avatars" on storage.objects;
drop policy if exists "Public read for post images" on storage.objects;
drop policy if exists "Users can upload avatars" on storage.objects;
drop policy if exists "Users can upload post images" on storage.objects;
drop policy if exists "Users can update their storage objects" on storage.objects;
drop policy if exists "Users can delete their storage objects" on storage.objects;

-- Allow public read access for the two buckets
create policy "Public read for avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Public read for post images" on storage.objects
  for select using (bucket_id = 'post-images');

-- Allow authenticated users to upload/update/delete their own files within each bucket
create policy "Users can upload avatars" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and auth.uid() = owner
  );

create policy "Users can upload post images" on storage.objects
  for insert with check (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and auth.uid() = owner
  );

create policy "Users can update their storage objects" on storage.objects
  for update using (
    auth.role() = 'authenticated'
    and auth.uid() = owner
    and bucket_id in ('avatars', 'post-images')
  )
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = owner
    and bucket_id in ('avatars', 'post-images')
  );

create policy "Users can delete their storage objects" on storage.objects
  for delete using (
    auth.role() = 'authenticated'
    and auth.uid() = owner
    and bucket_id in ('avatars', 'post-images')
  );
