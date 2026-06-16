-- MetTel — customer accounts + admin allowlist (security hardening)
-- Run this in the Supabase SQL Editor.
--
-- Opening customer sign-up means "authenticated" is no longer the same as
-- "admin". This switches catalogue/coupon writes to ADMIN-ONLY and scopes
-- order reads so customers see only their own orders. Run this BEFORE shipping
-- the customer-accounts UI, or the admin panel's is_admin() check fails.

-- ----- admin allowlist -----
create table if not exists admins ( email text primary key );
insert into admins (email) values ('shahzeb.tanweer@gmail.com') on conflict do nothing;
alter table admins enable row level security;  -- no policies: only is_admin()/service_role read it

-- Is the current signed-in user an admin? SECURITY DEFINER so it can read the
-- admins table regardless of RLS. Pinned search_path for safety.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from admins a where a.email = (auth.jwt() ->> 'email'));
$$;

-- ----- tighten write access to admins only -----
drop policy if exists "auth write products" on products;
create policy "admin write products" on products for all
  using (is_admin()) with check (is_admin());

drop policy if exists "auth write categories" on categories;
create policy "admin write categories" on categories for all
  using (is_admin()) with check (is_admin());

drop policy if exists "auth read coupons" on coupons;
drop policy if exists "auth write coupons" on coupons;
create policy "admin all coupons" on coupons for all
  using (is_admin()) with check (is_admin());

-- ----- orders: admins see all, customers see only their own -----
drop policy if exists "auth read orders" on orders;
create policy "read own or admin orders" on orders for select
  using (is_admin() or customer_email = (auth.jwt() ->> 'email'));

notify pgrst, 'reload schema';
