-- MetTel — inventory + fulfilment idempotency
-- Run this in the Supabase SQL Editor after orders-admin.sql.

-- Guards so a paid order commits stock and sends its confirmation exactly once,
-- even if both verify-payment and the Razorpay webhook fire.
alter table orders add column if not exists stock_committed boolean default false;
alter table orders add column if not exists confirmation_sent boolean default false;

-- Atomic stock decrement. Takes a jsonb array [{ "id": "...", "qty": 1 }, ...]
-- and reduces each product's stock, clamped at 0.
create or replace function decrement_stock(items jsonb)
returns void
language plpgsql
as $$
declare
  it jsonb;
begin
  for it in select jsonb_array_elements(items)
  loop
    update products
       set stock = greatest(0, coalesce(stock, 0) - greatest(0, (it->>'qty')::int))
     where id = (it->>'id');
  end loop;
end;
$$;

-- Only the server (service_role, which bypasses these grants) may decrement.
-- Without this, anyone with the public anon key could call it to drain stock.
revoke execute on function decrement_stock(jsonb) from anon, authenticated;

notify pgrst, 'reload schema';
