-- MetTel — phone models reference table (OPTIONAL)
-- Run this in the Supabase SQL Editor only if you want a canonical device list.
--
-- WHY OPTIONAL: the catalogue already stores compatibility as products.models
-- (text[] of device labels, e.g. {"iPhone 16 Pro","Pixel 9 Pro"}) and that keeps
-- working unchanged. This table does NOT replace it — it ENRICHES it:
--   • gives the admin a canonical pick-list instead of free-text typing, and
--   • supplies per-device proportions so the 3D hero can swap to the right
--     silhouette (Phase 2). products.models[i] joins to phone_models.label.
--
-- Skip this file entirely and the model selector still works off products.models;
-- it just won't have brand grouping or device-accurate 3D proportions.

create table if not exists phone_models (
  label       text primary key,          -- must match the strings in products.models
  brand       text,                      -- 'Apple' | 'Google' | 'Samsung' | …
  -- Relative body proportions for the procedural 3D device (1.0 = baseline).
  -- Lets the hero render an iPhone vs a Pixel without per-device meshes.
  aspect      numeric default 2.1,       -- height / width
  corner      numeric default 0.34,      -- corner radius factor
  camera_layout text default 'triple',   -- 'triple' | 'dual' | 'single' | 'square'
  rank        integer default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);

alter table phone_models enable row level security;

drop policy if exists "public read phone_models" on phone_models;
drop policy if exists "admin write phone_models" on phone_models;

create policy "public read phone_models" on phone_models for select using (true);
create policy "admin write phone_models" on phone_models for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed the models already referenced in the seed catalogue.
insert into phone_models (label, brand, aspect, corner, camera_layout, rank) values
  ('iPhone 16 Pro Max', 'Apple',   2.16, 0.34, 'triple', 1),
  ('iPhone 16 Pro',     'Apple',   2.16, 0.34, 'triple', 2),
  ('iPhone 16',         'Apple',   2.16, 0.36, 'dual',   3),
  ('Pixel 9 Pro',       'Google',  2.10, 0.30, 'triple', 4),
  ('Pixel 9',           'Google',  2.10, 0.30, 'dual',   5),
  ('Galaxy S25',        'Samsung', 2.18, 0.26, 'triple', 6)
on conflict (label) do nothing;

notify pgrst, 'reload schema';
