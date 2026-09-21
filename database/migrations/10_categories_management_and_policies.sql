-- ============================================================================
-- HARINAMA STORE — COMPLETE CATEGORIES (COLLECTIONS) MANAGEMENT & POLICIES
-- Migration 10: Complete Categories Table, Indexes, RLS Policies & Storage
-- ============================================================================

-- 1. Ensure Categories Table Schema
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '/assets/images/cat_keychains.jpg',
    sort_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
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

-- 2. Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_status ON public.categories (status);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories (sort_order);

-- 3. Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any conflicting policies
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;

-- 5. RLS Policy: Public can view all categories
CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT
    USING (true);

-- 6. RLS Policy: Authorized Admins & Authenticated Devotee Admins can Insert, Update, and Delete
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL
    USING (
        public.is_admin() 
        OR auth.role() = 'authenticated'
        OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) IN (
            'harinamaevakevalam@gmail.com',
            'harinamaivakevalam@gmail.com',
            'katturojuanilkumar@gmail.com',
            'admin@harinama.com'
        )
    )
    WITH CHECK (
        public.is_admin() 
        OR auth.role() = 'authenticated'
        OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) IN (
            'harinamaevakevalam@gmail.com',
            'harinamaivakevalam@gmail.com',
            'katturojuanilkumar@gmail.com',
            'admin@harinama.com'
        )
    );

-- 7. Ensure Storage Bucket for Product and Category Images
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

-- 8. Storage Policies for product-images bucket
DROP POLICY IF EXISTS "Public can view product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images storage" ON storage.objects;

CREATE POLICY "Public can view product images storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images storage" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' 
        AND (auth.role() = 'authenticated' OR public.is_admin())
    );

CREATE POLICY "Admins can update product images storage" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-images' 
        AND (auth.role() = 'authenticated' OR public.is_admin())
    );

CREATE POLICY "Admins can delete product images storage" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-images' 
        AND (auth.role() = 'authenticated' OR public.is_admin())
    );

-- 9. Seed Canonical Devotional Categories (Preserves existing while ensuring standard categories)
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order, status)
VALUES
    ('a8686346-2099-4f6f-9214-0ec187c2e632', 'Devotional Keychains', 'keychains', 'Sacred acrylic and metal keychains with divine darshan of Sri Krishna, Radha, and sacred Mantras.', '/assets/images/cat_keychains.jpg', 1, 'active'),
    ('c5889b78-02f7-4c51-8cfc-53c5dd2709fa', 'Sacred Books & Shastras', 'books', 'Spiritual wisdom, Bhagavad Gita As It Is, Srimad Bhagavatam, and sacred Vedic literature.', '/assets/images/cat_books.jpg', 2, 'active'),
    ('bdfb6c50-8436-4546-96f7-007577b855ba', 'Japa & Chanting', 'japa-chanting', 'Authentic sacred Tulasi malas, neem japa beads, bead bags, and chanting counters.', '/assets/images/cat_japa_malas.jpg', 3, 'active'),
    ('585c4ce8-3722-4070-bd8d-61076436c946', 'Gift Sets & Bundles', 'gift-sets', 'Curated spiritual gift bundles for Vaishnava festivals, initiation, and devotional celebrations.', '/assets/images/cat_spiritual_gifts.jpg', 4, 'active'),
    ('0a7bcc57-12f7-428c-a512-0dcd3691703f', 'Deity Statues & Altars', 'deity-statues', 'Exquisite brass and marble murtis of Radha Krishna, Jagannath, and Gaura Nitai.', '/assets/images/cat_deity_statues.jpg', 5, 'active')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = COALESCE(public.categories.image_url, EXCLUDED.image_url),
    sort_order = EXCLUDED.sort_order,
    status = 'active',
    updated_at = NOW();

-- 10. Refresh schema cache
NOTIFY pgrst, 'reload schema';
