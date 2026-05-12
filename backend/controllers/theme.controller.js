const Theme = require("../models/theme.model");
const asyncHandler = require("../middlewares/asyncHandler");
const { uploadBuffer, deleteFile } = require("../utils/uploadToCloudinary");
const { writeAudit } = require("../utils/audit");

exports.listThemes = asyncHandler(async (req, res) => {
  const themes = await Theme.find({ isActive: true }).sort({ createdAt: 1 });
  res.json({ success: true, items: themes });
});

exports.getTheme = asyncHandler(async (req, res) => {
  const theme = await Theme.findById(req.params.id);
  if (!theme) return res.status(404).json({ success: false, message: "Theme not found" });
  res.json({ success: true, theme });
});

exports.createTheme = asyncHandler(async (req, res) => {
  const { themeKey, name, description } = req.body;
  if (!themeKey || !name) {
    return res.status(400).json({ success: false, message: "themeKey & name required" });
  }
  const exists = await Theme.findOne({ themeKey });
  if (exists) return res.status(409).json({ success: false, message: "themeKey already exists" });

  let previewImage = {};
  if (req.file) {
    const r = await uploadBuffer(req.file.buffer, "service-platform/themes");
    previewImage = { url: r.secure_url, publicId: r.public_id };
  }
  const theme = await Theme.create({ themeKey, name, description, previewImage });
  await writeAudit(req, { action: "theme.create", targetType: "Theme", targetId: theme._id });
  res.status(201).json({ success: true, theme });
});

exports.updateTheme = asyncHandler(async (req, res) => {
  const theme = await Theme.findById(req.params.id);
  if (!theme) return res.status(404).json({ success: false, message: "Theme not found" });

  ["name", "description", "isActive"].forEach((k) => {
    if (req.body[k] !== undefined) theme[k] = req.body[k];
  });

  if (req.file) {
    if (theme.previewImage?.publicId) await deleteFile(theme.previewImage.publicId);
    const r = await uploadBuffer(req.file.buffer, "service-platform/themes");
    theme.previewImage = { url: r.secure_url, publicId: r.public_id };
  }
  await theme.save();
  await writeAudit(req, { action: "theme.update", targetType: "Theme", targetId: theme._id });
  res.json({ success: true, theme });
});
