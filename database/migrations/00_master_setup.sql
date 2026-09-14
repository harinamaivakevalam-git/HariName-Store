-- ============================================================================
-- HARINAMA STORE — MASTER PRODUCTION SUPABASE SETUP SCRIPT
-- Paste this entire file into Supabase SQL Editor and click "Run"
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PROFILES (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. BRANDS
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    compare_price NUMERIC(12, 2) CHECK (compare_price IS NULL OR compare_price >= price),
    sku VARCHAR(100) UNIQUE NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    material VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'out_of_stock')),
    featured BOOLEAN DEFAULT FALSE,
    trending BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5.0),
    reviews_count INT DEFAULT 0 CHECK (reviews_count >= 0),
    specifications JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- 6. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- 7. PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE,
    size VARCHAR(50),
    color VARCHAR(50),
    weight VARCHAR(50),
    material VARCHAR(100),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    address_type VARCHAR(50) DEFAULT 'Home' CHECK (address_type IN ('Home', 'Work', 'Other')),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- 9. CARTS & CART ITEMS
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cart_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_cart_item UNIQUE(cart_id, product_id, variant_id)
);

-- 10. WISHLISTS
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_wishlist UNIQUE (user_id, product_id)
);

-- 11. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    minimum_order NUMERIC(12, 2) DEFAULT 0.0 CHECK (minimum_order >= 0),
    maximum_discount NUMERIC(12, 2) CHECK (maximum_discount IS NULL OR maximum_discount > 0),
    start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMPTZ NOT NULL,
    usage_limit INT DEFAULT 100,
    times_used INT DEFAULT 0 CHECK (times_used >= 0),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    guest_email VARCHAR(255),
    guest_name VARCHAR(255),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(12, 2) DEFAULT 0.0 CHECK (discount >= 0),
    coupon_code VARCHAR(50),
    shipping_fee NUMERIC(12, 2) DEFAULT 0.0 CHECK (shipping_fee >= 0),
    tax NUMERIC(12, 2) DEFAULT 0.0 CHECK (tax >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
    payment_method VARCHAR(50) NOT NULL,
    order_status VARCHAR(50) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded')),
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    tracking_number VARCHAR(100),
    tracking_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(500),
    sku VARCHAR(100),
    variant_info JSONB,
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_provider VARCHAR(50) NOT NULL CHECK (payment_provider IN ('razorpay', 'stripe', 'cod', 'wallet')),
    transaction_id VARCHAR(255),
    payment_order_id VARCHAR(255),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
    payment_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
);

-- 15. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('order', 'promo', 'account', 'system', 'info')),
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public read for catalog
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (status = 'active' OR public.is_admin());
CREATE POLICY "Public can view active brands" ON public.brands FOR SELECT USING (status = 'active' OR public.is_admin());
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (status = 'active' OR public.is_admin());
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Public can view product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (status = 'active' OR public.is_admin());
CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());

-- Customer data isolation
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users and guests can manage carts" ON public.carts FOR ALL USING ((auth.uid() IS NOT NULL AND user_id = auth.uid()) OR (user_id IS NULL AND session_id IS NOT NULL) OR public.is_admin());
CREATE POLICY "Users and guests can manage cart items" ON public.cart_items FOR ALL USING (EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND ((auth.uid() IS NOT NULL AND carts.user_id = auth.uid()) OR (carts.user_id IS NULL AND carts.session_id IS NOT NULL) OR public.is_admin())));
CREATE POLICY "Users can manage own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin())));
CREATE POLICY "Allow order items insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND (orders.user_id = auth.uid() OR public.is_admin())));
CREATE POLICY "Users can submit reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Admin full management
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage brands" ON public.brands FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage product images" ON public.product_images FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage product variants" ON public.product_variants FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage orders" ON public.orders FOR UPDATE USING (public.is_admin());

-- 18. INITIAL SEED DATA
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order, status) VALUES
('c0000001-0000-0000-0000-000000000001', 'Devotional Keychains', 'devotional-keychains', 'Handcrafted acrylic, enamel, and brass devotional keychains.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 1, 'active'),
('c0000001-0000-0000-0000-000000000002', 'Sacred Books & Shastras', 'sacred-books', 'Authentic Vedic scriptures, Bhagavad Gita, and sacred philosophy.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 2, 'active'),
('c0000001-0000-0000-0000-000000000003', 'Japa & Chanting', 'japa-chanting', 'Authentic Vrindavan Tulasi & Neem meditation prayer beads.', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80', 3, 'active'),
('c0000001-0000-0000-0000-000000000004', 'Gift Sets & Bundles', 'gift-sets', 'Curated spiritual gift hampers, unboxing collections & puja sets.', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80', 4, 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug, logo_url, description, status) VALUES
('b0000001-0000-0000-0000-000000000001', 'HariNama Crafts', 'harinama-crafts', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80', 'Original sacred keepsakes and devotional items crafted with love.', 'active'),
('b0000001-0000-0000-0000-000000000002', 'Bhaktivedanta Book Trust', 'bbt', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80', 'World publisher of classic Vedic literature and shastras.', 'active'),
('b0000001-0000-0000-0000-000000000003', 'Vrindavan Naturals', 'vrindavan-naturals', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=200&q=80', 'Sacred botanical prayer beads and handcrafted japa supplies.', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, title, slug, description, short_description, price, compare_price, sku, stock, category_id, brand_id, material, status, featured, trending, rating, reviews_count) VALUES
('a0000001-0000-0000-0000-000000000001', 'Peacock Feather', 'Peacock Feather Keychain', 'peacock-feather-keychain', 'A timeless devotional keychain inspired by Sri Krishna''s crown feather. Made from high-grade gloss acrylic with double-sided HD print and polished gold keyring.', 'Double-sided HD acrylic with gold keyring.', 99.00, 149.00, 'HN-KC-001', 120, 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Acrylic', 'active', true, true, 4.9, 24),
('a0000001-0000-0000-0000-000000000002', 'Krishna Flute', 'Krishna Flute Keychain', 'krishna-flute-keychain', 'Delicate Krishna flute (Venu) keychain with tiny peacock feather charm. Solid zinc alloy with antique gold electroplating. Rust-proof and built for everyday use.', 'Solid zinc alloy with antique gold plating.', 129.00, 199.00, 'HN-KC-002', 85, 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Metal', 'active', true, true, 4.8, 19),
('a0000001-0000-0000-0000-000000000003', 'Maha-Mantra', 'Maha-Mantra Keychain (Hare Krishna)', 'maha-mantra-keychain', 'The sacred 16-word Maha-Mantra engraved in Devanagari on one side and English on reverse: Hare Krishna Hare Krishna Krishna Krishna Hare Hare / Hare Rama Hare Rama Rama Rama Hare Hare.', 'Dual-sided Hindi & English sacred mantra engraving.', 149.00, 229.00, 'HN-KC-003', 60, 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Metal', 'active', true, true, 5.0, 42),
('a0000001-0000-0000-0000-000000000004', 'Radhe Radhe', 'Radhe Radhe Enamel Keychain', 'radhe-radhe-enamel-keychain', 'Vibrant hard enamel keychain with sweet "Radhe Radhe" calligraphy, framed by blooming lotus and peacock feathers. Symbol of pure divine love and devotion.', 'Hard enamel with bright colors & protective clear gloss.', 129.00, 189.00, 'HN-KC-004', 95, 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Acrylic', 'active', true, false, 4.9, 16),
('a0000001-0000-0000-0000-000000000005', 'Baby Krishna (Makhan Chor)', 'Baby Krishna Keychain', 'baby-krishna-keychain', 'Adorable Bal Krishna holding butter pot (Makhan Chor) charm keychain. A reminder of Krishna''s sweet childhood pastimes in Gokul and Vrindavan.', 'Cut-out acrylic with double-sided glossy finish.', 99.00, 149.00, 'HN-KC-005', 110, 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Acrylic', 'active', true, false, 4.7, 11),
('a0000001-0000-0000-0000-000000000006', 'Bhagavad Gita As It Is', 'Bhagavad Gita As It Is (Deluxe Edition)', 'bhagavad-gita-as-it-is', 'The definitive English edition of Srimad Bhagavad Gita with original Sanskrit verses, Roman transliterations, word-for-word meanings, and purports by A.C. Bhaktivedanta Swami Prabhupada.', 'Deluxe hardbound, 900+ pages with color plates.', 299.00, 450.00, 'HN-BK-001', 50, 'c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'Hardbound Book', 'active', true, true, 5.0, 128),
('a0000001-0000-0000-0000-000000000007', 'Authentic Tulasi Japa Mala', 'Tulasi Japa Mala (108 Beads)', 'authentic-tulasi-japa-mala', 'Sacred 108-bead Tulasi wood Japa Mala hand-carved in holy Vrindavan. Strung on durable silk thread with traditional hand-tied knots between each bead. Includes embroidered cotton bead bag.', '108 hand-carved Tulasi beads with cotton japa bag.', 349.00, 499.00, 'HN-JP-001', 40, 'c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'Wood', 'active', true, true, 4.9, 87),
('a0000001-0000-0000-0000-000000000008', 'Devotee Gift Set', 'Devotee Gift Set (4 Keychains + Blessed Bag)', 'devotee-gift-set-bundle', 'Complete gift bundle containing 4 flagship keychains packaged in a gold-embossed devotional presentation box with Maha-Mantra cards.', 'Complete 4-piece keychain set in gift packaging.', 399.00, 599.00, 'HN-GS-001', 30, 'c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 'Multi-Material', 'active', true, true, 5.0, 34)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
('a0000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 'Peacock Feather Keychain', 1, true),
('a0000001-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80', 'Krishna Flute Keychain', 1, true),
('a0000001-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80', 'Maha-Mantra Keychain', 1, true),
('a0000001-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'Radhe Radhe Enamel Keychain', 1, true),
('a0000001-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'Baby Krishna Keychain', 1, true),
('a0000001-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 'Bhagavad Gita As It Is', 1, true),
('a0000001-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80', 'Tulasi Japa Mala', 1, true),
('a0000001-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80', 'Devotee Gift Set', 1, true);

INSERT INTO public.coupons (code, description, discount_type, discount_value, minimum_order, maximum_discount, expiry_date, status) VALUES
('WELCOME10', 'Welcome Holy Blessing Discount for new devotees', 'fixed', 50.00, 199.00, 50.00, CURRENT_TIMESTAMP + INTERVAL '1 year', 'active'),
('KRISHNA50', 'Flat ₹50 holy discount on all orders', 'fixed', 50.00, 249.00, 50.00, CURRENT_TIMESTAMP + INTERVAL '1 year', 'active'),
('RADHA100', 'Special ₹100 discount on gift bundles and sacred sets', 'fixed', 100.00, 499.00, 100.00, CURRENT_TIMESTAMP + INTERVAL '1 year', 'active')
ON CONFLICT (code) DO NOTHING;
