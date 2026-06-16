-- Product reviews + customer wishlists
-- Run in the Supabase SQL editor.

-- ── Reviews ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  text NOT NULL,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email       text NOT NULL DEFAULT '',
  name        text NOT NULL DEFAULT 'Anonymous',
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        text,
  approved    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews (product_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Shoppers see only approved reviews (or their own pending one).
CREATE POLICY "read reviews" ON reviews
  FOR SELECT USING (
    approved = true
    OR (user_id IS NOT NULL AND user_id = auth.uid())
    OR (SELECT is_admin())
  );

-- Any authenticated user can submit a review.
CREATE POLICY "auth insert review" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can approve / reject / delete.
CREATE POLICY "admin update review" ON reviews
  FOR UPDATE TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

CREATE POLICY "admin delete review" ON reviews
  FOR DELETE TO authenticated
  USING ((SELECT is_admin()));

-- ── Wishlists ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own wishlist" ON wishlists
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
