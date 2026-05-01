const path = require('path');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// On Vercel only /tmp is writable; fallback there to avoid boot-time crashes.
const LOCAL_UPLOADS_DIR = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', 'uploads');
try {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
} catch (err) {
  if (err?.code !== 'EEXIST') {
    console.warn(`Could not create uploads directory at ${LOCAL_UPLOADS_DIR}: ${err.message}`);
  }
}

const saveToLocalDisk = (file) => {
  const ext = (file.originalname || '').split('.').pop() || 'bin';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filepath = path.join(LOCAL_UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, file.buffer);
  return `/uploads/${filename}`;
};

const uploadAsset = async (file, options = {}) => {
  if (!file) return '';

  if (hasCloudinaryConfig) {
    const uploadedAsset = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'modichat',
          resource_type: options.resourceType || 'image'
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        }
      );

      uploadStream.end(file.buffer);
    });

    return uploadedAsset.secure_url;
  }

  // No Cloudinary — save to local disk for persistence across restarts
  return saveToLocalDisk(file);
};

const uploadImage = async (file, options = {}) =>
  uploadAsset(file, { ...options, resourceType: 'image' });

const uploadVideo = async (file, options = {}) =>
  uploadAsset(file, { ...options, resourceType: 'video' });

const uploadAudio = async (file, options = {}) =>
  uploadAsset(file, { ...options, resourceType: 'video' });

module.exports = {
  hasCloudinaryConfig,
  uploadAsset,
  uploadAudio,
  uploadImage,
  uploadVideo
};
