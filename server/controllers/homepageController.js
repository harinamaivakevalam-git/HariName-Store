const { supabase, supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const db = require('../models/db');

// Default initial homepage structure - Complete Top to Bottom Editable Sections
const DEFAULT_HOMEPAGE_SECTIONS = [
  {
    id: 'topbar',
    title: 'Top Announcement Bar',
    subtitle: 'Header top marquee and devotional greeting strip.',
    is_active: true,
    content: {
      left_icon: '🌿',
      item1: 'Hare Krishna',
      item2: 'Spread Love',
      item3: 'Be Remembered',
      right_icon: '🌿'
    }
  },
  {
    id: 'hero',
    title: 'Carry Krishna Wherever You Go',
    subtitle: 'Exquisite handcrafted devotional products, sacred shastras, and spiritual keepsakes designed to keep divine remembrance in your heart and everyday life.',
    is_active: true,
    content: {
      eyebrow: 'A DEVOTIONAL LIFESTYLE STORE',
      title_prefix: 'Carry',
      title_accent: 'Krishna',
      title_suffix: 'Wherever You Go',
      description: 'Beautiful devotional products to keep Krishna in your heart and everyday life.',
      cta_text: 'Shop Now',
      cta_link: '/shop.html',
      badge1_icon: '🪷',
      badge1_label: 'Authentic Products',
      badge2_icon: '🌐',
      badge2_label: 'Worldwide Shipping',
      badge3_icon: '🛡️',
      badge3_label: 'Secure Payments',
      badge4_icon: '🤍',
      badge4_label: 'Spreading Happiness',
      devotional_tagline: '— A KINDER WORLD THROUGH DEVOTION —',
      media_type: 'image', // 'image' | 'video'
      image_url: '/assets/images/desktop_hero_banner.jpg',
      video_url: ''
    }
  },
  {
    id: 'daily_bhakti',
    title: 'Bring Bhakti into Daily Life',
    subtitle: 'Simple items. Eternal connection.',
    is_active: true,
    content: {
      title: 'Bring Bhakti into Daily Life',
      subtitle: 'Simple items. Eternal connection.',
      cta_text: 'Explore Collection',
      cta_link: '/shop.html',
      image_url: '/assets/images/bhakti_mug_banner.jpg',
      video_url: '',
      media_type: 'image'
    }
  },
  {
    id: 'featured_header',
    title: 'Featured Products',
    subtitle: 'Handpicked with love for your devotional journey',
    is_active: true,
    content: {
      title: 'Featured Products',
      subtitle: 'Handpicked with love for your devotional journey',
      view_all_text: 'View All',
      view_all_link: '/shop.html'
    }
  },
  {
    id: 'promo_banner',
    title: 'Sacred Devotional Reminder',
    subtitle: 'Carry Krishna with you everywhere.',
    is_active: true,
    content: {
      title: 'Sacred Devotional Reminder',
      subtitle: 'Carry Krishna with you everywhere.',
      description: 'A simple everyday reminder to pause, remember Krishna, and chant.',
      mantra_verse: 'Hare Krishna Hare Krishna\nKrishna Krishna Hare Hare\nHare Rama Hare Rama\nRama Rama Hare Hare',
      mantra_chant: 'Chant & Be Happy.',
      price: '',
      cta_text: '',
      cta_link: '',
      show_cta: false,
      image_url: '/assets/images/krishna-logo.jpg',
      video_url: '',
      media_type: 'image'
    }
  },
  {
    id: 'why_krishna',
    title: 'Why Carry Krishna?',
    subtitle: 'A small reminder can change the direction of your day.',
    is_active: true,
    content: {
      title: 'Why Carry Krishna?',
      subtitle: 'A small reminder can change the direction of your day.',
      quote: '“Carry a reminder of eternal happiness.”',
      cards: [
        {
          icon: 'bi-flower2',
          title: 'SPIRITUAL AWARENESS',
          text: 'A moment of peace in a busy life.'
        },
        {
          icon: 'bi-brightness-high',
          title: 'POSITIVE VIBES',
          text: 'Stay connected to what truly matters.'
        },
        {
          icon: 'bi-heart',
          title: 'SPREAD JOY',
          text: 'A simple way to inspire others.'
        }
      ]
    }
  },
  {
    id: 'lifestyle_gallery',
    title: 'Take Krishna With You',
    subtitle: 'From your morning commute to your next journey.',
    is_active: true,
    content: {
      title: 'Take Krishna With You',
      subtitle: 'From your morning commute to your next journey.',
      items: [
        { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80', alt: 'Devotional Keychain on Bag', media_type: 'image' },
        { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', alt: 'Holding Krishna Keychain', media_type: 'image' },
        { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80', alt: 'Peacock Feather Keychain on Denim', media_type: 'image' },
        { url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80', alt: 'Backpack with Keychain', media_type: 'image' },
        { url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80', alt: 'Car Keys with Hare Krishna Keychain', media_type: 'image' }
      ]
    }
  },
  {
    id: 'reviews_header',
    title: 'Loved by Devotees Across India',
    subtitle: 'Real feedback from sincere practitioners and pilgrims.',
    is_active: true,
    content: {
      title: 'Loved by Devotees Across India',
      subtitle: 'Real feedback from sincere practitioners and pilgrims.'
    }
  },
  {
    id: 'trust_bar',
    title: 'Sacred Service Highlights',
    subtitle: 'Our devotional commitments to every pilgrim and devotee.',
    is_active: true,
    content: {
      badges: [
        { icon: 'bi-shield-check', label: 'Secure Payments' },
        { icon: 'bi-arrow-repeat', label: 'Easy Returns' },
        { icon: 'bi-truck', label: 'All India Delivery' },
        { icon: 'bi-arrow-counterclockwise', label: 'Authentic Vedic Craft' },
        { icon: 'bi-chat-heart', label: 'Devotee Support' }
      ]
    }
  },
  {
    id: 'footer_signoff',
    title: 'Footer Devotional Signoff',
    subtitle: 'Artwork and closing verse shown right above the footer.',
    is_active: true,
    content: {
      verse: 'Hare Krishna ♡',
      divider_icon: '🪷',
      subtitle: 'A KINDER WORLD THROUGH DEVOTION'
    }
  }
];

// Initialize in-memory cache if not already set
if (!db.data.homepage_sections) {
  db.data.homepage_sections = JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_SECTIONS));
}

// 1. GET /api/homepage (Public)
exports.getHomepageConfig = async (req, res, next) => {
  try {
    let sections = null;

    if (isSupabaseConfigured && (supabase || supabaseAdmin)) {
      try {
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from('homepage_sections')
          .select('*')
          .eq('is_active', true);

        if (!error && Array.isArray(data) && data.length > 0) {
          sections = data;
        }
      } catch (sbErr) {
        console.warn('[Homepage] Supabase query notice:', sbErr.message);
      }
    }

    if (!sections || sections.length === 0) {
      sections = db.findAll('homepage_sections') || DEFAULT_HOMEPAGE_SECTIONS;
    }

    // Convert array of sections to structured object map
    const sectionMap = {};
    sections.forEach(s => {
      sectionMap[s.id] = {
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        is_active: s.is_active !== undefined ? s.is_active : true,
        content: typeof s.content === 'object' ? s.content : (s.content ? JSON.parse(s.content) : {}),
        updated_at: s.updated_at
      };
    });

    res.json({
      success: true,
      message: 'Homepage configuration loaded.',
      data: sectionMap,
      sections: sections
    });
  } catch (err) {
    next(err);
  }
};

// 2. PUT /api/homepage/:sectionId (Admin Only)
exports.updateHomepageSection = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { title, subtitle, content, is_active = true } = req.body;

    if (!sectionId) {
      return res.status(400).json({ success: false, message: 'Section ID is required.' });
    }

    const payload = {
      id: sectionId,
      title: title || '',
      subtitle: subtitle || '',
      content: content || {},
      is_active: Boolean(is_active),
      updated_at: new Date().toISOString()
    };

    let saved = false;

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('homepage_sections')
          .upsert(payload)
          .select()
          .maybeSingle();

        if (!error && data) {
          saved = true;
        } else if (error) {
          console.warn('[Homepage] Supabase upsert error:', error.message);
        }
      } catch (sbEx) {
        console.warn('[Homepage] Supabase upsert exception:', sbEx.message);
      }
    }

    // Update in-memory DB mirror
    const existing = db.findOne('homepage_sections', s => s.id === sectionId);
    if (existing) {
      db.update('homepage_sections', sectionId, payload);
    } else {
      db.insert('homepage_sections', payload);
    }

    res.json({
      success: true,
      message: `Homepage section "${sectionId}" updated successfully! 🌸`,
      data: payload
    });
  } catch (err) {
    next(err);
  }
};

// 3. PUT /api/homepage (Bulk Save All Sections - Admin Only)
exports.updateAllSections = async (req, res, next) => {
  try {
    const { sections } = req.body;

    if (!sections || typeof sections !== 'object') {
      return res.status(400).json({ success: false, message: 'Sections object is required.' });
    }

    const sectionList = Array.isArray(sections) ? sections : Object.values(sections);
    const updatedSections = [];

    for (const s of sectionList) {
      if (!s.id) continue;
      const payload = {
        id: s.id,
        title: s.title || '',
        subtitle: s.subtitle || '',
        content: s.content || {},
        is_active: s.is_active !== undefined ? Boolean(s.is_active) : true,
        updated_at: new Date().toISOString()
      };

      if (isSupabaseConfigured && supabaseAdmin) {
        try {
          await supabaseAdmin.from('homepage_sections').upsert(payload);
        } catch (e) {}
      }

      const existing = db.findOne('homepage_sections', item => item.id === s.id);
      if (existing) {
        db.update('homepage_sections', s.id, payload);
      } else {
        db.insert('homepage_sections', payload);
      }

      updatedSections.push(payload);
    }

    res.json({
      success: true,
      message: 'All homepage sections saved successfully! 🌸',
      data: updatedSections
    });
  } catch (err) {
    next(err);
  }
};

// 4. POST /api/homepage/reset (Admin Only)
exports.resetHomepageDefaults = async (req, res, next) => {
  try {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_HOMEPAGE_SECTIONS));

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('homepage_sections').upsert(defaults);
      } catch (e) {}
    }

    db.data.homepage_sections = defaults;

    res.json({
      success: true,
      message: 'Homepage restored to default holy configuration.',
      data: defaults
    });
  } catch (err) {
    next(err);
  }
};
