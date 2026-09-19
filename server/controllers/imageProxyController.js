const path = require('path');
const fs = require('fs');
const { supabaseAdmin, supabase, isSupabaseConfigured } = require('../config/supabase');

const BUCKET_NAME = 'product-images';

// MIME type lookup
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Validates and sanitizes a storage path inside product-images bucket.
 * Prevents path traversal and ensures only safe relative paths are accessed.
 */
function sanitizePath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return null;

  // Decode URI components safely
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch (e) {
    return null;
  }

  // Reject path traversal attacks or null bytes
  if (decoded.includes('\0') || decoded.includes('..') || /[\\]/.test(decoded)) {
    return null;
  }

  // Normalize path and remove leading/trailing slashes
  let clean = decoded.replace(/^\/+/, '').replace(/\/+$/, '');

  // Strip leading bucket name if client passed "product-images/..."
  if (clean.startsWith('product-images/')) {
    clean = clean.substring('product-images/'.length);
  }

  // Double check normalized form does not traverse
  const normalized = path.posix.normalize(clean);
  if (normalized.startsWith('..') || normalized.includes('/../') || normalized === '..') {
    return null;
  }

  return normalized;
}

/**
 * Controller: Proxy image from Supabase Storage product-images bucket
 */
exports.proxyProductImage = async (req, res) => {
  try {
    // req.params[0] captures wildcard after /api/product-images/ or /storage/v1/object/public/product-images/
    const rawPath = req.params[0] || req.params.path || req.path.replace(/^\/(api\/product-images|storage\/v1\/object\/public\/product-images|api\/storage\/product-images)\/?/, '');
    const cleanPath = sanitizePath(rawPath);

    if (!cleanPath) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid or disallowed storage path.'
      });
    }

    // Optional local cache check to serve hot images in <5ms without hitting Supabase repeatedly
    const cacheDir = path.join(__dirname, '../../uploads/cache/product-images');
    const safeLocalCacheFile = path.join(cacheDir, cleanPath.replace(/\//g, '_'));

    if (fs.existsSync(safeLocalCacheFile)) {
      const mime = getMimeType(cleanPath);
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(safeLocalCacheFile);
    }

    // Also check if the raw file exists directly in local uploads directory
    const filename = path.basename(cleanPath);
    const localUploadPath = path.join(__dirname, '../../uploads', filename);
    if (fs.existsSync(localUploadPath)) {
      const mime = getMimeType(filename);
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(localUploadPath);
    }

    // Download from Supabase Storage using Anycast DNS-bypassed client
    const client = supabaseAdmin || supabase;
    if (!isSupabaseConfigured || !client) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Storage backend is not configured.'
      });
    }

    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .download(cleanPath);

    if (error || !data) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product image '${cleanPath}' was not found in ${BUCKET_NAME} storage.`
      });
    }

    const arrayBuf = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const mimeType = data.type || getMimeType(cleanPath);

    // Save to local cache asynchronously for instant subsequent delivery
    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFile(safeLocalCacheFile, buffer, () => {});
    } catch (_) {}

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(buffer);
  } catch (err) {
    console.error('[ImageProxy] Error serving image:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process image proxy request.'
    });
  }
};
