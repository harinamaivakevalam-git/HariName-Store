/**
 * CRESCENDO - Centralized Audio & Electronics Product Catalog Data
 */

const CRESCENDO_DATA = {
  categories: [
    {
      id: 'cat-speakers',
      name: 'Speakers',
      slug: 'speakers',
      count: 24,
      image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=400&q=80',
      description: 'Room-filling high fidelity sound'
    },
    {
      id: 'cat-headphones',
      name: 'Headphones',
      slug: 'headphones',
      count: 18,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
      description: 'Studio grade wireless ANC audio'
    },
    {
      id: 'cat-earbuds',
      name: 'Earbuds',
      slug: 'earbuds',
      count: 12,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80',
      description: 'True wireless featherlight in-ear'
    },
    {
      id: 'cat-accessories',
      name: 'Accessories',
      slug: 'accessories',
      count: 12,
      image: 'https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?auto=format&fit=crop&w=400&q=80',
      description: 'Cables, audio stands & cases'
    },
    {
      id: 'cat-charger',
      name: 'Wireless Charger',
      slug: 'wireless-charger',
      count: 6,
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80',
      description: 'Fast wireless magnetic charging'
    }
  ],

  products: [
    {
      id: 'prod-001',
      name: 'Earbud Y168A',
      slug: 'earbud-y168a',
      category: 'Earbuds',
      category_slug: 'earbuds',
      brand: 'Sony',
      price: 270.00,
      old_price: 320.00,
      discount_percent: 16,
      badge: 'New',
      badge_type: 'purple',
      rating: 5.0,
      reviews_count: 124,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=800&q=80'
      ],
      stock: 45,
      colors: ['Black', 'Silver', 'Lavender'],
      description: 'Experience pure acoustic clarity with the Earbud Y168A. Equipped with dual dynamic drivers, active noise cancellation, and 36-hour battery life.',
      specifications: {
        'Driver Size': '11mm Dual Dynamic Drivers',
        'Frequency Response': '20Hz - 40kHz',
        'Battery Life': 'Up to 36 Hours with Charging Case',
        'Connectivity': 'Bluetooth 5.3 + Multipoint',
        'Water Resistance': 'IPX5 Sweat & Splash Proof'
      },
      featured: true,
      trending: true
    },
    {
      id: 'prod-002',
      name: 'Pro X168A Headphones',
      slug: 'pro-x168a-headphones',
      category: 'Headphones',
      category_slug: 'headphones',
      brand: 'Bose',
      price: 250.00,
      old_price: 320.00,
      discount_percent: 22,
      badge: 'Best Seller',
      badge_type: 'pink',
      rating: 5.0,
      reviews_count: 124,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80'
      ],
      stock: 28,
      colors: ['Purple', 'Black', 'White'],
      description: 'Experience immersive sound with deep bass and crystal clear audio. Designed for music lovers and professional creators alike.',
      specifications: {
        'Driver Size': '40mm Custom Titanium Drivers',
        'Noise Cancellation': 'Hybrid Active Noise Cancellation (40dB)',
        'Battery Life': '50 Hours Playtime (Quick Charge: 10 mins for 5 hrs)',
        'Weight': '250 grams',
        'Ear Cushions': 'Memory Foam with Protein Leather'
      },
      featured: true,
      trending: true
    },
    {
      id: 'prod-003',
      name: 'Speaker P168A',
      slug: 'speaker-p168a',
      category: 'Speakers',
      category_slug: 'speakers',
      brand: 'JBL',
      price: 340.00,
      old_price: 399.00,
      discount_percent: 15,
      badge: 'Sale',
      badge_type: 'blue',
      rating: 4.9,
      reviews_count: 98,
      image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80'
      ],
      stock: 15,
      colors: ['Midnight Black', 'Space Gray'],
      description: '360-degree omnidirectional acoustics engineered with dual passive radiators and smart acoustic room tuning.',
      specifications: {
        'Output Power': '60W RMS High Output',
        'Battery': '24 Hours Continuous Playback',
        'Connectivity': 'Bluetooth 5.2, AUX, AirPlay 2',
        'Water Resistance': 'IP67 Waterproof & Dustproof'
      },
      featured: true,
      trending: true
    },
    {
      id: 'prod-004',
      name: 'Noise X200',
      slug: 'noise-x200',
      category: 'Headphones',
      category_slug: 'headphones',
      brand: 'Apple',
      price: 299.00,
      old_price: 350.00,
      discount_percent: 14,
      badge: 'Sale',
      badge_type: 'blue',
      rating: 4.8,
      reviews_count: 88,
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80'
      ],
      stock: 32,
      colors: ['Space Gray', 'Silver'],
      description: 'Premium wireless noise cancelling headphones with spatial audio tracking and ultra-lightweight ergonomic headband.',
      specifications: {
        'Driver': '40mm Neodymium Magnet',
        'Battery': '40 Hours Playback',
        'Microphones': '6 Beamforming Microphones for Calls'
      },
      featured: false,
      trending: true
    },
    {
      id: 'prod-005',
      name: 'Bass Head 2.0',
      slug: 'bass-head-2-0',
      category: 'Headphones',
      category_slug: 'headphones',
      brand: 'Samsung',
      price: 210.00,
      old_price: 260.00,
      discount_percent: 19,
      badge: 'Best Seller',
      badge_type: 'pink',
      rating: 4.9,
      reviews_count: 112,
      image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80'
      ],
      stock: 18,
      colors: ['Matte Black', 'Obsidian Blue'],
      description: 'Enhanced low-end sub-bass resonance tuned specially for electronic, hip-hop, and dynamic cinematic listening.',
      specifications: {
        'Driver': '50mm Heavy Bass Dynamic Driver',
        'Impedance': '32 Ohm',
        'Cable': 'Detachable 3.5mm Gold-plated Cable Included'
      },
      featured: true,
      trending: true
    },
    {
      id: 'prod-006',
      name: 'Air Buds Pro',
      slug: 'air-buds-pro',
      category: 'Earbuds',
      category_slug: 'earbuds',
      brand: 'Apple',
      price: 220.00,
      old_price: 280.00,
      discount_percent: 21,
      badge: 'New',
      badge_type: 'purple',
      rating: 5.0,
      reviews_count: 150,
      image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=80'
      ],
      stock: 40,
      colors: ['White', 'Matte Lavender'],
      description: 'Effortless in-ear fit with pressure-relieving vents, adaptive audio transparency mode, and MagSafe wireless case.',
      specifications: {
        'Chip': 'H2 High-Efficiency Audio Processor',
        'Charging': 'Wireless Qi + Lightning Fast Charge',
        'Weight': '5.3g per bud'
      },
      featured: true,
      trending: true
    },
    {
      id: 'prod-007',
      name: 'SoundMax 360 Speaker',
      slug: 'soundmax-360-speaker',
      category: 'Speakers',
      category_slug: 'speakers',
      brand: 'JBL',
      price: 180.00,
      old_price: 220.00,
      discount_percent: 18,
      badge: 'Sale',
      badge_type: 'blue',
      rating: 4.7,
      reviews_count: 65,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80'
      ],
      stock: 20,
      colors: ['Midnight Black', 'Forest Green'],
      description: 'Portable cylindrical party speaker with dynamic RGB ambient pulse lights and dual woofer radiators.',
      specifications: {
        'Power': '40W RMS',
        'Battery': '16 Hours Playtime'
      },
      featured: false,
      trending: false
    },
    {
      id: 'prod-008',
      name: 'Wireless Magnetic Pad Q1',
      slug: 'wireless-magnetic-pad-q1',
      category: 'Wireless Charger',
      category_slug: 'wireless-charger',
      brand: 'Apple',
      price: 89.00,
      old_price: 110.00,
      discount_percent: 19,
      badge: 'New',
      badge_type: 'purple',
      rating: 4.9,
      reviews_count: 42,
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'
      ],
      stock: 50,
      colors: ['Silver Aluminum', 'Midnight'],
      description: 'Ultra slim aerospace aluminum magnetic wireless charger pad compatible with Qi devices and modern smartphones.',
      specifications: {
        'Fast Charge': '15W Peak Output',
        'Cable': 'Braided 1.5m USB-C Cable'
      },
      featured: false,
      trending: false
    }
  ],

  orders: [
    {
      id: 'ord-12345',
      order_number: '#ORD12345',
      date: 'Mar 30, 2024',
      total: 250.00,
      status: 'delivered',
      product_name: 'Pro X168A Headphones',
      product_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80',
      color: 'Purple',
      quantity: 1,
      customer_name: 'John Doe',
      customer_email: 'john@example.com'
    },
    {
      id: 'ord-12344',
      order_number: '#ORD12344',
      date: 'Mar 25, 2024',
      total: 450.00,
      status: 'processing',
      product_name: 'Speaker P168A',
      product_image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=200&q=80',
      color: 'Black',
      quantity: 2,
      customer_name: 'Sarah Smith',
      customer_email: 'sarah@example.com'
    },
    {
      id: 'ord-12343',
      order_number: '#ORD12343',
      date: 'Feb 28, 2024',
      total: 270.00,
      status: 'shipped',
      product_name: 'Earbud Y168A',
      product_image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=200&q=80',
      color: 'Black',
      quantity: 1,
      customer_name: 'Mike Johnson',
      customer_email: 'mike@example.com'
    },
    {
      id: 'ord-12342',
      order_number: '#ORD12342',
      date: 'Feb 20, 2024',
      total: 199.00,
      status: 'cancelled',
      product_name: 'Noise X200',
      product_image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80',
      color: 'Silver',
      quantity: 1,
      customer_name: 'Emily Davis',
      customer_email: 'emily@example.com'
    }
  ],

  addresses: [
    {
      id: 'addr-01',
      type: 'Home',
      is_default: true,
      name: 'John Doe',
      street: '123 Music Street',
      city_state: 'New York, NY 10001, USA',
      phone: '+1 234 567 890'
    },
    {
      id: 'addr-02',
      type: 'Office',
      is_default: false,
      name: 'John Doe',
      street: '456 Tech Avenue',
      city_state: 'San Francisco, CA 94107, USA',
      phone: '+1 234 567 890'
    }
  ]
};

window.CRESCENDO_DATA = CRESCENDO_DATA;
