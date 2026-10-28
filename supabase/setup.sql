-- La Pausa Caffè menu — run this whole file once in Supabase → SQL Editor.
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
insert into public.settings (id, cafe_name, tagline, offer_text, note_text, phone, instagram, address, maps_url) values
(1, 'La Pausa Caffè', 'Take a pause. Stay a while.', 'Buy 1 Get 1 on all shakes', 'Bulk orders taken for events · Birthday parties & special events organised', '', '', 'Ooty, Tamil Nadu', 'https://www.google.com/maps/place/La+Pausa+Caffe/@11.4159248,76.6830996,17z')
on conflict (id) do nothing;

insert into public.categories (id, name, script, sort) values
('burgers', 'Burgers', 'Stacked', 1),
('sandwiches', 'Sandwiches', 'Grilled', 2),
('fries-nuggets', 'Fries & Nuggets', 'Crispy', 3),
('momos', 'Momos', 'Steamed', 4),
('maggi-omelette', 'Maggi & Omelette', 'Comfort', 5),
('hot-drinks', 'Hot Drinks', 'Freshly brewed', 6),
('shakes-juices', 'Shakes & Juices', 'Chilled', 7),
('desserts', 'Desserts', 'Sweet', 8)
on conflict (id) do nothing;

insert into public.items (id, category_id, script, name, description, price, old_price, is_veg, image_url, is_available, is_hidden, is_featured, sort) values
('veg-burger', 'burgers', 'Classic', 'Veg Burger', 'Crispy veg patty, lettuce, tomato and house mayo in a soft toasted bun.', 99, null, true, '/menu/veg-burger.webp', true, false, false, 1),
('veg-cheese-burger', 'burgers', 'Cheesy', 'Veg Cheese Burger', 'Our veg burger loaded with a melting cheese slice, onions and tangy sauce.', 119, null, true, '/menu/veg-burger-with-cheese.webp', true, false, false, 2),
('paneer-burger', 'burgers', 'Spiced', 'Paneer Burger', 'Golden fried paneer patty with mint mayo, onions and fresh lettuce.', 129, null, true, '/menu/paneer-burger.webp', true, false, false, 3),
('chicken-burger', 'burgers', 'Crispy', 'Chicken Burger', 'Crunchy fried chicken fillet, cheese, slaw and our signature burger sauce.', 149, 179, false, '/menu/chicken-burger.webp', true, false, true, 4),
('veg-sandwich', 'sandwiches', 'Grilled', 'Veg Sandwich', 'Cucumber, tomato, onion and capsicum with green chutney, grilled golden.', 89, null, true, '/menu/veg-sandwich.webp', true, false, false, 5),
('cheese-sandwich', 'sandwiches', 'Melty', 'Cheese Sandwich', 'Loaded with cheese and grilled until it stretches with every bite.', 99, null, true, '/menu/cheese-sandwich.webp', true, false, false, 6),
('paneer-sandwich', 'sandwiches', 'Tikka', 'Paneer Sandwich', 'Spiced paneer tikka filling with onions and mint mayo, toasted crisp.', 119, null, true, '/menu/paneer-sandwich.webp', true, false, false, 7),
('chicken-sandwich', 'sandwiches', 'Club', 'Chicken Sandwich', 'Creamy shredded chicken, lettuce and pepper mayo between toasted bread.', 139, null, false, '/menu/chicken-sandwich.webp', true, false, false, 8),
('french-fries', 'fries-nuggets', 'Salted', 'French Fries', 'Golden, crispy fries tossed in salt and served with ketchup.', 89, null, true, '/menu/french-fries.webp', true, false, false, 9),
('peri-peri-fries', 'fries-nuggets', 'Spicy', 'Peri Peri Fries', 'Crispy fries dusted with hot and tangy peri peri spice.', 109, null, true, '/menu/peri-peri-french-fries.webp', true, false, false, 10),
('veg-nuggets', 'fries-nuggets', 'Golden', 'Veg Nuggets', 'Bite-sized crumbed veg nuggets, crisp outside and soft inside.', 99, null, true, '/menu/veg-nuggets.webp', true, false, false, 11),
('chicken-nuggets', 'fries-nuggets', 'Crunchy', 'Chicken Nuggets', 'Juicy chicken nuggets fried golden, served with a dip.', 139, null, false, '/menu/chicken-nuggets.webp', true, false, false, 12),
('veg-momos', 'momos', 'Steamed', 'Veg Momos', 'Soft dumplings stuffed with cabbage, carrot and spring onion, with red chutney.', 99, null, true, '/menu/veg-momos.webp', true, false, false, 13),
('paneer-momos', 'momos', 'Steamed', 'Paneer Momos', 'Delicate dumplings filled with spiced paneer, served with spicy chutney.', 119, null, true, '/menu/paneer-momos.webp', true, false, false, 14),
('chicken-momos', 'momos', 'Pan fried', 'Chicken Momos', 'Juicy minced chicken dumplings, served hot with fiery red chutney.', 129, null, false, '/menu/chicken-momos.webp', true, false, false, 15),
('plain-maggi', 'maggi-omelette', 'Simple', 'Plain Maggi', 'The classic masala Maggi, cooked just right.', 59, null, true, '/menu/plain-maggi.webp', true, false, false, 16),
('veg-maggi', 'maggi-omelette', 'Loaded', 'Veg Maggi', 'Masala Maggi tossed with peas, carrot, onion and capsicum.', 79, null, true, '/menu/veg-maggi.webp', true, false, false, 17),
('egg-maggi', 'maggi-omelette', 'Topped', 'Egg Maggi', 'Masala Maggi topped with a sunny side up egg.', 89, null, false, '/menu/egg-maggi.webp', true, false, false, 18),
('chicken-maggi', 'maggi-omelette', 'Hearty', 'Chicken Maggi', 'Masala Maggi cooked with spiced chicken pieces and veggies.', 109, null, false, '/menu/chicken-maggi.webp', true, false, false, 19),
('bread-omelette', 'maggi-omelette', 'Street style', 'Bread Omelette', 'Fluffy masala omelette folded with toasted bread.', 69, null, false, '/menu/bread-omelette.webp', true, false, false, 20),
('chicken-bread-omelette', 'maggi-omelette', 'Loaded', 'Chicken Bread Omelette', 'Masala omelette with shredded chicken, folded in toasted bread.', 109, null, false, '/menu/chicken-bread-omelette.webp', true, false, false, 21),
('coffee', 'hot-drinks', 'Strong', 'Coffee', 'Freshly brewed hot coffee, bold and smooth.', 40, null, true, '/menu/black-coffee.webp', true, false, false, 22),
('cappuccino', 'hot-drinks', 'Frothy', 'Cappuccino', 'Espresso with steamed milk and a thick layer of foam.', 99, null, true, '/menu/cappuccino.webp', true, false, false, 23),
('latte', 'hot-drinks', 'Creamy', 'Latte', 'Espresso with plenty of silky steamed milk.', 109, null, true, null, true, false, false, 24),
('hot-chocolate', 'hot-drinks', 'Rich', 'Hot Chocolate', 'Thick, rich hot chocolate topped with cream and chocolate shavings.', 119, null, true, '/menu/hot-chocolate.webp', true, false, false, 25),
('tea', 'hot-drinks', 'Kadak', 'Tea', 'Hot milk tea brewed strong, just the way you like it.', 25, null, true, '/menu/tea.webp', true, false, false, 26),
('chocolate-tea', 'hot-drinks', 'Cosy', 'Chocolate Tea', 'Our milk tea blended with smooth chocolate.', 49, null, true, null, true, false, false, 27),
('herbal-tea', 'hot-drinks', 'Soothing', 'Herbal Tea', 'A calming cup of herbal infusion — ask for today''s blend.', 59, null, true, null, true, false, false, 28),
('chocolate-shake', 'shakes-juices', 'Buy 1 Get 1', 'Chocolate Shake', 'Thick chocolate milkshake blended with ice cream.', 129, null, true, null, true, false, false, 29),
('oreo-shake', 'shakes-juices', 'Buy 1 Get 1', 'Oreo Shake', 'Cookies and cream shake loaded with crushed Oreos.', 139, null, true, null, true, false, false, 30),
('strawberry-shake', 'shakes-juices', 'Buy 1 Get 1', 'Strawberry Shake', 'Creamy strawberry milkshake, sweet and fresh.', 129, null, true, null, true, false, false, 31),
('fresh-juice', 'shakes-juices', 'Fresh', 'Fresh Fruit Juice', 'Freshly squeezed seasonal fruit juice.', 89, null, true, null, true, false, false, 32),
('ice-cream', 'desserts', 'Scoops', 'Ice Cream', 'Two scoops of your favourite flavour.', 69, null, true, null, true, false, false, 33),
('falooda', 'desserts', 'Royal', 'Falooda', 'Rose milk, vermicelli, basil seeds, jelly and ice cream in a tall glass.', 129, null, true, null, true, false, false, 34)
on conflict (id) do nothing;

-- STEP 5: your admin login -----------------------------------------------------
-- 1. Supabase → Authentication → Users → "Add user" → enter email + password
--    (tick "Auto confirm user").
-- 2. Put that same email below and run just this line:
-- insert into public.admins (email) values ('owner@example.com');
