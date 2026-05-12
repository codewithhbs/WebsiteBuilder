const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const sharp = require("sharp");

/**
 * Compress Image Before Upload
 */
const compressImage = async (buffer) => {
  return await sharp(buffer)
    .resize({
      width: 1920,
      withoutEnlargement: true,
    })
    .webp({
      quality: 70,
    })
    .toBuffer();
};

/**
 * Upload Single File
 */
const uploadBuffer = async (
  buffer,
  folder = "service-platform",
  options = {}
) => {
  try {
    // COMPRESS IMAGE
    const compressedBuffer = await compressImage(buffer);

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          format: "webp",
          ...options,
        },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );

      streamifier
        .createReadStream(compressedBuffer)
        .pipe(stream);
    });

  } catch (err) {
    throw err;
  }
};

/**
 * Upload Multiple Files
 */
const uploadMultiple = async (
  files = [],
  folder = "service-platform"
) => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  return Promise.all(
    files.map(async (file) => {
      if (file?.buffer) {
        return await uploadBuffer(file.buffer, folder);
      }

      throw new Error("Invalid file: expected buffer");
    })
  );
};

/**
 * Delete Single File
 */
const deleteFile = async (publicId) => {
  if (!publicId) return null;

  try {
    return await cloudinary.uploader.destroy(publicId);

  } catch (err) {
    console.warn(
      "[cloudinary] destroy failed:",
      publicId,
      err.message
    );

    return null;
  }
};

/**
 * Delete Multiple Files
 */
const deleteMultiple = async (publicIds = []) => {
  if (!publicIds.length) return null;

  try {
    return await cloudinary.api.delete_resources(publicIds);

  } catch (err) {
    console.warn(
      "[cloudinary] bulk destroy failed:",
      err.message
    );

    return null;
  }
};

module.exports = {
  uploadBuffer,
  uploadMultiple,
  deleteFile,
  deleteMultiple,
};