-- MetTel — Orders table
-- Run this in the Supabase SQL Editor (paste → Run) after schema.sql.
--
-- Orders are written ONLY by the serverless functions (api/create-order.js,
-- api/verify-payment.js) using the service_role key, which bypasses RLS.
-- The browser never inserts or updates here — there is deliberately no public
-- write policy. Admins read their orders through their authenticated session.

create table if not exists orders (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  razorpay_order_id   text,
  razorpay_payment_id text,
  status              text default 'created',   -- created | paid | failed
  amount              integer,                  -- paise (rupees × 100)
  currency            text default 'INR',
  customer_name       text,
  customer_email      text,
  customer_phone      text,
  shipping_address    jsonb,
  items               jsonb
);

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_rzp_order_idx on orders (razorpay_order_id);

-- ----- row level security -----
-- Authenticated staff can READ orders. No public insert/update/delete policy:
-- the only writer is the serverless function using the service_role key, which
-- bypasses RLS entirely. This keeps customer details out of public reach.
alter table orders enable row level security;

create policy "auth read orders" on orders for select
  using (auth.role() = 'authenticated');
