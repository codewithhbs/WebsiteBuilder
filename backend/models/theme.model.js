const mongoose = require("mongoose");

const ThemeSchema = new mongoose.Schema(
  {
    themeKey: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    previewImage: { url: String, publicId: String },
    description: { type: String, default: "" },

    // Which website layout this theme is built for.
    // "single" = legacy single-page (theme1, theme2, theme3)
    // "multi"  = multi-page using Page collection (theme-m1 .. theme-m5)
    pageType: {
      type: String,
      enum: ["single", "multi"],
      default: "single",
      index: true,
    },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Theme", ThemeSchema);
