-- ============================================================================
-- HARINAMA STORE — COMPREHENSIVE ADMIN AUTHORIZATION & RLS SYNC
-- Migration 09: Update is_admin function, profile triggers, and all admin policies
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
        'harinamaevakevalam@gmail.com',
        'harinamaivakevalam@gmail.com',
        'katturojuanilkumar@gmail.com',
        'admin@harinama.com'
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check 3: Domain / prefix pattern check
    IF LOWER(COALESCE(auth.jwt() ->> 'email', '')) LIKE 'harinama%@gmail.com'
       OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) LIKE '%katturoju%@gmail.com'
       OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) LIKE 'admin@%' THEN
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
    is_admin_user := (
        LOWER(COALESCE(NEW.email, '')) IN ('harinamaevakevalam@gmail.com', 'harinamaivakevalam@gmail.com', 'katturojuanilkumar@gmail.com', 'admin@harinama.com')
        OR LOWER(COALESCE(NEW.email, '')) LIKE 'harinama%@gmail.com'
        OR LOWER(COALESCE(NEW.email, '')) LIKE '%katturoju%@gmail.com'
    );

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

-- 3. Update any existing profile for harinamaevakevalam@gmail.com to admin
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE LOWER(email) IN ('harinamaevakevalam@gmail.com', 'harinamaivakevalam@gmail.com', 'katturojuanilkumar@gmail.com', 'admin@harinama.com')
   OR LOWER(email) LIKE 'harinama%@gmail.com';

-- 4. Re-apply Products Policies
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (status = 'active' OR status IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
DROP POLICY IF EXISTS "products_select_public" ON public.products;

CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (public.is_admin() OR auth.role() = 'authenticated')
    WITH CHECK (public.is_admin() OR auth.role() = 'authenticated');

-- 5. Re-apply Product Images Policies
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product images" ON public.product_images;
CREATE POLICY "Admins can manage product images" ON public.product_images
    FOR ALL USING (public.is_admin() OR auth.role() = 'authenticated')
    WITH CHECK (public.is_admin() OR auth.role() = 'authenticated');

-- 6. Re-apply Product Variants Policies
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view product variants" ON public.product_variants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
CREATE POLICY "Admins can manage product variants" ON public.product_variants
    FOR ALL USING (public.is_admin() OR auth.role() = 'authenticated')
    WITH CHECK (public.is_admin() OR auth.role() = 'authenticated');

-- 7. Re-apply Categories Policies
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_admin() OR auth.role() = 'authenticated')
    WITH CHECK (public.is_admin() OR auth.role() = 'authenticated');

-- 8. Refresh schema cache
NOTIFY pgrst, 'reload schema';
