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
     * Central resolver: Returns the optimal same-domain proxy URL for product images
     * @param {string} imageUrl - Original image URL or storage path
     * @returns {string} - Same-domain proxy URL or valid image URL
     */
    getProductImageUrl: function(imageUrl) {
      if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
        return PLACEHOLDER_IMAGE;
      }

      const trimmed = imageUrl.trim();

      // If already a same-domain proxy URL, return as-is
      if (trimmed.startsWith('/api/product-images/')) {
        return trimmed;
      }

      // If it's a local static asset (e.g. /assets/images/...), return as-is
      if (trimmed.startsWith('/assets/')) {
        return trimmed;
      }

      // Check if it belongs to the configured Supabase product-images bucket
      const storagePath = this.extractStoragePath(trimmed);
      if (storagePath) {
        return `/api/product-images/${storagePath}`;
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
     * Derives the original Supabase public URL for fallback
     */
    getSupabasePublicUrl: function(urlOrPath) {
      if (!urlOrPath || typeof urlOrPath !== 'string') return PLACEHOLDER_IMAGE;
      if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
        return urlOrPath;
      }
      const cleanPath = urlOrPath.replace(/^\/api\/product-images\//, '').replace(/^product-images\//, '');
      return `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
    },

    /**
     * Non-looping resilient image error handler.
     * Fallback sequence: Proxy (/api/product-images/...) -> Original Supabase URL -> Brand Placeholder -> Stop.
     * @param {HTMLImageElement} img - Image DOM element
     * @param {string} [originalFallbackUrl] - Optional original URL
     */
    handleImageError: function(img, originalFallbackUrl) {
      if (!img) return;

      const attempts = parseInt(img.dataset.failCount || '0', 10);
      img.dataset.failCount = String(attempts + 1);

      if (attempts === 0) {
        // Step 1: If proxy URL failed, try original direct Supabase public URL as fallback
        const fallback = originalFallbackUrl || img.dataset.originalSrc || this.getSupabasePublicUrl(img.src);
        if (fallback && fallback !== img.src) {
          img.src = fallback;
          return;
        }
      }

      // Step 2: Final fallback to default sacred placeholder and remove onerror to prevent loop
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
