-- ============================================================================
-- HARINAMA STORE — COMPLETE CATEGORIES PERMISSIONS & CASCADING DELETION
-- Migration 10: Permanent Categories CRUD, Foreign Keys & Storage
-- ============================================================================

-- 1. Ensure Categories Table Schema
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '/assets/images/cat_keychains.jpg',
    sort_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was previously created with slightly different schema
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.categories ADD COLUMN image_url TEXT DEFAULT '/assets/images/cat_keychains.jpg';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE public.categories ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.categories ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_status ON public.categories (status);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories (sort_order);

-- 3. Ensure Products Foreign Key unlinks smoothly on delete (ON DELETE SET NULL)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'products'
    ) THEN
        ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
        ALTER TABLE public.products DROP CONSTRAINT IF EXISTS fk_products_category;
        ALTER TABLE public.products 
            ADD CONSTRAINT products_category_id_fkey 
            FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Grant Table Permissions
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;

-- 5. Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 6. Clean up any existing policies on categories
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;
DROP POLICY IF EXISTS "Allow category management" ON public.categories;

-- 7. RLS Policy: Public read access
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT
    USING (true);

-- 8. RLS Policy: Allow Full Admin and Dashboard Category Management (Insert, Update, Delete)
CREATE POLICY "Allow category management" ON public.categories
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 9. Ensure Storage Bucket for Product and Category Images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760;

-- 10. Storage Policies for product-images bucket
DROP POLICY IF EXISTS "Public can view product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images storage" ON storage.objects;

CREATE POLICY "Public can view product images storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images storage" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admins can update product images storage" ON storage.objects
    FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "Admins can delete product images storage" ON storage.objects
    FOR DELETE USING (bucket_id = 'product-images');

-- 11. Refresh schema cache
NOTIFY pgrst, 'reload schema';
