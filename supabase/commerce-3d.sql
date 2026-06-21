-- MetTel — commerce + 3D feature columns on products
-- Run this in the Supabase SQL Editor after schema.sql.
--
-- Every column is NULLABLE / defaulted so existing products and orders keep
-- working untouched. Nothing here changes price or stock semantics: price and
-- stock remain single-valued per product (the model the catalogue already uses),
-- so api/create-order.js (the price source of truth) needs NO change.

-- ── Colorway / material variants ─────────────────────────────────────────────
-- A product is one SKU at one price; colorways are presentational variants that
-- drive the 3D material swap and the mobile static-image swap. Each entry:
--   {
--     "id":         "carbon",            -- stable slug, used on the cart line
--     "name":       "Carbon",
--     "material":   "aramid",            -- preset key -> PBR params in the 3D scene
--                                        --   aramid | aluminium | leather | frosted | tpu
--     "color_hex":  "#1b1b1b",
--     "accent_hex": "#ff6b00",
--     "swatch":     "https://…/swatch.png",  -- optional; falls back to color_hex chip
--     "image":      "https://…/carbon.png"   -- product image for the static swap
--   }
-- Empty array  -> product behaves exactly as today (single color_hex/accent_hex).
alter table products add column if not exists colorways jsonb default '[]';

-- ── AR assets (Phase 3) ──────────────────────────────────────────────────────
-- Per-product model files for <model-viewer>. The "View in your space" button is
-- shown ONLY when ar_glb is present AND the device is AR-capable.
alter table products add column if not exists ar_glb  text;  -- Android Scene Viewer
alter table products add column if not exists ar_usdz text;  -- iOS Quick Look

-- ── Cross-sell / "complete the kit" (Phase 4) ────────────────────────────────
-- Admin-curated related product ids. The storefront falls back to category-based
-- suggestions (already implemented in ProductDetail) when this is empty.
alter table products add column if not exists related_ids text[] default '{}';

notify pgrst, 'reload schema';
