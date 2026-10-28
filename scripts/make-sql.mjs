// Generates supabase/setup.sql from src/data/seed.js so the SQL and the
// starter menu never drift apart.  Run: node scripts/make-sql.mjs
import fs from 'node:fs'
import { seedSettings, seedCategories, seedItems } from '../src/data/seed.js'

const q = (v) => (v === null || v === undefined ? 'null' : typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : String(v))
const row = (obj, cols) => `(${cols.map((c) => q(obj[c])).join(', ')})`

const catCols = ['id', 'name', 'script', 'sort']
const itemCols = ['id', 'category_id', 'script', 'name', 'description', 'price', 'old_price', 'is_veg', 'image_url', 'is_available', 'is_hidden', 'is_featured', 'sort']
const setCols = Object.keys(seedSettings)

const sql = `-- La Pausa Caffè menu — run this whole file once in Supabase → SQL Editor.
-- Then add your admin email at the bottom (see STEP 5).

-- STEP 1: tables -------------------------------------------------------------
create table if not exists public.categories (
  id text primary key,
  name text not null,
  script text default '',
  sort int not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.items (
  id text primary key,
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  script text default '',
  name text not null,
  description text default '',
  price int not null default 0,
  old_price int,
  is_veg boolean not null default true,
  image_url text,
  is_available boolean not null default true,
  is_hidden boolean not null default false,
  is_featured boolean not null default false,
  sort int not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  cafe_name text,
  tagline text,
  offer_text text,
  note_text text,
  phone text,
  instagram text,
  address text,
  maps_url text
);

-- Only emails listed here can edit the menu.
create table if not exists public.admins (
  email text primary key
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- STEP 2: security (everyone can read, only admins can write) ----------------
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.settings enable row level security;
alter table public.admins enable row level security;

drop policy if exists "read categories" on public.categories;
drop policy if exists "admin categories" on public.categories;
drop policy if exists "read items" on public.items;
drop policy if exists "admin items" on public.items;
drop policy if exists "read settings" on public.settings;
drop policy if exists "admin settings" on public.settings;

create policy "read categories" on public.categories for select using (true);
create policy "admin categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "read items" on public.items for select using (true);
create policy "admin items" on public.items for all using (public.is_admin()) with check (public.is_admin());
create policy "read settings" on public.settings for select using (true);
create policy "admin settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());
-- admins table has no policies, so nobody can read or change it from the site.

-- STEP 3: image storage --------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do update set public = true;

drop policy if exists "read menu images" on storage.objects;
drop policy if exists "admin upload menu images" on storage.objects;
drop policy if exists "admin update menu images" on storage.objects;
drop policy if exists "admin delete menu images" on storage.objects;

create policy "read menu images" on storage.objects for select using (bucket_id = 'menu-images');
create policy "admin upload menu images" on storage.objects for insert with check (bucket_id = 'menu-images' and public.is_admin());
create policy "admin update menu images" on storage.objects for update using (bucket_id = 'menu-images' and public.is_admin());
create policy "admin delete menu images" on storage.objects for delete using (bucket_id = 'menu-images' and public.is_admin());

-- STEP 4: starter menu ---------------------------------------------------------
insert into public.settings (${setCols.join(', ')}) values
${row(seedSettings, setCols)}
on conflict (id) do nothing;

insert into public.categories (${catCols.join(', ')}) values
${seedCategories.map((c) => row(c, catCols)).join(',\n')}
on conflict (id) do nothing;

insert into public.items (${itemCols.join(', ')}) values
${seedItems.map((i) => row(i, itemCols)).join(',\n')}
on conflict (id) do nothing;

-- STEP 5: your admin login -----------------------------------------------------
-- 1. Supabase → Authentication → Users → "Add user" → enter email + password
--    (tick "Auto confirm user").
-- 2. Put that same email below and run just this line:
-- insert into public.admins (email) values ('owner@example.com');
`

fs.mkdirSync(new URL('../supabase/', import.meta.url), { recursive: true })
fs.writeFileSync(new URL('../supabase/setup.sql', import.meta.url), sql)
console.log('wrote supabase/setup.sql')
