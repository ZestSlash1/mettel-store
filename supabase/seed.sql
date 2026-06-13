-- MetTel seed data — generated from src/data/products.json
-- Run AFTER creating the tables (see schema in this file's header / README).

insert into categories (id, label, slug, active) values
  ('cases', 'Phone Covers', 'phone-covers', true),
  ('accessories', 'Accessories', 'accessories', true),
  ('audio', 'Audio', 'audio', false)
on conflict (id) do update set label = excluded.label, slug = excluded.slug, active = excluded.active;

insert into products (id, sku, category_id, name, tagline, price, currency, status, is_featured, color, color_hex, accent_hex, specs, image, models, stock, rank) values
  ('mt-01-aramid', 'MT-CASE-ARAMID-001', 'cases', 'Aramid Shell 01', '0.95 mm woven aramid. No bulk. No print.', 2499, 'INR', 'available', true, 'Carbon', '#1b1b1b', '#ff6b00', '[{"k":"MATERIAL","v":"600D Aramid Fiber"},{"k":"PROFILE","v":"0.95 MM"},{"k":"DROP","v":"MIL-STD 3.0 M"},{"k":"WEIGHT","v":"14 G"}]'::jsonb, null, array['iPhone 16 Pro','iPhone 16','Pixel 9 Pro'], 120, 1),
  ('mt-02-machined', 'MT-CASE-ALU-002', 'cases', 'Machined Frame 02', 'CNC 6063 aluminium bumper. Bare metal edge.', 3299, 'INR', 'available', true, 'Raw Silver', '#c9c9c9', '#ff6b00', '[{"k":"MATERIAL","v":"6063 ALUMINIUM"},{"k":"FINISH","v":"BEAD BLAST"},{"k":"PROFILE","v":"2.10 MM"},{"k":"WEIGHT","v":"31 G"}]'::jsonb, null, array['iPhone 16 Pro Max','iPhone 16 Pro'], 64, 2),
  ('mt-03-translucent', 'MT-CASE-TPU-003', 'cases', 'Translucent 03', 'Frosted polycarbonate. Tactile grip rails.', 1499, 'INR', 'available', false, 'Smoke', '#8a8a8a', '#ff6b00', '[{"k":"MATERIAL","v":"FROSTED PC"},{"k":"PROFILE","v":"1.40 MM"},{"k":"GRIP","v":"MICRO-RAIL"},{"k":"WEIGHT","v":"19 G"}]'::jsonb, null, array['iPhone 16','Galaxy S25'], 240, 3),
  ('mt-04-magsafe-puck', 'MT-ACC-MAG-004', 'accessories', 'Mag Puck 04', '15W magnetic dock. Anodised disc, braided lead.', 2199, 'INR', 'preorder', true, 'Orange', '#ff6b00', '#000000', '[{"k":"OUTPUT","v":"15 W MAGNETIC"},{"k":"CABLE","v":"1.5 M BRAIDED"},{"k":"BODY","v":"ANODISED ALU"},{"k":"INPUT","v":"USB-C PD"}]'::jsonb, null, array['Universal Qi2'], 0, 4),
  ('mt-05-lanyard', 'MT-ACC-CORD-005', 'accessories', 'Utility Cord 05', 'Climbing-grade cord. Adjustable crossbody.', 899, 'INR', 'available', false, 'Hi-Vis', '#ff8a1f', '#000000', '[{"k":"MATERIAL","v":"8 MM NYLON"},{"k":"LOAD","v":"120 KG"},{"k":"LENGTH","v":"ADJUSTABLE"},{"k":"CLIP","v":"STEEL HOOK"}]'::jsonb, null, array['Universal'], 310, 5),
  ('mt-06-leather', 'MT-CASE-LTHR-006', 'cases', 'Full-Grain 06', 'Vegetable-tanned leather. Ages with use.', 2899, 'INR', 'available', false, 'Tan', '#a86b3c', '#ff6b00', '[{"k":"MATERIAL","v":"FULL-GRAIN"},{"k":"TANNING","v":"VEGETABLE"},{"k":"PROFILE","v":"1.80 MM"},{"k":"WEIGHT","v":"26 G"}]'::jsonb, null, array['iPhone 16 Pro','Pixel 9'], 88, 6)
on conflict (id) do update set
  name = excluded.name, tagline = excluded.tagline, price = excluded.price,
  status = excluded.status, is_featured = excluded.is_featured, specs = excluded.specs,
  image = excluded.image, models = excluded.models, stock = excluded.stock, rank = excluded.rank;
