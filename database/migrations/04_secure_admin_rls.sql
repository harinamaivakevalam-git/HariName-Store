-- ============================================================================
-- HARINAMA STORE — PRODUCTION SECURE ROW LEVEL SECURITY (RLS) POLICIES
-- Migration 04: Secure Admin Role Resolution, Storage & Airtight Access
-- ============================================================================

-- 1. Helper function to verify admin privileges securely via JWT or profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check 1: User has 'admin' role in public.profiles
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check 2: User email matches authorized admin emails
    IF LOWER(COALESCE(auth.jwt() ->> 'email', '')) IN (
        'harinamaivakevalam@gmail.com',
        'katturojuanilkumar@gmail.com',
        'admin@harinama.com'
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Trigger to automatically provision / promote admin profiles upon Auth
CREATE OR REPLACE FUNCTION public.handle_user_profile_sync()
RETURNS TRIGGER AS $$
DECLARE
    is_admin_user BOOLEAN;
BEGIN
    is_admin_user := (LOWER(COALESCE(NEW.email, '')) IN ('harinamaivakevalam@gmail.com', 'katturojuanilkumar@gmail.com', 'admin@harinama.com'));

    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        CASE WHEN is_admin_user THEN 'admin' ELSE 'customer' END,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, profiles.name),
        role = CASE WHEN is_admin_user THEN 'admin' ELSE profiles.role END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_sync();

-- 3. Ensure RLS is enabled on all essential tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 4. PROFILES POLICIES
DROP POLICY IF EXISTS "Public can view admin/seller profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- 5. CATEGORIES POLICIES
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT USING (status = 'active' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. BRANDS POLICIES
DROP POLICY IF EXISTS "Public can view active brands" ON public.brands;
CREATE POLICY "Public can view active brands" ON public.brands
    FOR SELECT USING (status = 'active' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage brands" ON public.brands;
CREATE POLICY "Admins can manage brands" ON public.brands
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. PRODUCTS POLICIES
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (status = 'active' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8. PRODUCT IMAGES POLICIES
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can manage product images" ON public.product_images
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 9. PRODUCT VARIANTS POLICIES
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view product variants" ON public.product_variants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
CREATE POLICY "Admins can manage product variants" ON public.product_variants
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10. ORDERS & ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
        (user_id IS NULL) OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view order items" ON public.order_items;
CREATE POLICY "Users can view order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Users can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- 11. REVIEWS POLICIES
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews
    FOR SELECT USING (status = 'approved' OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 12. COUPONS POLICIES
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons" ON public.coupons
    FOR SELECT USING (status = 'active' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 13. Ensure image_url column is TEXT (prevents string length truncation errors)
ALTER TABLE public.product_images ALTER COLUMN image_url TYPE TEXT;

-- 14. Ensure Storage bucket 'product-images' exists and is publicly accessible
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view product images storage" ON storage.objects;
CREATE POLICY "Public can view product images storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins and authorized users can upload product images storage" ON storage.objects;
CREATE POLICY "Admins and authorized users can upload product images storage" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins and authorized users can update product images storage" ON storage.objects;
CREATE POLICY "Admins and authorized users can update product images storage" ON storage.objects
    FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins and authorized users can delete product images storage" ON storage.objects;
CREATE POLICY "Admins and authorized users can delete product images storage" ON storage.objects
    FOR DELETE USING (bucket_id = 'product-images');

-- 15. Ensure existing admin users have the 'admin' role in public.profiles
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(email) IN ('harinamaivakevalam@gmail.com', 'katturojuanilkumar@gmail.com', 'admin@harinama.com');
