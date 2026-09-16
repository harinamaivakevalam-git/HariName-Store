const { supabase, supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');
const db = require('../models/db');

// Default initial homepage structure
const DEFAULT_HOMEPAGE_SECTIONS = [
  {
    id: 'hero',
    title: 'Carry Krishna Wherever You Go',
    subtitle: 'Exquisite handcrafted devotional products, sacred shastras, and spiritual keepsakes designed to keep divine remembrance in your heart and everyday life.',
    is_active: true,
    content: {
      title_prefix: 'Carry',
      title_accent: 'Krishna',
      title_suffix: 'Wherever You Go',
      description: 'Exquisite handcrafted devotional products, sacred shastras, and spiritual keepsakes designed to keep divine remembrance in your heart and everyday life.',
      cta_text: 'Shop Collection',
      cta_link: '/shop.html',
      quote_verse: '“In every step, remember Krishna.”',
      quote_subtitle: 'Inspired by the timeless wisdom of Vrindavan',
      trust_rating: '4.9 / 5.0',
      trust_caption: 'Blessed by 1,200+ devotees across India',
      media_type: 'image', // 'image' | 'video'
      image_url: '/assets/images/krishna_hero_keychain.jpg',
      video_url: '',
      badge_top_title: 'Blessed in Vrindavan',
      badge_top_sub: 'Authentic & Sacred',
      badge_bottom_title: 'Solid Cast Brass & Enamel',
      badge_bottom_sub: 'Lifelong Divine Craft',
      benefits: [
        { icon: 'bi-flower1', title: 'REMEMBER', desc: 'Keep Krishna close throughout your daily journey.' },
        { icon: 'bi-music-note-beamed', title: 'CHANT', desc: 'Let the Maha-mantra be your sacred anchor in every moment.' },
        { icon: 'bi-gift', title: 'SHARE', desc: 'Gift a divine reminder to those you love and cherish.' }
      ]
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
      cta_text: 'Add to Cart',
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
