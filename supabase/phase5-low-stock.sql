-- MetTel — Phase 5: low-stock threshold setting
-- Run this in the Supabase SQL Editor. Requires supabase/settings.sql to already
-- be applied (this just seeds one more key into that table).

insert into settings (key, value) values
  ('low_stock_threshold', '5')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
