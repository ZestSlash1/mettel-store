# MetTel — Storefront

Tech-brutalist e-commerce front end for **mettel.in** — high-end phone covers and accessories.
Aesthetic: Teenage Engineering–inspired minimalism. Light silver canvas, stark black type,
burnt-orange accents, monospace spec sheets.

## Stack

- **React 18 + Vite** — fast dev/build
- **Tailwind CSS** — design tokens in `tailwind.config.js`
- **Framer Motion** — page-load reveals, floating product, pill micro-interactions
- **Supabase** — optional; the UI runs on local JSON until you connect a backend

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

To go live with data, copy `.env.example` to `.env` and fill in your keys.
Until then, the storefront automatically serves `src/data/products.json`.

```bash
cp .env.example .env
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

## Folder structure

```
mettel-store/
├── index.html              # Google Fonts: Archivo, Space Grotesk, Space Mono, Silkscreen
├── package.json
├── vite.config.js
├── tailwind.config.js      # brand palette + fonts + animations
├── postcss.config.js
├── .env.example
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx             # top-level layout
    ├── index.css          # Tailwind layers + base brutalist styles
    ├── lib/
    │   └── supabaseClient.js   # initializes only when env vars exist
    ├── data/
    │   └── products.json       # seed data, Supabase-shaped
    ├── hooks/
    │   └── useProducts.js      # Supabase OR local fallback, same shape
    └── components/
        ├── Navigation.jsx      # floating control-panel pill nav
        ├── Hero.jsx            # overlapping mega-type + floating product
        ├── ProductGrid.jsx     # masonry grid + category filter
        ├── ProductCard.jsx     # hover scale + bg shift
        ├── PhoneCase.jsx       # self-contained SVG product (swap for PNGs)
        └── Footer.jsx
```

## Adding a new product category (modular by design)

1. Add a row to `categories` (or the `categories` array in the seed file).
2. Add products with that `category_id`. The grid's filter pills and the
   `useProducts({ category })` hook pick it up with no code changes.
3. For real photography, set `product.image` to a transparent PNG URL — the
   card and hero render `<img>` instead of the vector `PhoneCase`.

## Supabase schema

```sql
create table categories (
  id    text primary key,
  label text not null,
  slug  text unique not null,
  active boolean default true
);

create table products (
  id          text primary key,
  sku         text unique not null,
  category_id text references categories(id),
  name        text not null,
  tagline     text,
  price       integer not null,          -- rupees (integer)
  currency    text default 'INR',
  status      text default 'available',  -- available | preorder | soldout
  is_featured boolean default false,
  color       text,
  color_hex   text,
  accent_hex  text,
  specs       jsonb default '[]',        -- [{ "k": "MATERIAL", "v": "ARAMID" }, ...]
  image       text,                      -- transparent PNG url, nullable
  models      text[] default '{}',
  stock       integer default 0,
  rank        integer default 0,         -- display order
  created_at  timestamptz default now()
);
```

The hook orders by `rank`, filters `active` categories, and falls back to the
seed file on any fetch error — so the front end never shows an empty page.

## Admin control panel

Open **`/admin`** (or click the `#` button in the storefront nav) to manage the
catalogue through a UI instead of editing JSON.

What you can do:

- **Products** — add, edit, duplicate, and delete. The form covers every field,
  including a live preview, color pickers for the shell/accent, and a dynamic
  spec-sheet editor (add/remove rows).
- **Categories** — add, rename, show/hide, and delete. A category that still has
  products attached can't be deleted until you reassign or remove them.
- Every change is **live**: the storefront updates instantly (same tab and across
  tabs), because both read from one data store.

### Where changes are saved

- **Supabase connected** → writes go straight to your database.
- **Not connected (default)** → changes save to your browser (localStorage), so
  you can build the catalogue with no backend. The top bar shows which mode
  you're in. In local mode you also get:
  - **Export JSON** — downloads the current catalogue as `products.json`. Drop it
    into `src/data/` and commit to make changes permanent in the repo.
  - **Import** — load a `products.json` back in.
  - **Reset** — restore the original seed.

> Note: the admin panel has no login yet. Before going live, gate `/admin`
> behind Supabase Auth (or your host's access control).

### Deploying (BrowserRouter)

Routing uses clean paths (`/admin`), so static hosts need a catch-all rewrite to
`index.html` or refreshing `/admin` 404s. One line:

- **Netlify** — add `public/_redirects` with: `/*  /index.html  200`
- **Vercel** — add `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

`npm run dev` and `npm run preview` already handle this automatically.

## Storefront: detail page & cart

- **Product detail** lives at `/product/:id`. Cards link to it from the grid and
  related items. It has a model selector, add-to-bag, the full spec sheet, and a
  "More in {category}" row.
- **Cart** is global (the bag icon in the nav, with a live count). It persists to
  localStorage, so it survives refreshes. Add from any card or the detail page;
  adjust quantities or remove lines in the slide-over drawer.
- **Checkout** is intentionally a stub in `CartDrawer.jsx` — it confirms and
  clears the bag. Drop in Razorpay/Stripe (or a Supabase `orders` insert) at the
  `checkout()` handler when you're ready to take payments.

## Protecting /admin (Supabase Auth)

`/admin` is wrapped in an auth gate:

- **No Supabase keys (local dev)** → the panel stays open with an amber
  "Auth disabled" banner, so you can work without setting up a backend.
- **Supabase configured** → visitors get a sign-in screen. Only authenticated
  users reach the dashboard; a Sign out button sits in the top bar.

Create your admin user once in the Supabase dashboard → **Authentication → Users
→ Add user** (email + password). For real security, also turn on Row Level
Security and restrict writes on `products`/`categories` to authenticated users:

```sql
alter table products enable row level security;
alter table categories enable row level security;

create policy "public read"  on products   for select using (true);
create policy "auth write"   on products   for all    using (auth.role() = 'authenticated');
create policy "public read"  on categories for select using (true);
create policy "auth write"   on categories for all    using (auth.role() = 'authenticated');
```
