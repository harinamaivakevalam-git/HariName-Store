-- ============================================================================
-- HARINAMA STORE — COMPLETE DATABASE RELATIONSHIP & PERMISSIONS RE-LINK
-- Migration 08: Re-establish All Foreign Keys, PostgREST Links & Public Grants
-- ============================================================================

-- 1. Ensure public schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. RE-ESTABLISH FOREIGN KEYS ON PRODUCTS & CATEGORIES
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS fk_products_category;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE public.products 
    ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. RE-ESTABLISH FOREIGN KEYS ON PRODUCTS & BRANDS
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS fk_products_brand;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_brand_id_fkey;
ALTER TABLE public.products 
    ADD CONSTRAINT products_brand_id_fkey 
    FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;

-- 4. RE-ESTABLISH FOREIGN KEYS ON PRODUCT IMAGES
ALTER TABLE public.product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE public.product_images 
    ADD CONSTRAINT product_images_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 5. RE-ESTABLISH FOREIGN KEYS ON PRODUCT VARIANTS
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE public.product_variants 
    ADD CONSTRAINT product_variants_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 6. RE-ESTABLISH FOREIGN KEYS ON ORDER ITEMS
ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE public.order_items 
    ADD CONSTRAINT order_items_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE public.order_items 
    ADD CONSTRAINT order_items_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- 7. RE-ESTABLISH FOREIGN KEYS ON REVIEWS
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;
ALTER TABLE public.reviews 
    ADD CONSTRAINT reviews_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- 8. GRANT READ PERMISSIONS TO ANON & AUTHENTICATED ROLES
GRANT SELECT ON TABLE public.categories TO anon, authenticated;
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT SELECT ON TABLE public.product_images TO anon, authenticated;
GRANT SELECT ON TABLE public.product_variants TO anon, authenticated;
GRANT SELECT ON TABLE public.brands TO anon, authenticated;
GRANT SELECT ON TABLE public.reviews TO anon, authenticated;

-- Grant all permissions to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 9. ENSURE ROW LEVEL SECURITY ALLOWS PUBLIC BROWSING
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Categories
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT USING (true);

-- Products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (status = 'active' OR status IS NULL);

-- Product Images
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images
    FOR SELECT USING (true);

-- Product Variants
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view product variants" ON public.product_variants
    FOR SELECT USING (true);

-- Brands
DROP POLICY IF EXISTS "Public can view active brands" ON public.brands;
CREATE POLICY "Public can view active brands" ON public.brands
    FOR SELECT USING (true);

-- 10. REFRESH POSTGREST SCHEMA CACHE (CRITICAL FOR SUPABASE RELATIONSHIPS)
NOTIFY pgrst, 'reload schema';
