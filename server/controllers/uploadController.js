const path = require('path');
const fs = require('fs');
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

const BUCKET_NAME = 'product-images';
let bucketChecked = false;

async function ensureBucketExists() {
  if (bucketChecked || !isSupabaseConfigured || !supabaseAdmin) return;
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = Array.isArray(buckets) && buckets.some(b => b.name === BUCKET_NAME || b.id === BUCKET_NAME);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 104857600 // 100MB
      });
    }
    bucketChecked = true;
  } catch (e) {
    // If listing fails or already exists, continue
    bucketChecked = true;
  }
}

async function uploadToCloudStorage(file) {
  if (isSupabaseConfigured && supabaseAdmin && file && file.path && fs.existsSync(file.path)) {
    try {
      await ensureBucketExists();
      const fileBuffer = fs.readFileSync(file.path);
      const ext = path.extname(file.originalname || file.filename).toLowerCase();
      const cleanFileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(cleanFileName, fileBuffer, {
          contentType: file.mimetype || 'image/jpeg',
          upsert: true
        });

      if (!error && data) {
        const { data: pubData } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(cleanFileName);

        if (pubData && pubData.publicUrl) {
          return pubData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('[UploadController] Cloud storage upload fallback notice:', err.message);
    }
  }
  return `/uploads/${file.filename}`;
}

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.'
      });
    }

    const fileUrl = await uploadToCloudStorage(req.file);

    res.status(201).json({
      success: true,
      message: 'Media uploaded successfully.',
      data: {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      url: fileUrl
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No media file uploaded.'
      });
    }

    const fileUrl = await uploadToCloudStorage(req.file);

    res.status(201).json({
      success: true,
      message: 'Media file uploaded successfully.',
      data: {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      url: fileUrl
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files uploaded.'
      });
    }

    const uploadedFiles = [];
    for (const file of req.files) {
      const fileUrl = await uploadToCloudStorage(file);
      uploadedFiles.push({
        filename: file.filename,
        url: fileUrl,
        size: file.size,
        mimetype: file.mimetype
      });
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully.`,
      data: uploadedFiles,
      urls: uploadedFiles.map(f => f.url)
    });
  } catch (err) {
    next(err);
  }
};
