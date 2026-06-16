-- Abandoned cart recovery
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS carts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  items       JSONB NOT NULL DEFAULT '[]',
  converted   boolean NOT NULL DEFAULT false,
  emailed     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Unique on email — one active cart per email address.
CREATE UNIQUE INDEX IF NOT EXISTS carts_email_idx ON carts (email) WHERE converted = false;

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
-- No public policies — only service_role reads/writes via the API functions.

NOTIFY pgrst, 'reload schema';
