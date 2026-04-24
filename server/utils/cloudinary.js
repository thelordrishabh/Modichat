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

const uploadImage = async (file, options = {}) => {
  if (!file) return '';

  if (hasCloudinaryConfig) {
    const uploadedAsset = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'modichat',
          resource_type: 'image'
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

  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
};

module.exports = {
  hasCloudinaryConfig,
  uploadImage
};
