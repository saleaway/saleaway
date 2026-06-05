-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  STORE TEMPLATE — SUPABASE SETUP SCRIPT                                  ║
-- ║  Run this once in the SQL Editor of a fresh Supabase project to create   ║
-- ║  all tables, defaults, and seed data needed for the storefront.          ║
-- ║                                                                          ║
-- ║  After running:                                                          ║
-- ║   1. Create a Storage bucket called "product-images" (set to public)     ║
-- ║   2. Add this project's URL + anon key to the Vercel env vars            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ── PRODUCTS ────────────────────────────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric not null default 0,
  sale_price float8,
  sale_badge_type text,
  category text default 'General',
  image_url text default '',
  images text[] default '{}',
  sold boolean default false,
  stock int4 default 0,
  has_variants boolean default false,
  created_at timestamptz default now()
);
alter table products disable row level security;

-- ── VARIANTS ────────────────────────────────────────────────────────────────
create table if not exists variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  label text not null,
  stock int4 not null default 0,
  price_override float8,
  image_url text,
  "order" int4 default 0,
  created_at timestamptz default now()
);
alter table variants disable row level security;

-- ── CATEGORIES ──────────────────────────────────────────────────────────────
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);
alter table categories disable row level security;

-- Seed a default category so the admin form has something to pick
insert into categories (name) values ('General') on conflict (name) do nothing;

-- ── ANNOUNCEMENT ────────────────────────────────────────────────────────────
create table if not exists announcement (
  id uuid primary key default gen_random_uuid(),
  message text default '',
  active boolean default false,
  created_at timestamptz default now()
);
alter table announcement disable row level security;

insert into announcement (message, active)
select 'Welcome to our store!', false
where not exists (select 1 from announcement);

-- ── POLICIES ────────────────────────────────────────────────────────────────
create table if not exists policies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  "order" int4 default 0,
  created_at timestamptz default now()
);
alter table policies disable row level security;

-- ── ORDERS (kept for future use) ────────────────────────────────────────────
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_email text,
  total numeric,
  status text default 'pending',
  items jsonb,
  created_at timestamptz default now()
);
alter table orders disable row level security;

-- ── SETTINGS ────────────────────────────────────────────────────────────────
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  store_name text default 'My Store',
  accent_color text default '#C0392B',
  hero_headline text default 'Welcome to our store',
  hero_subtext text default 'Discover great products at great prices.',
  hero_emoji text default '🛍️',
  hero_image_url text default '',
  logo_url text default '',
  media_active boolean default false,
  media_type text default 'image',
  media_url text default '',
  media_position text default 'below_hero',
  media_autoplay boolean default false,
  media_overlay boolean default false,
  media_thumbnail_url text default '',
  sort_options jsonb default '[
    {"value":"newest","label":"Most Recent","enabled":true},
    {"value":"oldest","label":"Oldest First","enabled":true},
    {"value":"price_asc","label":"Price: Low to High","enabled":true},
    {"value":"price_desc","label":"Price: High to Low","enabled":true},
    {"value":"name_az","label":"Name: A–Z","enabled":true},
    {"value":"name_za","label":"Name: Z–A","enabled":false}
  ]'::jsonb,
  hero_visible boolean default true,
  show_similar_products boolean default true,
  theme jsonb,
  created_at timestamptz default now()
);
alter table settings disable row level security;

-- Seed exactly one settings row (the storefront expects .single())
insert into settings (store_name)
select 'My Store'
where not exists (select 1 from settings);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  DONE. Now go to Storage → New Bucket → name it "product-images"         ║
-- ║  and set it to public.                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝