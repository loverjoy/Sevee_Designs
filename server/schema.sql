-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS trigger_generate_order_number ON public.orders;
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON public.orders;
DROP FUNCTION IF EXISTS public.generate_order_number();
DROP FUNCTION IF EXISTS public.update_updated_at();

-- Drop existing tables if they exist (ordered by dependencies)
DROP TABLE IF EXISTS public.ar_view_events CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.delivery_zones CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.payment_method CASCADE;

-- Drop existing sequences if they exist
DROP SEQUENCE IF EXISTS public.order_number_seq CASCADE;

-- Create Enums
CREATE TYPE public.user_role     AS ENUM ('user', 'admin', 'salesperson', 'superadmin');
CREATE TYPE public.order_status  AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.payment_method AS ENUM ('mobile_money', 'card', 'paypal');

-- Create sequence for order numbers
CREATE SEQUENCE public.order_number_seq START WITH 1001;

-- Create Tables

-- 1. profiles (Unified user table with password hashing)
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         text UNIQUE NOT NULL,
  username      text UNIQUE NOT NULL,
  full_name     text,
  phone         text,
  avatar_url    text,
  role          public.user_role NOT NULL DEFAULT 'user',
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. categories
CREATE TABLE public.categories (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  description text,
  image_url   text,
  sort_order  int DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. products
CREATE TABLE public.products (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id     uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  item_code       text UNIQUE,
  description     text,
  price           numeric(10,2) NOT NULL,
  sale_price      numeric(10,2),                     -- null = no sale
  stock_quantity  int NOT NULL DEFAULT 0,
  images          text[] DEFAULT '{}',               -- array of local image URLs
  specifications  jsonb DEFAULT '{}',                -- key/value pairs
  is_featured     boolean DEFAULT false,
  is_active       boolean DEFAULT true,
  model_url       text,                              -- local path to .glb file
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 4. delivery_zones
CREATE TABLE public.delivery_zones (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            text NOT NULL,
  regions         text[] NOT NULL DEFAULT '{}',
  base_fee        numeric(10,2) NOT NULL DEFAULT 0,
  per_km_fee      numeric(10,2) DEFAULT 0,
  estimated_days  text NOT NULL DEFAULT '3-5 business days',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 5. addresses
CREATE TABLE public.addresses (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  full_name       text NOT NULL,
  phone           text NOT NULL,
  address_line1   text NOT NULL,
  address_line2   text,
  city            text NOT NULL,
  region          text NOT NULL,
  country         text NOT NULL DEFAULT 'Ghana',
  is_default      boolean DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 6. coupons
CREATE TABLE public.coupons (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             text UNIQUE NOT NULL,           -- stored uppercase
  description      text,
  discount_type    text NOT NULL DEFAULT 'percentage',   -- 'percentage' | 'fixed'
  discount_value   numeric(10,2) NOT NULL,
  min_order_amount numeric(10,2) DEFAULT 0,
  max_uses         int,                            -- null = unlimited
  used_count       int NOT NULL DEFAULT 0,
  expires_at       timestamptz,
  is_active        boolean DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 7. orders
CREATE TABLE public.orders (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number     text UNIQUE NOT NULL,           -- auto-generated: "SD-YYYYMMDD-NNNNNN"
  user_id          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status           public.order_status NOT NULL DEFAULT 'pending',
  subtotal         numeric(10,2) NOT NULL,
  delivery_fee     numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount  numeric(10,2) NOT NULL DEFAULT 0,
  total            numeric(10,2) NOT NULL,
  payment_status   public.payment_status NOT NULL DEFAULT 'pending',
  payment_method   public.payment_method,
  delivery_address jsonb NOT NULL DEFAULT '{}',    -- snapshot
  coupon_id        uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  currency         text NOT NULL DEFAULT 'GHS',
  exchange_rate    numeric(10,4) NOT NULL DEFAULT 1.0,
  tracking_number  text,
  notes            text,                           -- e.g. "paystack_ref:REF_STRING"
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 8. order_items
CREATE TABLE public.order_items (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id    uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  text NOT NULL,
  product_image text,
  quantity      int NOT NULL DEFAULT 1,
  unit_price    numeric(10,2) NOT NULL,
  total_price   numeric(10,2) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 9. wishlists
CREATE TABLE public.wishlists (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id  uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 10. blog_posts
CREATE TABLE public.blog_posts (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         text NOT NULL,
  slug          text UNIQUE NOT NULL,
  excerpt       text,
  content       text,
  image_url     text,
  category      text DEFAULT 'General',
  author        text DEFAULT 'SEVEE DESIGNS Team',
  is_published  boolean DEFAULT true,
  published_at  timestamptz DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 11. contact_messages
CREATE TABLE public.contact_messages (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  email      text NOT NULL,
  phone      text,
  subject    text NOT NULL,
  message    text NOT NULL,
  is_read    boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 12. faqs
CREATE TABLE public.faqs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question    text UNIQUE NOT NULL,
  answer      text NOT NULL,
  category    text DEFAULT 'General',
  sort_order  int DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 13. ar_view_events
CREATE TABLE public.ar_view_events (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_products_category_active    ON public.products(category_id, is_active);
CREATE INDEX idx_products_featured_active    ON public.products(is_featured, is_active);
CREATE INDEX idx_orders_user_id_created      ON public.orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status_created       ON public.orders(status, created_at DESC);
CREATE INDEX idx_order_items_order_id        ON public.order_items(order_id);
CREATE INDEX idx_wishlists_user_id           ON public.wishlists(user_id);
CREATE INDEX idx_ar_view_events_product_id   ON public.ar_view_events(product_id);
CREATE INDEX idx_ar_view_events_viewed_at    ON public.ar_view_events(viewed_at DESC);

-- Trigger functions

-- 1. Auto-generate order number (SD-YYYYMMDD-NNNNNN)
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'SD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('public.order_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_number();

-- 2. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
