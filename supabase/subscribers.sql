-- Newsletter subscribers
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  active     boolean NOT NULL DEFAULT true,
  source     text DEFAULT 'website',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
-- No public policies — inserts go through the service_role in api/subscribe.js.

NOTIFY pgrst, 'reload schema';
