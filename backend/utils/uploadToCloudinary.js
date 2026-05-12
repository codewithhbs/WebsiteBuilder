const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const uploadBuffer = (buffer, folder = "service-platform", options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, ...options },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

const uploadMultiple = async (files = [], folder = "service-platform") => {
  if (!Array.isArray(files) || files.length === 0) return [];
  return Promise.all(
    files.map((f) => {
      if (f && f.buffer) return uploadBuffer(f.buffer, folder);
      throw new Error("Invalid file: expected buffer");
    })
  );
};

const deleteFile = async (publicId) => {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("[cloudinary] destroy failed:", publicId, err.message);
    return null;
  }
};

const deleteMultiple = async (publicIds = []) => {
  if (!publicIds.length) return null;
  try {
    return await cloudinary.api.delete_resources(publicIds);
  } catch (err) {
    console.warn("[cloudinary] bulk destroy failed:", err.message);
    return null;
  }
};

module.exports = { uploadBuffer, uploadMultiple, deleteFile, deleteMultiple };
