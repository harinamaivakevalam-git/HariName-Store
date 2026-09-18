-- ============================================================================
-- 05_HOMEPAGE_CUSTOMIZER.SQL
-- Migration: Dynamic Homepage Customizer & Section Content Persistence
-- ============================================================================

-- 1. Create homepage_sections table
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255),
    subtitle TEXT,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_homepage_sections_active ON public.homepage_sections(is_active);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- 3. Public Read Policy
DROP POLICY IF EXISTS "Public can view active homepage sections" ON public.homepage_sections;
CREATE POLICY "Public can view active homepage sections" ON public.homepage_sections
    FOR SELECT USING (is_active = true OR public.is_admin());

-- 4. Admin Full CRUD Policy
DROP POLICY IF EXISTS "Admins can manage homepage sections" ON public.homepage_sections;
CREATE POLICY "Admins can manage homepage sections" ON public.homepage_sections
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Seed Initial Default Content for all 5 Homepage Sections
INSERT INTO public.homepage_sections (id, title, subtitle, content, is_active)
VALUES
(
    'hero',
    'Carry Krishna Wherever You Go',
    'Exquisite handcrafted devotional products, sacred shastras, and spiritual keepsakes designed to keep divine remembrance in your heart and everyday life.',
    '{
        "title_prefix": "Carry",
        "title_accent": "Krishna",
        "title_suffix": "Wherever You Go",
        "description": "Exquisite handcrafted devotional products, sacred shastras, and spiritual keepsakes designed to keep divine remembrance in your heart and everyday life.",
        "cta_text": "Shop Now",
        "cta_link": "/shop.html",
        "quote_verse": "“In every step, remember Krishna.”",
        "quote_subtitle": "Inspired by the timeless wisdom of Vrindavan",
        "trust_rating": "4.9 / 5.0",
        "trust_caption": "Blessed by 1,200+ devotees across India",
        "media_type": "image",
        "image_url": "/assets/images/krishna_hero_keychain.jpg",
        "video_url": "",
        "badge_top_title": "Blessed in Vrindavan",
        "badge_top_sub": "Authentic & Sacred",
        "badge_bottom_title": "Solid Cast Brass & Enamel",
        "badge_bottom_sub": "Lifelong Divine Craft",
        "benefits": [
            { "icon": "bi-flower1", "title": "REMEMBER", "desc": "Keep Krishna close throughout your daily journey." },
            { "icon": "bi-music-note-beamed", "title": "CHANT", "desc": "Let the Maha-mantra be your sacred anchor in every moment." },
            { "icon": "bi-gift", "title": "SHARE", "desc": "Gift a divine reminder to those you love and cherish." }
        ]
    }'::jsonb,
    TRUE
),
(
    'promo_banner',
    'Sacred Devotional Reminder',
    'Carry Krishna with you everywhere.',
    '{
        "title": "Sacred Devotional Reminder",
        "subtitle": "Carry Krishna with you everywhere.",
        "description": "A simple everyday reminder to pause, remember Krishna, and chant.",
        "mantra_verse": "Hare Krishna Hare Krishna\nKrishna Krishna Hare Hare\nHare Rama Hare Rama\nRama Rama Hare Hare",
        "mantra_chant": "Chant & Be Happy.",
        "cta_text": "Add to Cart",
        "image_url": "/assets/images/krishna-logo.jpg",
        "video_url": "",
        "media_type": "image"
    }'::jsonb,
    TRUE
),
(
    'why_krishna',
    'Why Carry Krishna?',
    'A small reminder can change the direction of your day.',
    '{
        "title": "Why Carry Krishna?",
        "subtitle": "A small reminder can change the direction of your day.",
        "quote": "“Carry a reminder of eternal happiness.”",
        "cards": [
            {
                "icon": "bi-flower2",
                "title": "SPIRITUAL AWARENESS",
                "text": "A moment of peace in a busy life."
            },
            {
                "icon": "bi-brightness-high",
                "title": "POSITIVE VIBES",
                "text": "Stay connected to what truly matters."
            },
            {
                "icon": "bi-heart",
                "title": "SPREAD JOY",
                "text": "A simple way to inspire others."
            }
        ]
    }'::jsonb,
    TRUE
),
(
    'lifestyle_gallery',
    'Take Krishna With You',
    'From your morning commute to your next journey.',
    '{
        "title": "Take Krishna With You",
        "subtitle": "From your morning commute to your next journey.",
        "items": [
            { "url": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80", "alt": "Devotional Keychain on Bag", "media_type": "image" },
            { "url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80", "alt": "Holding Krishna Keychain", "media_type": "image" },
            { "url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80", "alt": "Peacock Feather Keychain on Denim", "media_type": "image" },
            { "url": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80", "alt": "Backpack with Keychain", "media_type": "image" },
            { "url": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80", "alt": "Car Keys with Hare Krishna Keychain", "media_type": "image" }
        ]
    }'::jsonb,
    TRUE
),
(
    'trust_bar',
    'Sacred Service Highlights',
    'Our devotional commitments to every pilgrim and devotee.',
    '{
        "badges": [
            { "icon": "bi-shield-check", "label": "Secure Payments" },
            { "icon": "bi-arrow-repeat", "label": "Easy Returns" },
            { "icon": "bi-truck", "label": "All India Delivery" },
            { "icon": "bi-arrow-counterclockwise", "label": "Authentic Vedic Craft" },
            { "icon": "bi-chat-heart", "label": "Devotee Support" }
        ]
    }'::jsonb,
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    content = EXCLUDED.content,
    updated_at = NOW();
