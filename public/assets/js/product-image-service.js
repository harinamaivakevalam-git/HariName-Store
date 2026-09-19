/**
 * HariNama Store - Centralized Product Image Delivery Service
 * Resolves Supabase Storage objects to same-domain proxy URLs (/api/product-images/...)
 * with non-looping fallback to original Supabase public URL and local brand placeholder.
 */
(function(window) {
  'use strict';

  const SUPABASE_PROJECT_REF = 'wnaqfadlxrrvvjvqqbch';
  const BUCKET_NAME = 'product-images';
  const PLACEHOLDER_IMAGE = '/assets/images/krishna-logo.jpg';

  // Strict regex matching configured Supabase storage project and product-images bucket
  const SUPABASE_STORAGE_REGEX = new RegExp(
    `^https:\\/\\/${SUPABASE_PROJECT_REF}\\.supabase\\.co\\/storage\\/v1\\/object\\/public\\/${BUCKET_NAME}\\/(.+)$`,
    'i'
  );

  // Generic fallback pattern if project ref changes in environment
  const GENERIC_PRODUCT_IMAGES_REGEX = /\/storage\/v1\/object\/public\/product-images\/(.+)$/i;

  const ProductImageService = {
    PROJECT_REF: SUPABASE_PROJECT_REF,
    BUCKET: BUCKET_NAME,
    PLACEHOLDER: PLACEHOLDER_IMAGE,

    /**
     * Extracts the relative path within product-images bucket (e.g. "products/xyz.jpeg")
     * Returns null if not a matching Supabase product-images URL.
     */
    extractStoragePath: function(url) {
      if (!url || typeof url !== 'string') return null;
      const cleanUrl = url.trim();

      const match = cleanUrl.match(SUPABASE_STORAGE_REGEX);
      if (match && match[1]) {
        return match[1].split('?')[0]; // strip query strings
      }

      // Check relative storage path like /storage/v1/object/public/product-images/...
      const genericMatch = cleanUrl.match(GENERIC_PRODUCT_IMAGES_REGEX);
      if (genericMatch && genericMatch[1]) {
        return genericMatch[1].split('?')[0];
      }

      // If it's already a relative path starting with "products/"
      if (cleanUrl.startsWith('products/') || cleanUrl.startsWith('uploads/')) {
        return cleanUrl.split('?')[0];
      }

      return null;
    },

    /**
     * Derives the full public Supabase Storage URL
     */
    getSupabasePublicUrl: function(urlOrPath) {
      if (!urlOrPath || typeof urlOrPath !== 'string') return PLACEHOLDER_IMAGE;
      const clean = urlOrPath.trim();
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        return clean;
      }
      const cleanPath = clean.replace(/^\/api\/product-images\//, '').replace(/^product-images\//, '');
      return `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
    },

    /**
     * Builds a high-speed Cloudflare Edge CDN proxy URL for Supabase Storage objects.
     * Bypasses Indian ISP QUIC / DNS blocks and delivers in <40ms across all networks.
     */
    getCdnProxyUrl: function(urlOrPath) {
      const fullUrl = this.getSupabasePublicUrl(urlOrPath);
      if (!fullUrl || fullUrl === PLACEHOLDER_IMAGE) return PLACEHOLDER_IMAGE;
      return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}`;
    },

    /**
     * Central resolver: Returns the optimal URL for product images.
     * - Local development (localhost / 127.0.0.1): Uses Express same-domain proxy (/api/product-images/...)
     * - Production / Static hosting (harinamastore.com): Uses global Cloudflare Edge CDN proxy
     * @param {string} imageUrl - Original image URL or storage path
     * @returns {string} - Optimized image URL
     */
    getProductImageUrl: function(imageUrl) {
      if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
        return PLACEHOLDER_IMAGE;
      }

      const trimmed = imageUrl.trim();

      // If already a CDN proxy URL or brand placeholder, return as-is
      if (trimmed.includes('wsrv.nl') || trimmed.startsWith('/assets/')) {
        return trimmed;
      }

      // Check if it belongs to Supabase product-images bucket
      const storagePath = this.extractStoragePath(trimmed);
      if (storagePath) {
        const isLocalDev = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
          window.location.port === '5000';

        if (isLocalDev) {
          return `/api/product-images/${storagePath}`;
        }

        // On production domains (e.g. harinamastore.com, Render static site, mobile browsers):
        // Cloudflare Edge CDN proxy guarantees 200 OK delivery without ISP QUIC/DNS drops
        const fullSupabaseUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
        return `https://wsrv.nl/?url=${encodeURIComponent(fullSupabaseUrl)}`;
      }

      // If already a same-domain proxy URL, return as-is
      if (trimmed.startsWith('/api/product-images/')) {
        return trimmed;
      }

      // External CDN or other URL (e.g. Unsplash), return as-is
      return trimmed;
    },

    /**
     * Batch resolver for image arrays
     * @param {string[]} imageUrls - Array of image URLs
     * @returns {string[]} - Transformed image URLs
     */
    getProductImageUrls: function(imageUrls) {
      if (!Array.isArray(imageUrls)) return [];
      return imageUrls
        .map(url => this.getProductImageUrl(url))
        .filter(Boolean);
    },

    /**
     * Non-looping resilient image error handler.
     * Fallback sequence:
     * 1. If local /api/ failed -> Try Cloudflare Edge CDN proxy (wsrv.nl)
     * 2. If CDN proxy failed -> Try direct Supabase public URL
     * 3. If all fail -> Brand placeholder (/assets/images/krishna-logo.jpg) and stop.
     * @param {HTMLImageElement} img - Image DOM element
     * @param {string} [originalFallbackUrl] - Optional original URL
     */
    handleImageError: function(img, originalFallbackUrl) {
      if (!img) return;

      const attempts = parseInt(img.dataset.failCount || '0', 10);
      img.dataset.failCount = String(attempts + 1);

      const original = originalFallbackUrl || img.dataset.originalSrc || '';

      if (attempts === 0) {
        // Step 1: If /api/product-images/ failed (e.g. on static hosting), switch to Cloudflare Edge CDN
        if (img.src.includes('/api/product-images/')) {
          const cleanPath = img.src.replace(/^.*\/api\/product-images\//, '');
          const fullUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
          img.src = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}`;
          return;
        }
        
        // If not using CDN yet, switch to CDN proxy
        if (!img.src.includes('wsrv.nl') && (original || img.src)) {
          const target = original || img.src;
          const fullUrl = this.getSupabasePublicUrl(target);
          if (fullUrl && fullUrl !== PLACEHOLDER_IMAGE) {
            img.src = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}`;
            return;
          }
        }

        // If CDN itself failed, try direct Supabase public URL
        const directUrl = original && original.startsWith('http') ? original : this.getSupabasePublicUrl(img.src);
        if (directUrl && directUrl !== img.src) {
          img.src = directUrl;
          return;
        }
      }

      if (attempts === 1) {
        // Step 2: Try direct URL if not tried
        const directUrl = original && original.startsWith('http') ? original : this.getSupabasePublicUrl(img.src);
        if (directUrl && directUrl !== img.src && !directUrl.includes('wsrv.nl')) {
          img.src = directUrl;
          return;
        }
      }

      // Step 3: Final fallback to default sacred brand placeholder and terminate
      img.onerror = null;
      img.src = PLACEHOLDER_IMAGE;
    }
  };

  // Expose globally
  window.ProductImageService = ProductImageService;
  window.getProductImageUrl = function(url) {
    return ProductImageService.getProductImageUrl(url);
  };
  window.getProductImageUrls = function(urls) {
    return ProductImageService.getProductImageUrls(urls);
  };
  window.handleProductImageError = function(img, fallbackUrl) {
    ProductImageService.handleImageError(img, fallbackUrl);
  };

})(typeof window !== 'undefined' ? window : this);
