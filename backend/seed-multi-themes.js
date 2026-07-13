/* ──────────────────────────────────────────────────────────────────
   seed-multi-themes.js — Seeds all 5 multi-page themes into DB
   ──────────────────────────────────────────────────────────────────
   Run: node seed-multi-themes.js
   Idempotent — safe to run multiple times. Skips any theme that
   already exists with the same themeKey.
   ────────────────────────────────────────────────────────────────── */

require("dotenv").config();
const mongoose = require("mongoose");
const Theme = require("./models/theme.model");
const ENV = require("./config/env");

const MULTI_THEMES = [
  {
    themeKey: "theme-m1",
    previewImage: { url: "/themes/theme-m1/preview.html", publicId: "" },
    name: "Aurora — Modern Corporate",
    description: "Clean, professional, blue-accented corporate look. Great for consultancies, B2B, agencies, and service companies that want a modern, trustworthy feel.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m2",
    previewImage: { url: "/themes/theme-m2/preview.html", publicId: "" },
    name: "Crimson — Service Business",
    description: "Bold red, urgency-focused service business theme. Strong action-oriented design for emergency services, home services, repair businesses, and conversion-focused landing flows.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m3",
    previewImage: { url: "/themes/theme-m3/preview.html", publicId: "" },
    name: "Onyx — Creative Agency",
    description: "Dark, luxurious, gold-accented agency theme with editorial serif headings. Perfect for design studios, premium brands, photographers, and high-end portfolios.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m4",
    previewImage: { url: "/themes/theme-m4/preview.html", publicId: "" },
    name: "Nimbus — SaaS / Tech",
    description: "Modern startup gradient theme with purple/teal accents. Built for SaaS products, tech startups, and software companies that want a contemporary, conversion-friendly layout.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m5",
    previewImage: { url: "/themes/theme-m5/preview.html", publicId: "" },
    name: "Saffron — Hospitality",
    description: "Warm saffron and cream palette with editorial serif headings. Ideal for restaurants, hotels, cafes, wellness centers, salons, and lifestyle brands.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m6",
    previewImage: { url: "/themes/theme-m6/preview.html", publicId: "" },
    name: "Verdant — Wellness & Eco",
    description: "Calm sage green palette with organic shapes, gentle serif headings and rounded surfaces. Perfect for yoga studios, spas, wellness centers, sustainability brands, and organic products.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m7",
    previewImage: { url: "/themes/theme-m7/preview.html", publicId: "" },
    name: "Slate — Legal & Consulting",
    description: "Deep navy with Libre Baskerville serif for institutional gravitas. Sharp typography and structured layout. Best for law firms, financial advisors, consultants, accounting, and insurance.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m8",
    previewImage: { url: "/themes/theme-m8/preview.html", publicId: "" },
    name: "Midnight — Dark Tech",
    description: "Deep navy glassmorphism with electric cyan glow. Frosted-glass cards and neon accents. Best for fintech, IT services, security firms, crypto, gaming, and modern B2B tech.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m9",
    previewImage: { url: "/themes/theme-m9/preview.html", publicId: "" },
    name: "Blush — Beauty & Lifestyle",
    description: "Soft rose and ivory with elegant Playfair serif. Editorial magazine feel with delicate details. Perfect for salons, spas, makeup artists, boutiques, wedding services, and fashion.",
    pageType: "multi",
    isActive: true,
  },
];

// Single-page themes to register / patch
const SINGLE_THEMES = [
  {
    themeKey: "theme4",
    previewImage: { url: "/themes/theme4/preview.html", publicId: "" },
    name: "Obsidian — Dark Premium Glass",
    description: "Pitch-dark premium theme with a floating glass pill navbar, ambient glow orbs, gradient hero headline, bento-style services grid with big index numbers, giant outlined stat numbers, a vertical timeline for how-it-works, and a scrolling areas marquee. Space Grotesk typography. Great for tech services, IT, security, agencies, and modern premium brands.",
    pageType: "single",
    isActive: true,
  },
  {
    themeKey: "theme5",
    previewImage: { url: "/themes/theme5/preview.html", publicId: "" },
    name: "Verde — Organic Wellness Editorial",
    description: "Warm cream & sage editorial theme with Fraunces serif headings, floating blob shapes, zigzag alternating service rows, a numbered editorial why-us list, dotted-step process, rounded areas panel, and a swipeable testimonial carousel. Perfect for wellness, spas, clinics, salons, eco brands, and lifestyle businesses.",
    pageType: "single",
    isActive: true,
  },
  {
    themeKey: "theme6",
    previewImage: { url: "/themes/theme6/preview.html", publicId: "" },
    name: "Bolt — Neo-Brutalist Bold",
    description: "Loud neo-brutalist theme with thick black borders, hard offset shadows, uppercase Archivo headings, a scrolling marquee strip, rotated sticker badges, ticket-style service cards, checkerboard why-us tiles, and speech-bubble testimonials. Great for startups, gyms, food brands, creators, and any business that wants to stand out.",
    pageType: "single",
    isActive: true,
  },
];

async function seed() {
  await mongoose.connect(ENV.MONGODB_URL);
  console.log("✓ Connected to MongoDB");

  for (const t of [...MULTI_THEMES, ...SINGLE_THEMES]) {
    const existing = await Theme.findOne({ themeKey: t.themeKey });
    if (existing) {
      // Patch pageType + description in case schema changed
      let dirty = false;
      if (existing.pageType !== t.pageType) { existing.pageType = t.pageType; dirty = true; }
      if (existing.name !== t.name) { existing.name = t.name; dirty = true; }
      if (existing.description !== t.description) { existing.description = t.description; dirty = true; }
      const currentPreview = existing.previewImage?.url || "";
      const wantedPreview = t.previewImage?.url || "";
      if (wantedPreview && currentPreview !== wantedPreview) {
        existing.previewImage = t.previewImage;
        dirty = true;
      }
      if (dirty) {
        await existing.save();
        console.log(`  ↻ updated  ${t.themeKey}  (${t.name})`);
      } else {
        console.log(`  • skipped  ${t.themeKey}  (already exists)`);
      }
      continue;
    }
    await Theme.create(t);
    console.log(`  ✓ created  ${t.themeKey}  (${t.name})`);
  }

  // Also ensure existing single-page themes have pageType + preview set
  const singleThemes = ["theme1", "theme2", "theme3"];
  for (const tk of singleThemes) {
    const existing = await Theme.findOne({ themeKey: tk });
    if (existing) {
      let dirty = false;
      if (!existing.pageType) { existing.pageType = "single"; dirty = true; }
      const wantedPreview = `/themes/${tk}/preview.html`;
      if ((existing.previewImage?.url || "") !== wantedPreview) {
        existing.previewImage = { url: wantedPreview, publicId: "" };
        dirty = true;
      }
      if (dirty) {
        await existing.save();
        console.log(`  ↻ patched ${tk} → pageType=single + preview`);
      }
    }
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
