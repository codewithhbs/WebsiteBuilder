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
    name: "Aurora — Swiss Minimal Corporate",
    description: "Precision Swiss design: left-aligned section headers with rule lines, flat hairline cards with sweep-in accent bars, underline nav, bordered editorial stats rows, and oversized outlined step numerals. Best for consultancies, agencies, B2B, and professional services.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m2",
    previewImage: { url: "/themes/theme-m2/preview.html", publicId: "" },
    name: "Crimson — Dynamic Diagonal",
    description: "High-energy diagonal design: skewed badges, angled section clips, thick left-border feature rails, chevron process steps, and uppercase Poppins headings. Best for repair, emergency, trades, logistics, and action-first service businesses.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m3",
    previewImage: { url: "/themes/theme-m3/preview.html", publicId: "" },
    name: "Onyx — Dark Luxury Serif",
    description: "Five-star dark luxury: near-black canvas, thin gold hairlines with ✦ ornaments, transparent bordered cards, centered italic-serif testimonials, oval team portraits, and letterspaced small-caps buttons. Best for luxury hotels, fine dining, jewellery, and premium boutiques.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m4",
    previewImage: { url: "/themes/theme-m4/preview.html", publicId: "" },
    name: "Nimbus — Playful Gradient SaaS",
    description: "Friendly startup energy: purple→teal mesh gradients, gradient-ink headings, a floating pill navbar, squishy tilt-on-hover cards, gradient-border featured pricing, and rounded gradient CTA slabs. Best for SaaS, apps, startups, and creative tech.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m5",
    previewImage: { url: "/themes/theme-m5/preview.html", publicId: "" },
    name: "Saffron — Warm Editorial Menu",
    description: "Restaurant-menu editorial: cream paper, big italic Cormorant headings, ruled list rows instead of cards, sepia-toned photos, double-rule stats, and a framed invitation CTA. Best for restaurants, cafés, hotels, catering, and hospitality.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m6",
    previewImage: { url: "/themes/theme-m6/preview.html", publicId: "" },
    name: "Verdant — Organic Soft Wellness",
    description: "Hand-drawn organic warmth: sage & cream, uneven blob radii, arch-top images and team portraits, leaf ✳ marks, pill buttons everywhere, and a rounded garden CTA banner. Best for spas, wellness, clinics, yoga, and eco brands.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m7",
    previewImage: { url: "/themes/theme-m7/preview.html", publicId: "" },
    name: "Slate — Institutional Formal",
    description: "Old-money formality: zero border-radius, double rules under headings, thick navy crown bar, small-caps serif labels, ledger-style stats tables, and docket-numbered steps. Best for law firms, CAs, financial advisors, consulting, and insurance.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m8",
    previewImage: { url: "/themes/theme-m8/preview.html", publicId: "" },
    name: "Midnight — Terminal Neon Tech",
    description: "Hacker-chic dark tech: engineering grid hero, monospace `>` prompt eyebrows, corner-bracket cards, neon cyan glow borders, HUD-style stats readouts, and [ 01 ] indexed steps. Best for dev tools, cybersecurity, crypto, IT, and gaming.",
    pageType: "multi",
    isActive: true,
  },
  {
    themeKey: "theme-m9",
    previewImage: { url: "/themes/theme-m9/preview.html", publicId: "" },
    name: "Blush — Romantic Boutique",
    description: "Delicate feminine editorial: ivory & dusty rose, arched images and portraits, italic Playfair accents, thin rose hairlines, dotted dividers, love-letter testimonials, and letterspaced pill buttons. Best for bridal, salons, makeup artists, boutiques, and fashion.",
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
