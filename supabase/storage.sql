-- MetTel — Supabase Storage for product images
-- Run this in the SQL Editor (paste → Run) after schema.sql.
--
-- Creates a PUBLIC bucket so image URLs render without signed links, and
-- restricts writes to authenticated admins (signed in via Supabase Auth).
-- Storage RLS keys off the same publishable anon key the storefront already
-- uses — no new env vars.

-- ----- bucket -----
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- ----- policies on storage.objects (RLS is already enabled by Supabase) -----
-- Anyone can VIEW objects in this bucket (public catalogue images).
create policy "public read product-images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only signed-in admins can upload / replace / delete.
create policy "auth insert product-images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

create policy "auth update product-images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

create policy "auth delete product-images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');
