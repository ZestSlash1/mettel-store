-- MetTel — Supabase schema
-- Run this first (SQL Editor → paste → Run), then run seed.sql.

-- ----- tables -----
create table if not exists categories (
  id    text primary key,
  label text not null,
  slug  text unique not null,
  active boolean default true
);

create table if not exists products (
  id          text primary key,
  sku         text unique not null,
  category_id text references categories(id) on delete set null,
  name        text not null,
  tagline     text,
  price       integer not null default 0,   -- whole rupees
  currency    text default 'INR',
  status      text default 'available',     -- available | preorder | soldout
  is_featured boolean default false,
  color       text,
  color_hex   text,
  accent_hex  text,
  specs       jsonb default '[]',           -- [{ "k": "MATERIAL", "v": "ARAMID" }]
  image       text,                         -- transparent PNG url, nullable
  models      text[] default '{}',
  stock       integer default 0,
  rank        integer default 0,            -- lower shows first
  created_at  timestamptz default now()
);

create index if not exists products_category_idx on products (category_id);
create index if not exists products_rank_idx on products (rank);

-- ----- row level security -----
-- Anyone can READ the catalogue; only signed-in staff can WRITE.
-- This is what makes the publishable key safe to ship in the browser.
alter table categories enable row level security;
alter table products   enable row level security;

create policy "public read categories"  on categories for select using (true);
create policy "auth write categories"    on categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read products"     on products for select using (true);
create policy "auth write products"      on products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
