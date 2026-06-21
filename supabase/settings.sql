-- MetTel — storefront settings (key/value)
-- Run this in the Supabase SQL Editor.
--
-- The app already reads/writes settings via src/lib/dataStore.js (getSetting/
-- setSetting), but the table was never captured as a migration. This formalises
-- it. Settings hold NON-SENSITIVE storefront config (hero image, free-shipping
-- threshold, trust-block copy) so the table is PUBLIC-READABLE (the storefront
-- needs the threshold at runtime) and ADMIN-WRITABLE.

create table if not exists settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);

alter table settings enable row level security;

drop policy if exists "public read settings" on settings;
drop policy if exists "admin write settings" on settings;

-- Anyone may read (values are storefront config, safe to expose).
create policy "public read settings" on settings for select using (true);

-- Only admins may write. Falls back to authenticated if is_admin() (accounts.sql)
-- has not been run yet; tighten to is_admin() once accounts.sql is applied.
create policy "admin write settings" on settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed defaults (no-op if a value already exists).
insert into settings (key, value) values
  ('free_shipping_threshold', '1499'),
  ('trust_secure_text',  'Secure checkout'),
  ('trust_returns_text',  '30-day returns'),
  ('trust_madein_text',  'Made in India')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
