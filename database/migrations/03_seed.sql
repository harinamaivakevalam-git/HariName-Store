-- ============================================================================
-- HARINAMA STORE — INITIAL SEED DATA
-- Migration 03: Categories, Brands, Products, Images & Coupons
-- ============================================================================

-- 1. Insert Categories
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order, status) VALUES
('c0000001-0000-0000-0000-000000000001', 'Devotional Keychains', 'devotional-keychains', 'Handcrafted acrylic, enamel, and brass devotional keychains.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 1, 'active'),
('c0000001-0000-0000-0000-000000000002', 'Sacred Books & Shastras', 'sacred-books', 'Authentic Vedic scriptures, Bhagavad Gita, and sacred philosophy.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 2, 'active'),
('c0000001-0000-0000-0000-000000000003', 'Japa & Chanting', 'japa-chanting', 'Authentic Vrindavan Tulasi & Neem meditation prayer beads.', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80', 3, 'active'),
('c0000001-0000-0000-0000-000000000004', 'Gift Sets & Bundles', 'gift-sets', 'Curated spiritual gift hampers, unboxing collections & puja sets.', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80', 4, 'active')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. Insert Brands
INSERT INTO public.brands (id, name, slug, logo_url, description, status) VALUES
('b0000001-0000-0000-0000-000000000001', 'HariNama Crafts', 'harinama-crafts', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80', 'Original sacred keepsakes and devotional items crafted with love.', 'active'),
('b0000001-0000-0000-0000-000000000002', 'Bhaktivedanta Book Trust', 'bbt', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80', 'World publisher of classic Vedic literature and shastras.', 'active'),
('b0000001-0000-0000-0000-000000000003', 'Vrindavan Naturals', 'vrindavan-naturals', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=200&q=80', 'Sacred botanical prayer beads and handcrafted japa supplies.', 'active')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 3. Insert Products
INSERT INTO public.products (id, name, title, slug, description, short_description, price, compare_price, sku, stock, category_id, brand_id, material, status, featured, trending, rating, reviews_count) VALUES
('a0000001-0000-0000-0000-000000000001', 'Peacock Feather', 'Peacock Feather Keychain', 'peacock-feather-keychain', 'A timeless devotional keychain inspired by Sri Krishna''s crown feather. Made from high-grade gloss acrylic with double-sided HD print and polished gold keyring.', 'Double-sided HD acrylic with gold keyring.', 99.00, 149.00, 'HN-KC-001', 120, 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Acrylic', 'active', true, true, 4.9, 24),

('a0000001-0000-0000-0000-000000000002', 'Krishna Flute', 'Krishna Flute Keychain', 'krishna-flute-keychain', 'Delicate Krishna flute (Venu) keychain with tiny peacock feather charm. Solid zinc alloy with antique gold electroplating. Rust-proof and built for everyday use.', 'Solid zinc alloy with antique gold plating.', 129.00, 199.00, 'HN-KC-002', 85, 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Metal', 'active', true, true, 4.8, 19),

('a0000001-0000-0000-0000-000000000003', 'Maha-Mantra', 'Maha-Mantra Keychain (Hare Krishna)', 'maha-mantra-keychain', 'The sacred 16-word Maha-Mantra engraved in Devanagari on one side and English on reverse: Hare Krishna Hare Krishna Krishna Krishna Hare Hare / Hare Rama Hare Rama Rama Rama Hare Hare.', 'Dual-sided Hindi & English sacred mantra engraving.', 149.00, 229.00, 'HN-KC-003', 60, 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Metal', 'active', true, true, 5.0, 42),

('a0000001-0000-0000-0000-000000000004', 'Radhe Radhe', 'Radhe Radhe Enamel Keychain', 'radhe-radhe-enamel-keychain', 'Vibrant hard enamel keychain with sweet "Radhe Radhe" calligraphy, framed by blooming lotus and peacock feathers. Symbol of pure divine love and devotion.', 'Hard enamel with bright colors & protective clear gloss.', 129.00, 189.00, 'HN-KC-004', 95, 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Acrylic', 'active', true, false, 4.9, 16),

('a0000001-0000-0000-0000-000000000005', 'Baby Krishna (Makhan Chor)', 'Baby Krishna Keychain', 'baby-krishna-keychain', 'Adorable Bal Krishna holding butter pot (Makhan Chor) charm keychain. A reminder of Krishna''s sweet childhood pastimes in Gokul and Vrindavan.', 'Cut-out acrylic with double-sided glossy finish.', 99.00, 149.00, 'HN-KC-005', 110, 'c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Acrylic', 'active', true, false, 4.7, 11),

('a0000001-0000-0000-0000-000000000006', 'Bhagavad Gita As It Is', 'Bhagavad Gita As It Is (Deluxe Edition)', 'bhagavad-gita-as-it-is', 'The definitive English edition of Srimad Bhagavad Gita with original Sanskrit verses, Roman transliterations, word-for-word meanings, and purports by A.C. Bhaktivedanta Swami Prabhupada.', 'Deluxe hardbound, 900+ pages with color plates.', 299.00, 450.00, 'HN-BK-001', 50, 'c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'Hardbound Book', 'active', true, true, 5.0, 128),

('a0000001-0000-0000-0000-000000000007', 'Authentic Tulasi Japa Mala', 'Tulasi Japa Mala (108 Beads)', 'authentic-tulasi-japa-mala', 'Sacred 108-bead Tulasi wood Japa Mala hand-carved in holy Vrindavan. Strung on durable silk thread with traditional hand-tied knots between each bead. Includes embroidered cotton bead bag.', '108 hand-carved Tulasi beads with cotton japa bag.', 349.00, 499.00, 'HN-JP-001', 40, 'c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'Wood', 'active', true, true, 4.9, 87),

('a0000001-0000-0000-0000-000000000008', 'Devotee Gift Set', 'Devotee Gift Set (4 Keychains + Blessed Bag)', 'devotee-gift-set-bundle', 'Complete gift bundle containing 4 flagship keychains (Peacock Feather, Krishna Flute, Maha-Mantra, Radhe Radhe) packaged in a gold-embossed devotional presentation box with Maha-Mantra cards.', 'Complete 4-piece keychain set in gift packaging.', 399.00, 599.00, 'HN-GS-001', 30, 'c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 'Multi-Material', 'active', true, true, 5.0, 34)
ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, stock = EXCLUDED.stock;

-- 4. Insert Product Images
INSERT INTO public.product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
('a0000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 'Peacock Feather Keychain', 1, true),
('a0000001-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80', 'Krishna Flute Keychain', 1, true),
('a0000001-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80', 'Maha-Mantra Keychain', 1, true),
('a0000001-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'Radhe Radhe Enamel Keychain', 1, true),
('a0000001-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 'Baby Krishna Keychain', 1, true),
('a0000001-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 'Bhagavad Gita As It Is', 1, true),
('a0000001-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80', 'Tulasi Japa Mala', 1, true),
('a0000001-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80', 'Devotee Gift Set', 1, true);

-- 5. Insert Active Coupons
INSERT INTO public.coupons (code, description, discount_type, discount_value, minimum_order, maximum_discount, expiry_date, status) VALUES
('WELCOME10', 'Welcome Holy Blessing Discount for new devotees', 'fixed', 50.00, 199.00, 50.00, CURRENT_TIMESTAMP + INTERVAL '1 year', 'active'),
('KRISHNA50', 'Flat ₹50 holy discount on all orders', 'fixed', 50.00, 249.00, 50.00, CURRENT_TIMESTAMP + INTERVAL '1 year', 'active'),
('RADHA100', 'Special ₹100 discount on gift bundles and sacred sets', 'fixed', 100.00, 499.00, 100.00, CURRENT_TIMESTAMP + INTERVAL '1 year', 'active')
ON CONFLICT (code) DO NOTHING;
