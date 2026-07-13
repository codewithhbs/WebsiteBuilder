const mongoose = require("mongoose");

/* ─────────────────────────────────────────────────────────────────
   Page model — used only when Website.pageType === "multi"
   Each page has a flexible `sections[]` array of blocks.
   Each block has a `type` and a freeform `data` payload that the
   theme renderer knows how to interpret.

   Supported section types (the renderer's contract):
     hero, about, features, services, cta, testimonials, faq,
     gallery, contact, team, pricing, stats, text, banner, blogList,
     videoEmbed, mapEmbed, logoCloud
   ───────────────────────────────────────────────────────────────── */

const ImageSchema = new mongoose.Schema(
  { url: String, publicId: String, alt: String },
  { _id: false }
);

const SeoSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    keywords: [String],
    canonicalUrl: String,
    robots: { type: String, default: "index, follow" },
    ogTitle: String,
    ogDescription: String,
    ogImage: ImageSchema,
    twitterCard: { type: String, default: "summary_large_image" },
    twitterTitle: String,
    twitterDescription: String,
    twitterImage: ImageSchema,
    schemaType: { type: String, default: "WebPage" },
  },
  { _id: false }
);

const SectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "hero",
        "about",
        "features",
        "services",
        "cta",
        "testimonials",
        "faq",
        "gallery",
        "contact",
        "team",
        "pricing",
        "stats",
        "text",
        "banner",
        "blogList",
        "videoEmbed",
        "mapEmbed",
        "logoCloud",
        "richText",
        "steps",
        "marquee",
        "areas",
        "callback",
      ],
    },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    // freeform — shape depends on `type`; documented in MULTIPAGE-README.md
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: true, timestamps: true }
);

const PageSchema = new mongoose.Schema(
  {
    website: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },

    // URL path slug for this page. "home" is reserved for the homepage.
    pageKey: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9][a-z0-9-]*$/,
    },

    title: { type: String, default: "" },

    isHomepage: { type: Boolean, default: false, index: true },

    // Navigation
    showInNav: { type: Boolean, default: true },
    navLabel: { type: String, default: "" }, // falls back to title
    navOrder: { type: Number, default: 0 },

    // Content blocks
    sections: { type: [SectionSchema], default: [] },

    // SEO per page
    seo: { type: SeoSchema, default: {} },

    isLive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// One pageKey per website
PageSchema.index({ website: 1, pageKey: 1 }, { unique: true });

// Helpful sorting
PageSchema.index({ website: 1, navOrder: 1 });

module.exports = mongoose.model("Page", PageSchema);
