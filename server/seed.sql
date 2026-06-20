-- SeVee Designs Mock Seed Data

-- 1. Insert Profiles
-- Hashed password for 'password123' using bcrypt: $2a$10$vKBd7wA8LlhO6Fj486C3iutb1bI41V8WnB7wJ.UuI.v3/yA5CqM7G
INSERT INTO public.profiles (id, email, username, full_name, phone, avatar_url, role, password_hash)
VALUES
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'superadmin@seveedesigns.com', 'superadmin', 'Super Administrator', '+233244000000', 'https://api.dicebear.com/7.x/adventurer/svg?seed=superadmin', 'superadmin', '$2a$10$vKBd7wA8LlhO6Fj486C3iutb1bI41V8WnB7wJ.UuI.v3/yA5CqM7G')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, username, full_name, phone, avatar_url, role, password_hash)
VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin@seveedesigns.com', 'admin', 'Kofi Mensah', '+233244123456', 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin', 'admin', '$2a$10$vKBd7wA8LlhO6Fj486C3iutb1bI41V8WnB7wJ.UuI.v3/yA5CqM7G')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, username, full_name, phone, avatar_url, role, password_hash)
VALUES
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'salesperson@seveedesigns.com', 'sales', 'Ama Serwaa', '+233244654321', 'https://api.dicebear.com/7.x/adventurer/svg?seed=sales', 'salesperson', '$2a$10$vKBd7wA8LlhO6Fj486C3iutb1bI41V8WnB7wJ.UuI.v3/yA5CqM7G')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, username, full_name, phone, avatar_url, role, password_hash)
VALUES
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'customer@seveedesigns.com', 'customer', 'Kwame Nkrumah', '+233201112222', 'https://api.dicebear.com/7.x/adventurer/svg?seed=customer', 'user', '$2a$10$vKBd7wA8LlhO6Fj486C3iutb1bI41V8WnB7wJ.UuI.v3/yA5CqM7G')
  ON CONFLICT (id) DO NOTHING;

-- 2. Insert Categories
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Living Room', 'living-room', 'Sofas, armchairs, coffee tables, and credenzas.', '/uploads/cat_living_room.webp', 1)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000002', 'Bedroom', 'bedroom', 'Beds, mattresses, wardrobes, and bedside tables.', '/uploads/cat_bedroom.webp', 2)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000003', 'Office', 'office', 'Ergonomic chairs, desks, and office storage solutions.', '/uploads/cat_office.webp', 3)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000004', 'Outdoor', 'outdoor', 'Patio tables, outdoor lounge chairs, and sun loungers.', '/uploads/cat_outdoor.webp', 4)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000005', 'Accessories', 'accessories', 'Lighting, clocks, mirrors, and decor objects.', '/uploads/cat_accessories.webp', 5)
  ON CONFLICT (id) DO NOTHING;

-- 3. Insert Products
INSERT INTO public.products (id, category_id, name, slug, description, price, sale_price, stock_quantity, images, specifications, is_featured, is_active, model_url)
VALUES
  (
    'f1000000-0000-0000-0000-000000000001', 
    'c1000000-0000-0000-0000-000000000001', 
    'Deluxe Oak Dining Table', 
    'deluxe-oak-dining-table', 
    'A solid oak wood dining table crafted with precision. Seats up to 8 people comfortably. Features a matte oil finish to protect and highlight the natural wood grain.', 
    3500.00, 
    3200.00, 
    12, 
    ARRAY['/uploads/prod_dining_table_1.webp', '/uploads/prod_dining_table_2.webp'], 
    '{"Material": "Solid White Oak", "Dimensions": "180cm x 90cm x 75cm", "Finish": "Natural Matte Oil", "Weight": "45kg"}', 
    true, 
    true, 
    '/models/dining_table.glb'
  )
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, category_id, name, slug, description, price, sale_price, stock_quantity, images, specifications, is_featured, is_active, model_url)
VALUES
  (
    'f1000000-0000-0000-0000-000000000002', 
    'c1000000-0000-0000-0000-000000000001', 
    'Velvet Lounge Chair', 
    'velvet-lounge-chair', 
    'An accent chair upholstered in premium velvet fabric with elegant brass legs. Perfect for reading corners or adding a sophisticated touch to your living room.', 
    1800.00, 
    null, 
    18, 
    ARRAY['/uploads/prod_velvet_chair.webp'], 
    '{"Material": "Velvet, Brass, Steel", "Dimensions": "85cm x 80cm x 90cm", "Upholstery": "Royal Blue Velvet", "Weight": "18kg"}', 
    true, 
    true, 
    '/models/velvet_chair.glb'
  )
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, category_id, name, slug, description, price, sale_price, stock_quantity, images, specifications, is_featured, is_active, model_url)
VALUES
  (
    'f1000000-0000-0000-0000-000000000003', 
    'c1000000-0000-0000-0000-000000000003', 
    'Ergonomic Task Chair', 
    'ergonomic-task-chair', 
    'High-back executive office chair with adjustable lumbar support, 3D armrests, and dynamic mesh backing to ensure posture support during long working hours.', 
    1200.00, 
    999.00, 
    25, 
    ARRAY['/uploads/prod_office_chair.webp'], 
    '{"Material": "Nylon Mesh, Aluminum", "Dimensions": "65cm x 65cm x 110-120cm", "Adjustable Lumbar": "Yes", "Warranty": "2 Years"}', 
    true, 
    true, 
    '/models/office_chair.glb'
  )
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, category_id, name, slug, description, price, sale_price, stock_quantity, images, specifications, is_featured, is_active, model_url)
VALUES
  (
    'f1000000-0000-0000-0000-000000000004', 
    'c1000000-0000-0000-0000-000000000004', 
    'Teak Sun Lounger', 
    'teak-sun-lounger', 
    'Premium grade A teak wood lounge chair designed for outdoor relaxation. Naturally weather-resistant, features 4 reclining positions and built-in wheels.', 
    2500.00, 
    null, 
    8, 
    ARRAY['/uploads/prod_sun_lounger.webp'], 
    '{"Material": "Grade A Teak Wood", "Dimensions": "200cm x 65cm x 35cm", "Weather Resistant": "Yes", "Wheels Included": "Yes"}', 
    true, 
    true, 
    null
  )
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, category_id, name, slug, description, price, sale_price, stock_quantity, images, specifications, is_featured, is_active, model_url)
VALUES
  (
    'f1000000-0000-0000-0000-000000000005', 
    'c1000000-0000-0000-0000-000000000005', 
    'Minimalist Wall Clock', 
    'minimalist-wall-clock', 
    'Modern silently sweep-second clock with a black steel frame and natural wood hands. A timeless decor accent piece for any room.', 
    450.00, 
    380.00, 
    40, 
    ARRAY['/uploads/prod_wall_clock.webp'], 
    '{"Material": "Steel Frame, Oak Hands", "Dimensions": "30cm Diameter", "Movement": "Silent Quartz", "Battery": "1x AA (Not Included)"}', 
    false, 
    true, 
    null
  )
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, category_id, name, slug, description, price, sale_price, stock_quantity, images, specifications, is_featured, is_active, model_url)
VALUES
  (
    'f1000000-0000-0000-0000-000000000006', 
    'c1000000-0000-0000-0000-000000000002', 
    'Queen Platform Bed Frame', 
    'queen-platform-bed-frame', 
    'Low-profile queen size platform bed frame made of solid mahogany wood. Strong slats eliminate the need for a box spring.', 
    4200.00, 
    null, 
    6, 
    ARRAY['/uploads/prod_queen_bed.webp'], 
    '{"Material": "Solid Mahogany", "Dimensions": "160cm x 210cm x 30cm (Headboard height: 100cm)", "Slats Included": "Yes", "Size": "Queen"}', 
    true, 
    true, 
    '/models/queen_bed.glb'
  )
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, category_id, name, slug, description, price, sale_price, stock_quantity, images, specifications, is_featured, is_active, model_url)
VALUES
  (
    'f1000000-0000-0000-0000-000000000007', 
    'c1000000-0000-0000-0000-000000000001', 
    'Mid-Century Credenza', 
    'mid-century-credenza', 
    'Walnut wood side cabinet featuring 3 drawers and 2 sliding doors. Spacious interior shelving for media devices or dinnerware.', 
    2900.00, 
    2650.00, 
    10, 
    ARRAY['/uploads/prod_credenza.webp'], 
    '{"Material": "Walnut Veneer, Solid Ash Legs", "Dimensions": "150cm x 45cm x 75cm", "Drawers": "3 Soft-close", "Shelves": "Adjustable"}', 
    false, 
    true, 
    null
  )
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, category_id, name, slug, description, price, sale_price, stock_quantity, images, specifications, is_featured, is_active, model_url)
VALUES
  (
    'f1000000-0000-0000-0000-000000000008', 
    'c1000000-0000-0000-0000-000000000001', 
    'Industrial Floor Lamp', 
    'industrial-floor-lamp', 
    'Adjustable arc light fixture with a heavy concrete base and powder-coated matte black steel shade. Ideal for lighting reading armchairs.', 
    850.00, 
    null, 
    15, 
    ARRAY['/uploads/prod_floor_lamp.webp'], 
    '{"Material": "Steel, Concrete", "Dimensions": "180cm Max Height, 35cm Base", "Socket": "E27 (Max 40W)", "Cord Length": "2m"}', 
    false, 
    true, 
    null
  )
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.delivery_zones (id, name, regions, base_fee, per_km_fee, estimated_days)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Greater Accra Zone', ARRAY['Greater Accra'], 50.00, 2.50, '1-2 business days')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.delivery_zones (id, name, regions, base_fee, per_km_fee, estimated_days)
VALUES
  ('d1000000-0000-0000-0000-000000000002', 'Ashanti & Central Zone', ARRAY['Ashanti', 'Central', 'Eastern', 'Volta'], 120.00, 3.50, '3-4 business days')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.delivery_zones (id, name, regions, base_fee, per_km_fee, estimated_days)
VALUES
  ('d1000000-0000-0000-0000-000000000003', 'Northern & Western Zone', ARRAY['Western', 'Western North', 'Northern', 'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti'], 200.00, 5.00, '5-7 business days')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.delivery_zones (id, name, regions, base_fee, per_km_fee, estimated_days)
VALUES
  ('d1000000-0000-0000-0000-000000000004', 'International Delivery', ARRAY['International'], 450.00, 0.00, '7-14 business days')
  ON CONFLICT (id) DO NOTHING;

-- 5. Insert Coupons
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at, is_active)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'WELCOME10', '10% off for first-time buyers', 'percentage', 10.00, 100.00, 100, 0, now() + interval '1 year', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at, is_active)
VALUES
  ('e1000000-0000-0000-0000-000000000002', 'SDGIFT50', 'GHS 50 off on orders above GHS 500', 'fixed', 50.00, 500.00, 50, 0, now() + interval '6 months', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at, is_active)
VALUES
  ('e1000000-0000-0000-0000-000000000003', 'ACCRAEXPIRED', 'Expired promotional coupon code', 'percentage', 20.00, 200.00, 10, 10, now() - interval '1 day', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, max_uses, used_count, expires_at, is_active)
VALUES
  ('e1000000-0000-0000-0000-000000000004', 'BIGSALE', 'Flat GHS 200 off for large orders', 'fixed', 200.00, 2000.00, null, 15, now() + interval '2 months', true)
  ON CONFLICT (id) DO NOTHING;

-- 6. Insert FAQs
INSERT INTO public.faqs (question, answer, category, sort_order)
VALUES
  ('What wood materials do you use for your furniture?', 'We source premium local and imported hardwoods, primarily Grade A Teak, Mahogany, and Solid White Oak. All our lumber is kiln-dried and finished with eco-friendly protective oils.', 'General', 1)
  ON CONFLICT DO NOTHING;
INSERT INTO public.faqs (question, answer, category, sort_order)
VALUES
  ('Do you offer custom dimensions for your dining tables?', 'Yes! We custom-build furniture to fit your specific space. Please contact hello@seveedesigns.com with your drawings or dimensions for a customized quote.', 'General', 2)
  ON CONFLICT DO NOTHING;
INSERT INTO public.faqs (question, answer, category, sort_order)
VALUES
  ('How much does delivery cost in Accra?', 'Delivery within the Greater Accra Region is GHS 50.00. Rates for other regions depend on distance and are calculated dynamically during checkout (Ashanti/Central: GHS 120.00; Northern/Western: GHS 200.00).', 'Delivery', 1)
  ON CONFLICT DO NOTHING;
INSERT INTO public.faqs (question, answer, category, sort_order)
VALUES
  ('What is the estimated delivery time?', 'Accra deliveries take 1-2 business days. For other regions, transit times range from 3-7 business days depending on road access.', 'Delivery', 2)
  ON CONFLICT DO NOTHING;
INSERT INTO public.faqs (question, answer, category, sort_order)
VALUES
  ('What payment methods do you accept?', 'We integrate with Paystack to process payments securely. You can pay using Mobile Money (MTN, Telecel, AirtelTigo), Visa/Mastercard, or Bank Transfer.', 'Payments', 1)
  ON CONFLICT DO NOTHING;
INSERT INTO public.faqs (question, answer, category, sort_order)
VALUES
  ('How do I use the 3D / AR feature?', 'If a product lists a "View in AR" option, clicking it on a mobile device will trigger Google WebXR (Android) or AR Quick Look (iOS) to project the furniture directly into your room. On desktop, it generates a QR code to scan with your phone.', 'AR Viewer', 1)
  ON CONFLICT DO NOTHING;

-- 7. Insert Blog Posts
INSERT INTO public.blog_posts (title, slug, excerpt, content, image_url, category, author)
VALUES
  (
    'Crafting the Perfect Modern Living Room', 
    'crafting-perfect-modern-living-room', 
    'Discover the design choices and wood textures that can make your living room feel warm yet architectural.', 
    'Selecting the right furniture is key to creating a space that feels both premium and cozy. In this guide, we dive deep into the spatial arrangement of oak tables and armchairs, color matching with terracotta tones, and the importance of structural minimalism.', 
    '/uploads/blog_living_room.webp', 
    'Interior Design', 
    'Ekow Taylor'
  )
  ON CONFLICT DO NOTHING;
INSERT INTO public.blog_posts (title, slug, excerpt, content, image_url, category, author)
VALUES
  (
    'Teak Wood: The Ultimate Outdoor Material', 
    'teak-wood-ultimate-outdoor-material', 
    'Why Teak remains the gold standard for luxury garden and patio furniture.', 
    'Teak wood produces natural oils that protect it against rotting, moisture damage, and wood-boring insects. This makes it perfect for the Ghanaian weather. In this article, we explain how to care for your teak chairs to keep their golden hue.', 
    '/uploads/blog_teak.webp', 
    'Furniture Care', 
    'Ama Serwaa'
  )
  ON CONFLICT DO NOTHING;
