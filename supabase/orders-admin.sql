-- MetTel — order admin fields (fulfilment + invoicing)
-- Run this in the Supabase SQL Editor after orders.sql.
--
-- Adds fulfilment/tracking/notes/invoice columns. No new RLS policy is needed:
-- admins read via their authenticated session (existing "auth read orders"),
-- and writes go through the api/update-order serverless function using the
-- service_role key (which bypasses RLS) after verifying the admin's token.

alter table orders add column if not exists tracking_number text;
alter table orders add column if not exists carrier text;
alter table orders add column if not exists admin_notes text;
alter table orders add column if not exists invoice_number text;
alter table orders add column if not exists updated_at timestamptz default now();

create index if not exists orders_status_idx on orders (status);

-- Backfill an invoice number for any existing orders that don't have one.
update orders
  set invoice_number = 'MT-' || to_char(created_at, 'YYYYMMDD') || '-' || upper(substr(replace(id::text,'-',''), 1, 6))
  where invoice_number is null;
