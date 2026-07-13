const mongoose = require("mongoose");

/* ---------- sub-schemas ---------- */

const ImageSchema = new mongoose.Schema(
  { url: String, publicId: String },
  { _id: false }
);

const HeroSlideSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    ctaText: { type: String, default: "" },
    ctaLink: { type: String, default: "" },
    image: ImageSchema,
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Website-level hero appearance controls (single-page themes).
// Applies to the whole hero regardless of how many slides exist.
const HeroSettingsSchema = new mongoose.Schema(
  {
    // layout: how the hero is arranged
    //   "form"     = default callback-form layout (text left, form right)
    //   "centered" = text centered, no form
    //   "split"    = text left, image right (no form)
    //   "imageBg"  = full background image + overlay + centered text
    //   "slider"   = rotating background images + overlay + centered text
    //   "gradient" = theme gradient background, centered text
    layout: { type: String, default: "form" },

    // overlay (used when an image/slider sits behind the text)
    overlayColor: { type: String, default: "primary" }, // "primary" | "dark" | hex
    overlayStyle: { type: String, default: "gradient" }, // "gradient" | "solid" | "none"
    overlayOpacity: { type: Number, default: 60, min: 0, max: 100 },

    // slider behaviour
    slideInterval: { type: Number, default: 5000 },

    // show the callback form on top of image/slider layouts too
    showForm: { type: Boolean, default: true },
  },
  { _id: false }
);

const AboutSchema = new mongoose.Schema(
  {
    heading: { type: String, default: "About Us" },
    shortText: { type: String, default: "" },
    longText: { type: String, default: "" },
    image: ImageSchema,
    highlights: [{ type: String }], // bullet points
  },
  { _id: false }
);

const ServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" }, // bootstrap-icon class or url
    image: ImageSchema,
    price: { type: String, default: "" }, // free-form text, e.g. "Starting ₹999"
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ReviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    designation: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    text: { type: String, default: "" },
    avatar: ImageSchema,
    isApproved: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    ctaText: { type: String, default: "" },
    ctaLink: { type: String, default: "" },
    image: ImageSchema,
    position: {
      type: String,
      enum: ["top", "middle", "bottom", "popup"],
      default: "middle",
    },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ContactInfoSchema = new mongoose.Schema(
  {
    heading: { type: String, default: "Get in touch" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    mapEmbedUrl: { type: String, default: "" },
    workingHours: { type: String, default: "" },
  },
  { _id: false }
);

const SocialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    youtube: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    website: { type: String, default: "" },
  },
  { _id: false }
);

const FooterSchema = new mongoose.Schema(
  {
    tagline: { type: String, default: "" },
    copyrightText: { type: String, default: "" },
    columns: [
      {
        title: String,
        links: [{ label: String, url: String }],
      },
    ],
    socialLinks: { type: SocialLinksSchema, default: {} },
  },
  { _id: false }
);

const SectionsToggleSchema = new mongoose.Schema(
  {
    hero: { type: Boolean, default: true },
    about: { type: Boolean, default: true },
    services: { type: Boolean, default: true },
    reviews: { type: Boolean, default: true },
    banners: { type: Boolean, default: true },
    contact: { type: Boolean, default: true },
    footer: { type: Boolean, default: true },
  },
  { _id: false }
);

const BasicInfoSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "" },
    tagline: { type: String, default: "" },
    logo: ImageSchema,
    favicon: ImageSchema,
    primaryColor: { type: String, default: "#0d6efd" },
    secondaryColor: { type: String, default: "#6c757d" },
  },
  { _id: false }
);

const SeoSchema = new mongoose.Schema(
  {
    // BASIC SEO
    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: 70,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 160,
    },

    keywords: [
      {
        type: String,
        trim: true,
      },
    ],

    // CANONICAL URL
    canonicalUrl: {
      type: String,
      trim: true,
      default: "",
    },

    // SEARCH ENGINE CONTROL
    robots: {
      type: String,
      default: "index, follow",
    },

    // AUTHOR
    author: {
      type: String,
      trim: true,
      default: "",
    },

    // LANGUAGE
    language: {
      type: String,
      default: "en",
    },

    // OPEN GRAPH
    ogTitle: {
      type: String,
      trim: true,
      default: "",
    },

    ogDescription: {
      type: String,
      trim: true,
      default: "",
    },

    ogType: {
      type: String,
      default: "website",
    },

    ogUrl: {
      type: String,
      default: "",
    },

    ogImage: ImageSchema,

    // TWITTER SEO
    twitterCard: {
      type: String,
      default: "summary_large_image",
    },

    twitterTitle: {
      type: String,
      default: "",
    },

    twitterDescription: {
      type: String,
      default: "",
    },

    twitterImage: ImageSchema,

    // EXTRA INDEXING SIGNALS
    revisitAfter: {
      type: String,
      default: "7 days",
    },

    rating: {
      type: String,
      default: "general",
    },

    distribution: {
      type: String,
      default: "global",
    },

    // STRUCTURED DATA TYPE
    schemaType: {
      type: String,
      default: "WebPage",
    },
  },
  {
    _id: false,
  }
);

/* ---------- main schema ---------- */

const WebsiteSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    ownerEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    theme: { type: mongoose.Schema.Types.ObjectId, ref: "Theme", required: true },
    themeKey: { type: String, required: true }, // denormalized for fast public fetch

    // "single" = legacy single-page layout driven by hero/about/services/etc.
    // "multi"  = uses Page collection for multi-page layout with flexible section blocks
    pageType: {
      type: String,
      enum: ["single", "multi"],
      default: "single",
      index: true,
    },

    isLive: { type: Boolean, default: false, index: true },

    basicInfo: { type: BasicInfoSchema, default: {} },
    heroSlides: { type: [HeroSlideSchema], default: [] },
    heroSettings: { type: HeroSettingsSchema, default: {} },
    about: { type: AboutSchema, default: {} },
    services: { type: [ServiceSchema], default: [] },
    reviews: { type: [ReviewSchema], default: [] },
    banners: { type: [BannerSchema], default: [] },
    contact: { type: ContactInfoSchema, default: {} },
    footer: { type: FooterSchema, default: {} },
    sections: { type: SectionsToggleSchema, default: {} },
    seo: { type: SeoSchema, default: {} },

    publishedAt: { type: Date, default: null },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

WebsiteSchema.virtual("liveUrl").get(function () {
  const root = process.env.ROOT_DOMAIN || "yoursite.com";
  return `https://${this.slug}.${root}`;
});

WebsiteSchema.set("toJSON", { virtuals: true });
WebsiteSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Website", WebsiteSchema);
