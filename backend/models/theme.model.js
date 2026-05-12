const mongoose = require("mongoose");

const ThemeSchema = new mongoose.Schema(
  {
    themeKey: { type: String, required: true, unique: true, index: true }, // theme1 / theme2
    name: { type: String, required: true },
    previewImage: { url: String, publicId: String },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Theme", ThemeSchema);
