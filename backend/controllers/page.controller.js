const Page = require("../models/page.model");
const Website = require("../models/website.model");
const { uploadBuffer } = require("../utils/uploadToCloudinary");

/* ─────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────── */

function ok(res, data) {
  return res.json({ success: true, ...data });
}
function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

async function assertWebsite(id) {
  const site = await Website.findById(id);
  if (!site) throw Object.assign(new Error("Website not found"), { status: 404 });
  return site;
}

// POST /api/employee/uploads/image — used by multi-page section editors
// to attach images inside `section.data` (hero image, gallery items, team
// photos, service images, etc). Returns {url, publicId} on success.
exports.uploadSectionImage = async (req, res) => {
  try {
    if (!req.file) return fail(res, 400, "No image file");
    const folder = req.body.folder || "website-builder/sections";
    const uploaded = await uploadBuffer(req.file.buffer, folder);
    return ok(res, {
      image: {
        url: uploaded.secure_url || uploaded.url,
        publicId: uploaded.public_id,
      },
    });
  } catch (err) {
    return fail(res, 500, err.message || "Upload failed");
  }
};


/* ─────────────────────────────────────────────────────────────────
   PUBLIC — used by the theme renderer
   ───────────────────────────────────────────────────────────────── */

// GET /api/public/site/:slug/pages
// Returns a slim list of pages for nav building.
exports.publicListPages = async (req, res) => {
  try {
    const site = await Website.findOne({ slug: req.params.slug, isLive: true });
    if (!site) return fail(res, 404, "Site not found");
    if (site.pageType !== "multi")
      return fail(res, 400, "Site is single-page; no pages collection");

    const pages = await Page.find({ website: site._id, isLive: true })
      .select("pageKey title isHomepage showInNav navLabel navOrder")
      .sort({ navOrder: 1, createdAt: 1 })
      .lean();

    return ok(res, { pages });
  } catch (err) {
    return fail(res, err.status || 500, err.message);
  }
};

// GET /api/public/site/:slug/page/:pageKey
// Returns full page content (sections array).
exports.publicGetPage = async (req, res) => {
  try {
    const site = await Website.findOne({ slug: req.params.slug, isLive: true });
    if (!site) return fail(res, 404, "Site not found");
    if (site.pageType !== "multi")
      return fail(res, 400, "Site is single-page");

    const pageKey = (req.params.pageKey || "home").toLowerCase();

    let page = await Page.findOne({
      website: site._id,
      pageKey,
      isLive: true,
    }).lean();

    // fallback to homepage if not found
    if (!page) {
      page = await Page.findOne({
        website: site._id,
        isHomepage: true,
        isLive: true,
      }).lean();
    }

    if (!page) return fail(res, 404, "Page not found");

    // strip inactive sections, sort by displayOrder
    page.sections = (page.sections || [])
      .filter((s) => s.isActive !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    return ok(res, { page });
  } catch (err) {
    return fail(res, err.status || 500, err.message);
  }
};


/* ─────────────────────────────────────────────────────────────────
   ADMIN / EMPLOYEE — full CRUD
   ───────────────────────────────────────────────────────────────── */

// GET /api/admin/websites/:websiteId/pages
exports.listPages = async (req, res) => {
  try {
    await assertWebsite(req.params.websiteId);
    const pages = await Page.find({ website: req.params.websiteId })
      .sort({ navOrder: 1, createdAt: 1 });
    return ok(res, { pages });
  } catch (err) {
    return fail(res, err.status || 500, err.message);
  }
};

// GET /api/admin/pages/:id
exports.getPage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return fail(res, 404, "Page not found");
    return ok(res, { page });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// POST /api/admin/websites/:websiteId/pages
exports.createPage = async (req, res) => {
  try {
    const site = await assertWebsite(req.params.websiteId);
    if (site.pageType !== "multi")
      return fail(res, 400, "Cannot create pages for a single-page website");

    const body = req.body || {};
    const pageKey = (body.pageKey || "").toLowerCase().trim();
    if (!pageKey) return fail(res, 400, "pageKey is required");

    // If marking as homepage, unset existing one
    if (body.isHomepage) {
      await Page.updateMany(
        { website: site._id, isHomepage: true },
        { $set: { isHomepage: false } }
      );
    }

    const page = await Page.create({
      website: site._id,
      pageKey,
      title: body.title || "",
      isHomepage: !!body.isHomepage,
      showInNav: body.showInNav !== false,
      navLabel: body.navLabel || body.title || "",
      navOrder: body.navOrder || 0,
      sections: Array.isArray(body.sections) ? body.sections : [],
      seo: body.seo || {},
      isLive: body.isLive !== false,
    });

    return ok(res, { page });
  } catch (err) {
    if (err.code === 11000)
      return fail(res, 409, "A page with that pageKey already exists");
    return fail(res, err.status || 500, err.message);
  }
};

// PATCH /api/admin/pages/:id
exports.updatePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return fail(res, 404, "Page not found");

    const body = req.body || {};
    const fields = [
      "title",
      "navLabel",
      "navOrder",
      "showInNav",
      "isLive",
      "seo",
    ];
    fields.forEach((f) => {
      if (body[f] !== undefined) page[f] = body[f];
    });

    if (body.pageKey) page.pageKey = body.pageKey.toLowerCase().trim();

    if (body.isHomepage === true && !page.isHomepage) {
      await Page.updateMany(
        { website: page.website, isHomepage: true },
        { $set: { isHomepage: false } }
      );
      page.isHomepage = true;
    } else if (body.isHomepage === false) {
      page.isHomepage = false;
    }

    if (Array.isArray(body.sections)) page.sections = body.sections;

    await page.save();
    return ok(res, { page });
  } catch (err) {
    if (err.code === 11000)
      return fail(res, 409, "A page with that pageKey already exists");
    return fail(res, 500, err.message);
  }
};

// DELETE /api/admin/pages/:id
exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return fail(res, 404, "Page not found");
    if (page.isHomepage)
      return fail(res, 400, "Cannot delete the homepage. Mark another page as homepage first.");
    await page.deleteOne();
    return ok(res, { deleted: true });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// PATCH /api/admin/pages/:id/sections — replace entire sections array
exports.replaceSections = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return fail(res, 404, "Page not found");
    page.sections = Array.isArray(req.body.sections) ? req.body.sections : [];
    await page.save();
    return ok(res, { page });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// POST /api/admin/pages/:id/sections — add a new section
exports.addSection = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return fail(res, 404, "Page not found");
    const body = req.body || {};
    if (!body.type) return fail(res, 400, "section.type is required");
    const maxOrder = page.sections.reduce(
      (m, s) => Math.max(m, s.displayOrder || 0),
      -1
    );
    page.sections.push({
      type: body.type,
      isActive: body.isActive !== false,
      displayOrder: body.displayOrder !== undefined ? body.displayOrder : maxOrder + 1,
      data: body.data || {},
    });
    await page.save();
    return ok(res, { page, section: page.sections[page.sections.length - 1] });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// PATCH /api/admin/pages/:id/sections/:sectionId — patch one section
exports.updateSection = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return fail(res, 404, "Page not found");
    const section = page.sections.id(req.params.sectionId);
    if (!section) return fail(res, 404, "Section not found");
    const body = req.body || {};
    ["type", "isActive", "displayOrder", "data"].forEach((f) => {
      if (body[f] !== undefined) section[f] = body[f];
    });
    await page.save();
    return ok(res, { page, section });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};

// DELETE /api/admin/pages/:id/sections/:sectionId
exports.deleteSection = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return fail(res, 404, "Page not found");
    const section = page.sections.id(req.params.sectionId);
    if (!section) return fail(res, 404, "Section not found");
    section.deleteOne();
    await page.save();
    return ok(res, { page });
  } catch (err) {
    return fail(res, 500, err.message);
  }
};


/* ─────────────────────────────────────────────────────────────────
   SEED DEFAULT PAGES — called from website.controller.js when
   pageType === "multi" so a new website starts with empty
   Home/About/Services/Contact pages ready to be filled.
   ───────────────────────────────────────────────────────────────── */
exports.seedDefaultPages = async function (websiteId, opts = {}) {
  const exists = await Page.findOne({ website: websiteId });
  if (exists) return; // already seeded

  const siteName = opts.siteName || "Your Business";

  const defaults = [
    {
      pageKey: "home",
      title: "Home",
      navLabel: "Home",
      navOrder: 0,
      isHomepage: true,
      sections: [
        { type: "hero", displayOrder: 0, data: {
          variant: "split",
          badge: "Available now — free consultation",
          title: `Welcome to *${siteName}*`,
          subtitle: "We deliver quality services with reliability, transparency, and genuine care for every customer.",
          chips: [
            { icon: "check", label: "Certified team" },
            { icon: "clock", label: "Fast response" },
            { icon: "shield", label: "Trusted quality" },
          ],
          ctaText: "Get Started",
          ctaLink: "/contact",
          secondaryCtaText: "Learn More",
          secondaryCtaLink: "/about",
          trustText: "Rated 4.9/5 by 500+ happy clients",
          floatingStat: { icon: "award", number: "10+ Years", label: "Industry experience" },
          floatingRating: "4.9/5 Rating",
          visualIcon: "rocket",
        }},
        { type: "marquee", displayOrder: 1, data: {
          background: "dark",
          items: ["Trusted Service", "Certified Professionals", "Transparent Pricing", "Free Consultation"],
        }},
        { type: "features", displayOrder: 2, data: {
          eyebrow: "Why Choose Us",
          heading: "Built on trust and expertise",
          subheading: "What sets us apart from the rest.",
          columns: 3,
          items: [
            { icon: "shield", title: "Trusted Quality", description: "Years of trusted service across our customer base." },
            { icon: "clock", title: "Fast Response", description: "Quick turnaround and clear communication." },
            { icon: "heart", title: "Customer First", description: "Your satisfaction is our top priority." },
          ],
        }},
        { type: "stats", displayOrder: 3, data: {
          items: [
            { number: "500+", label: "Happy Clients" },
            { number: "10+", label: "Years Experience" },
            { number: "24/7", label: "Support" },
            { number: "99%", label: "Satisfaction" },
          ],
        }},
        { type: "steps", displayOrder: 4, data: {
          eyebrow: "How It Works",
          heading: "Simple, transparent process",
          items: [
            { icon: "phone", title: "Reach Out", description: "Call us or fill the quick form — we respond fast." },
            { icon: "users", title: "Consultation", description: "We understand your needs and share a clear plan." },
            { icon: "rocket", title: "We Deliver", description: "Expert execution with updates at every step." },
            { icon: "heart", title: "Ongoing Support", description: "We stay available long after the job is done." },
          ],
        }},
        { type: "cta", displayOrder: 5, data: {
          eyebrow: "Get in touch",
          heading: "Ready to get started?",
          subheading: "Talk to our team today — free consultation, no obligations.",
          ctaText: "Contact Us",
          ctaLink: "/contact",
        }},
      ],
    },
    {
      pageKey: "about",
      title: "About Us",
      navLabel: "About",
      navOrder: 1,
      sections: [
        { type: "hero", displayOrder: 0, data: {
          variant: "minimal",
          title: "About Us",
          subtitle: "Our story, our mission, our team.",
        }},
        { type: "about", displayOrder: 1, data: {
          heading: "Who We Are",
          body: `${siteName} is a trusted name in our industry. We help our customers succeed through quality services and reliable delivery.`,
          variant: "image-right",
          highlights: ["Customer-first approach", "Industry expertise", "Reliable delivery"],
        }},
        { type: "team", displayOrder: 2, data: {
          heading: "Meet Our Team",
          items: [],
        }},
      ],
    },
    {
      pageKey: "services",
      title: "Services",
      navLabel: "Services",
      navOrder: 2,
      sections: [
        { type: "hero", displayOrder: 0, data: {
          variant: "minimal",
          title: "Our Services",
          subtitle: "Comprehensive solutions tailored to your needs.",
        }},
        { type: "services", displayOrder: 1, data: {
          heading: "What We Offer",
          items: [],
        }},
        { type: "cta", displayOrder: 2, data: {
          heading: "Ready to start your project?",
          ctaText: "Get a Quote",
          ctaLink: "/contact",
        }},
      ],
    },
    {
      pageKey: "contact",
      title: "Contact Us",
      navLabel: "Contact",
      navOrder: 3,
      sections: [
        { type: "hero", displayOrder: 0, data: {
          variant: "minimal",
          title: "Get In Touch",
          subtitle: "We'd love to hear from you.",
        }},
        { type: "contact", displayOrder: 1, data: {
          heading: "Reach Out",
          showForm: true,
        }},
      ],
    },
  ];

  for (const p of defaults) {
    await Page.create({ website: websiteId, ...p });
  }
};
