-- Multi-image gallery + back-in-stock notifications
-- Run in the Supabase SQL editor.

-- Images array on products.
-- `image` stays as the primary/legacy field; `images` holds the full gallery.
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Back-in-stock notifications: customers sign up when a product is sold out.
CREATE TABLE IF NOT EXISTS stock_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  text NOT NULL,
  email       text NOT NULL,
  notified    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, email)
);

ALTER TABLE stock_notifications ENABLE ROW LEVEL SECURITY;

-- Anyone (including guests) can insert their email; only service_role reads.
CREATE POLICY "public insert stock_notifications" ON stock_notifications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
