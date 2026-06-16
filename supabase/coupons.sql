-- MetTel — discount coupons
-- Run this in the Supabase SQL Editor.
--
-- Coupons are validated/applied SERVER-SIDE (api/validate-coupon, create-order)
-- so the discount can never be forged by the client. The table is admin-managed
-- (authenticated read/write); the serverless functions use the service_role key.

create table if not exists coupons (
  code         text primary key,            -- uppercase code, e.g. WELCOME10
  type         text not null default 'percent',  -- percent | fixed
  value        integer not null default 0,  -- percent: 0–100 ; fixed: rupees off
  min_subtotal integer default 0,           -- rupees; minimum cart subtotal
  active       boolean default true,
  expires_at   timestamptz,                 -- null = no expiry
  usage_limit  integer,                      -- null = unlimited
  used_count   integer default 0,
  created_at   timestamptz default now()
);

alter table coupons enable row level security;
create policy "auth read coupons"  on coupons for select using (auth.role() = 'authenticated');
create policy "auth write coupons" on coupons for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Applied coupon recorded on the order.
alter table orders add column if not exists coupon_code text;
alter table orders add column if not exists discount integer default 0; -- paise

-- Atomic usage increment (server only).
create or replace function increment_coupon_use(p_code text)
returns void language sql as $$
  update coupons set used_count = coalesce(used_count, 0) + 1 where code = p_code;
$$;
revoke execute on function increment_coupon_use(text) from anon, authenticated;

notify pgrst, 'reload schema';
