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
    title: 'harer nāma harer nāma',
    subtitle: 'harer nāmaiva kevalam',
    is_active: true,
    content: {
      title: 'harer nāma harer nāma',
      subtitle: 'harer nāmaiva kevalam',
      description: 'kalau nāsty eva nāsty eva\nnāsty eva gatir anyathā',
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
    is_active: false,
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

function normalizeMediaUrl(url) {
  if (typeof url !== 'string') return url;
  if (url.includes('.supabase.co/storage/v1/object/public/')) {
    return url.replace(/^https?:\/\/[^\/]+\/storage\/v1\/object\/public\//, '/storage/v1/object/public/');
  }
  return url;
}

function normalizeSectionContent(content) {
  if (!content || typeof content !== 'object') return content;
  const result = Array.isArray(content) ? [...content] : { ...content };
  for (const k of Object.keys(result)) {
    if (typeof result[k] === 'string') {
      result[k] = normalizeMediaUrl(result[k]);
    } else if (Array.isArray(result[k])) {
      result[k] = result[k].map(item => {
        if (typeof item === 'string') return normalizeMediaUrl(item);
        if (item && typeof item === 'object' && item.url) {
          return { ...item, url: normalizeMediaUrl(item.url) };
        }
        return item;
      });
    } else if (result[k] && typeof result[k] === 'object') {
      result[k] = normalizeSectionContent(result[k]);
    }
  }
  return result;
}

    // Convert array of sections to structured object map
    const sectionMap = {};
    sections.forEach(s => {
      const rawContent = typeof s.content === 'object' ? s.content : (s.content ? JSON.parse(s.content) : {});
      sectionMap[s.id] = {
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        is_active: s.is_active !== undefined ? s.is_active : true,
        content: normalizeSectionContent(rawContent),
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

const path = require('path');
const fs = require('fs');

async function processMediaValue(val) {
  if (typeof val !== 'string' || !val.startsWith('data:')) return val;
  try {
    const matches = val.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return val;

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    let ext = mimeType.split('/')[1] || 'jpg';
    if (ext.includes(';')) ext = ext.split(';')[0];
    if (ext === 'jpeg') ext = 'jpg';

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const cloudFileName = `uploads/${filename}`;
        supabaseAdmin.storage
          .from('product-images')
          .upload(cloudFileName, buffer, {
            contentType: mimeType,
            upsert: true
          }).catch(e => console.warn('[Homepage] Background cloud upload notice:', e.message));
      } catch (_) {}
    }
    return `/uploads/${filename}`;
  } catch (err) {
    console.warn('[HomepageController] Failed to convert base64 image:', err.message);
    return val;
  }
}

async function sanitizeSectionContent(content) {
  if (!content || typeof content !== 'object') return content;
  const sanitized = Array.isArray(content) ? [...content] : { ...content };

  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string' && sanitized[key].startsWith('data:')) {
      sanitized[key] = await processMediaValue(sanitized[key]);
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = await Promise.all(sanitized[key].map(async item => {
        if (typeof item === 'string' && item.startsWith('data:')) {
          return await processMediaValue(item);
        } else if (item && typeof item === 'object' && item.url && typeof item.url === 'string' && item.url.startsWith('data:')) {
          return { ...item, url: await processMediaValue(item.url) };
        }
        return item;
      }));
    } else if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = await sanitizeSectionContent(sanitized[key]);
    }
  }
  return sanitized;
}

// 2. PUT /api/homepage/:sectionId (Admin Only)
exports.updateHomepageSection = async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { title, subtitle, content, is_active } = req.body;

    const sanitizedContent = await sanitizeSectionContent(content || {});

    const payload = {
      id: sectionId,
      title: title || '',
      subtitle: subtitle || '',
      content: sanitizedContent,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('homepage_sections').upsert(payload);
      } catch (e) {}
    }

    const existing = db.findOne('homepage_sections', item => item.id === sectionId);
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
exports.updateSection = exports.updateHomepageSection;

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
      const sanitizedContent = await sanitizeSectionContent(s.content || {});
      const payload = {
        id: s.id,
        title: s.title || '',
        subtitle: s.subtitle || '',
        content: sanitizedContent,
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
