-- Firebase-authenticated customer profiles.
-- This table is separate from Supabase Auth (used by staff/admin login,
-- wishlists, reviews — see schema.sql / reviews-wishlist.sql, untouched).
-- Firebase handles phone OTP + Google sign-in; this table just mirrors the
-- resulting Firebase user so the app has a row to attach app data to.

create table if not exists users (
  id           uuid primary key default gen_random_uuid(),
  firebase_uid text unique not null,
  phone        text,
  email        text,
  display_name text,
  photo_url    text,
  created_at   timestamptz default now(),
  last_login   timestamptz default now()
);

create index if not exists users_firebase_uid_idx on users (firebase_uid);

alter table users enable row level security;

drop policy if exists "own row select" on users;
drop policy if exists "own row insert" on users;
drop policy if exists "own row update" on users;

-- IMPORTANT: these policies only work once Firebase is registered as a
-- Third-Party Auth provider in the Supabase dashboard (Authentication ->
-- Sign In / Providers -> Third-Party Auth -> add your Firebase project).
-- That's what makes Supabase verify the Firebase ID token's signature and
-- expose its claims through auth.jwt(). The token is attached client-side
-- by src/lib/supabaseFirebaseClient.js (a client dedicated to this table —
-- the app's main Supabase client in supabaseClient.js is untouched).
--
-- Until that dashboard step is done, auth.jwt() is null for these requests
-- and every policy below evaluates to false — writes/reads fail closed
-- rather than silently falling open to "any anon request".
create policy "own row select" on users for select
  using (firebase_uid = (auth.jwt() ->> 'sub'));

create policy "own row insert" on users for insert
  with check (firebase_uid = (auth.jwt() ->> 'sub'));

create policy "own row update" on users for update
  using (firebase_uid = (auth.jwt() ->> 'sub'))
  with check (firebase_uid = (auth.jwt() ->> 'sub'));
