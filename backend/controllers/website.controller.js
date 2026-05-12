const Website = require("../models/website.model");
const Client = require("../models/client.model");
const Theme = require("../models/theme.model");
const ContactSubmission = require("../models/contactSubmission.model");
const asyncHandler = require("../middlewares/asyncHandler");
const { writeAudit } = require("../utils/audit");
const { uploadBuffer, deleteFile, deleteMultiple } = require("../utils/uploadToCloudinary");
const ENV = require("../config/env");

/* ---------- helpers ---------- */

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

const sanitizeSlug = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

// Admin sees all; employee sees only own websites
const scopeFilter = (req, extra = {}) =>
  req.user.role === "admin"
    ? extra
    : { ...extra, ownerEmployee: req.user._id };

const findOwned = async (req, id) => Website.findOne({ _id: id, ...scopeFilter(req) });

/* ---------- public render ---------- */

// Public: fetch by slug (used by theme HTML on subdomain)
exports.publicGetBySlug = asyncHandler(async (req, res) => {
  console.log(req.params.slug)
  const slug = sanitizeSlug(req.params.slug);
  const site = await Website.findOne({ slug, isLive: true }).lean();
  if (!site) return res.status(404).json({ success: false, message: "Site not found or not live" });

  // strip internal fields for public consumption
  delete site.ownerEmployee;
  delete site.lastEditedBy;
  delete site.client;
  // filter to only active/approved items
  site.heroSlides = (site.heroSlides || []).filter((s) => s.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  site.services = (site.services || []).filter((s) => s.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  site.reviews = (site.reviews || []).filter((r) => r.isApproved).sort((a, b) => a.displayOrder - b.displayOrder);
  site.banners = (site.banners || []).filter((b) => b.isActive).sort((a, b) => a.displayOrder - b.displayOrder);

  res.json({ success: true, site });
});

// Public: contact form submission from client site
exports.publicSubmitContact = asyncHandler(async (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  const { name, email, phone, message } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "name required" });

  const site = await Website.findOne({ slug, isLive: true }).select("_id");
  if (!site) return res.status(404).json({ success: false, message: "Site not found" });

  const submission = await ContactSubmission.create({
    website: site._id,
    name,
    email: email || "",
    phone: phone || "",
    message: message || "",
  });
  res.status(201).json({ success: true, id: submission._id });
});

/* ---------- listing & details (admin/employee) ---------- */

exports.listWebsites = asyncHandler(async (req, res) => {
  const { q = "", isLive, page = 1, limit = 20, employeeId } = req.query;
  const filter = scopeFilter(req);
  if (isLive !== undefined) filter.isLive = isLive === "true";
  if (req.user.role === "admin" && employeeId) filter.ownerEmployee = employeeId;
  if (q) filter.slug = new RegExp(q, "i");

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Website.find(filter)
      .populate("client", "name businessName")
      .populate("ownerEmployee", "name email")
      .select("slug isLive themeKey publishedAt createdAt updatedAt client ownerEmployee")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Website.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page: Number(page), limit: Number(limit) });
});

exports.getWebsite = asyncHandler(async (req, res) => {
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });
  await site.populate("client ownerEmployee theme");
  res.json({ success: true, site });
});

/* ---------- create ---------- */

exports.createWebsite = asyncHandler(async (req, res) => {
  const { clientId, themeId, slug, siteName } = req.body;
  if (!clientId || !themeId || !slug) {
    return res.status(400).json({ success: false, message: "clientId, themeId, slug required" });
  }
  const clean = sanitizeSlug(slug);
  if (!SLUG_RE.test(clean)) {
    return res.status(400).json({ success: false, message: "Invalid slug" });
  }

  // employees can only attach their own clients
  const clientFilter = req.user.role === "admin"
    ? { _id: clientId }
    : { _id: clientId, createdByEmployee: req.user._id };
  const client = await Client.findOne(clientFilter);
  if (!client) return res.status(404).json({ success: false, message: "Client not found" });

  const theme = await Theme.findById(themeId);
  if (!theme || !theme.isActive) {
    return res.status(404).json({ success: false, message: "Theme not found" });
  }

  const slugTaken = await Website.findOne({ slug: clean });
  if (slugTaken) return res.status(409).json({ success: false, message: "Slug already taken" });

  const site = await Website.create({
    slug: clean,
    client: client._id,
    ownerEmployee: req.user.role === "admin" ? (req.body.ownerEmployee || req.user._id) : req.user._id,
    theme: theme._id,
    themeKey: theme.themeKey,
    isLive: false,
    basicInfo: { siteName: siteName || client.businessName || client.name },
    lastEditedBy: req.user._id,
  });

  await writeAudit(req, {
    action: "website.create",
    targetType: "Website",
    targetId: site._id,
    meta: { slug: site.slug, clientId: client._id },
  });

  res.status(201).json({
    success: true,
    site,
    liveUrl: `https://${site.slug}.${ENV.ROOT_DOMAIN}`,
  });
});

/* ---------- partial section updates ----------
   Endpoints below operate on the website doc owned by the caller.
   Each accepts JSON for text + multipart for image fields where relevant.
------------------------------------------- */

// generic helper: patch top-level subdoc/section (basicInfo, about, contact, footer, sections, seo)
exports.updateSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const allowed = ["basicInfo", "about", "contact", "footer", "sections", "seo"];
  if (!allowed.includes(section)) {
    return res.status(400).json({ success: false, message: "Invalid section" });
  }
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });

  const body = req.body.payload ? JSON.parse(req.body.payload) : req.body;

  // merge top-level fields
  site[section] = { ...(site[section]?.toObject?.() || site[section] || {}), ...body };

  // handle uploaded image fields (logo, favicon, ogImage, about.image)
  if (req.files) {
    for (const f of req.files) {
      const r = await uploadBuffer(f.buffer, `service-platform/${site.slug}/${section}`);
      site[section][f.fieldname] = { url: r.secure_url, publicId: r.public_id };
    }
  }
  site.lastEditedBy = req.user._id;
  await site.save();
  await writeAudit(req, {
    action: `website.update.${section}`,
    targetType: "Website",
    targetId: site._id,
  });
  res.json({ success: true, site });
});

/* ---------- hero slides ---------- */

exports.addHeroSlide = asyncHandler(async (req, res) => {
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });

  const { title, subtitle, ctaText, ctaLink, displayOrder, isActive } = req.body;
  let image = {};
  if (req.file) {
    const r = await uploadBuffer(req.file.buffer, `service-platform/${site.slug}/hero`);
    image = { url: r.secure_url, publicId: r.public_id };
  }
  site.heroSlides.push({
    title, subtitle, ctaText, ctaLink, image,
    displayOrder: Number(displayOrder) || site.heroSlides.length,
    isActive: isActive !== "false",
  });
  site.lastEditedBy = req.user._id;
  await site.save();
  await writeAudit(req, { action: "website.hero.add", targetType: "Website", targetId: site._id });
  res.status(201).json({ success: true, site });
});

exports.updateHeroSlide = asyncHandler(async (req, res) => {
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });
  const slide = site.heroSlides.id(req.params.slideId);
  if (!slide) return res.status(404).json({ success: false, message: "Slide not found" });

  ["title", "subtitle", "ctaText", "ctaLink"].forEach((k) => {
    if (req.body[k] !== undefined) slide[k] = req.body[k];
  });
  if (req.body.displayOrder !== undefined) slide.displayOrder = Number(req.body.displayOrder);
  if (req.body.isActive !== undefined) slide.isActive = req.body.isActive === true || req.body.isActive === "true";

  if (req.file) {
    if (slide.image?.publicId) await deleteFile(slide.image.publicId);
    const r = await uploadBuffer(req.file.buffer, `service-platform/${site.slug}/hero`);
    slide.image = { url: r.secure_url, publicId: r.public_id };
  }
  site.lastEditedBy = req.user._id;
  await site.save();
  await writeAudit(req, { action: "website.hero.update", targetType: "Website", targetId: site._id });
  res.json({ success: true, site });
});

exports.deleteHeroSlide = asyncHandler(async (req, res) => {
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });
  const slide = site.heroSlides.id(req.params.slideId);
  if (!slide) return res.status(404).json({ success: false, message: "Slide not found" });
  if (slide.image?.publicId) await deleteFile(slide.image.publicId);
  slide.deleteOne();
  site.lastEditedBy = req.user._id;
  await site.save();
  await writeAudit(req, { action: "website.hero.delete", targetType: "Website", targetId: site._id });
  res.json({ success: true, site });
});

/* ---------- generic array section CRUD (services, reviews, banners) ---------- */

const ARRAY_SECTIONS = {
  services: { allowed: ["title", "description", "icon", "price", "displayOrder", "isActive"], imageField: "image" },
  reviews:  { allowed: ["name", "designation", "rating", "text", "isApproved", "displayOrder"], imageField: "avatar" },
  banners:  { allowed: ["title", "subtitle", "ctaText", "ctaLink", "position", "displayOrder", "isActive"], imageField: "image" },
};

const coerceBool = (v) => (v === true || v === "true");
const coerceNum = (v) => (v === undefined ? undefined : Number(v));

exports.addArrayItem = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const cfg = ARRAY_SECTIONS[section];
  if (!cfg) return res.status(400).json({ success: false, message: "Invalid section" });
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });

  const item = {};
  cfg.allowed.forEach((k) => {
    if (req.body[k] === undefined) return;
    if (k === "displayOrder" || k === "rating") item[k] = coerceNum(req.body[k]);
    else if (k === "isActive" || k === "isApproved") item[k] = coerceBool(req.body[k]);
    else item[k] = req.body[k];
  });
  if (req.file) {
    const r = await uploadBuffer(req.file.buffer, `service-platform/${site.slug}/${section}`);
    item[cfg.imageField] = { url: r.secure_url, publicId: r.public_id };
  }
  if (item.displayOrder === undefined) item.displayOrder = site[section].length;
  site[section].push(item);
  site.lastEditedBy = req.user._id;
  await site.save();
  await writeAudit(req, { action: `website.${section}.add`, targetType: "Website", targetId: site._id });
  res.status(201).json({ success: true, site });
});

exports.updateArrayItem = asyncHandler(async (req, res) => {
  const { section, itemId } = req.params;
  const cfg = ARRAY_SECTIONS[section];
  if (!cfg) return res.status(400).json({ success: false, message: "Invalid section" });
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });
  const item = site[section].id(itemId);
  if (!item) return res.status(404).json({ success: false, message: "Item not found" });

  cfg.allowed.forEach((k) => {
    if (req.body[k] === undefined) return;
    if (k === "displayOrder" || k === "rating") item[k] = coerceNum(req.body[k]);
    else if (k === "isActive" || k === "isApproved") item[k] = coerceBool(req.body[k]);
    else item[k] = req.body[k];
  });
  if (req.file) {
    if (item[cfg.imageField]?.publicId) await deleteFile(item[cfg.imageField].publicId);
    const r = await uploadBuffer(req.file.buffer, `service-platform/${site.slug}/${section}`);
    item[cfg.imageField] = { url: r.secure_url, publicId: r.public_id };
  }
  site.lastEditedBy = req.user._id;
  await site.save();
  await writeAudit(req, { action: `website.${section}.update`, targetType: "Website", targetId: site._id });
  res.json({ success: true, site });
});

exports.deleteArrayItem = asyncHandler(async (req, res) => {
  const { section, itemId } = req.params;
  const cfg = ARRAY_SECTIONS[section];
  if (!cfg) return res.status(400).json({ success: false, message: "Invalid section" });
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });
  const item = site[section].id(itemId);
  if (!item) return res.status(404).json({ success: false, message: "Item not found" });
  if (item[cfg.imageField]?.publicId) await deleteFile(item[cfg.imageField].publicId);
  item.deleteOne();
  site.lastEditedBy = req.user._id;
  await site.save();
  await writeAudit(req, { action: `website.${section}.delete`, targetType: "Website", targetId: site._id });
  res.json({ success: true, site });
});

/* ---------- publish ---------- */

exports.togglePublish = asyncHandler(async (req, res) => {
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });
  site.isLive = !site.isLive;
  if (site.isLive && !site.publishedAt) site.publishedAt = new Date();
  site.lastEditedBy = req.user._id;
  await site.save();
  await writeAudit(req, {
    action: site.isLive ? "website.publish" : "website.unpublish",
    targetType: "Website",
    targetId: site._id,
  });
  res.json({
    success: true,
    isLive: site.isLive,
    liveUrl: `https://${site.slug}.${ENV.ROOT_DOMAIN}`,
  });
});

/* ---------- theme switch ---------- */

exports.changeTheme = asyncHandler(async (req, res) => {
  const { themeId } = req.body;
  if (!themeId) return res.status(400).json({ success: false, message: "themeId required" });
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });
  const theme = await Theme.findById(themeId);
  if (!theme || !theme.isActive) return res.status(404).json({ success: false, message: "Theme not found" });

  site.theme = theme._id;
  site.themeKey = theme.themeKey;
  site.lastEditedBy = req.user._id;
  await site.save();
  await writeAudit(req, { action: "website.theme.change", targetType: "Website", targetId: site._id, meta: { themeKey: theme.themeKey } });
  res.json({ success: true, site });
});

/* ---------- delete (admin only via route) ---------- */

exports.deleteWebsite = asyncHandler(async (req, res) => {
  const site = await Website.findById(req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });

  // collect every public_id and bulk-destroy
  const ids = [];
  if (site.basicInfo?.logo?.publicId) ids.push(site.basicInfo.logo.publicId);
  if (site.basicInfo?.favicon?.publicId) ids.push(site.basicInfo.favicon.publicId);
  if (site.about?.image?.publicId) ids.push(site.about.image.publicId);
  if (site.seo?.ogImage?.publicId) ids.push(site.seo.ogImage.publicId);
  site.heroSlides.forEach((s) => s.image?.publicId && ids.push(s.image.publicId));
  site.services.forEach((s) => s.image?.publicId && ids.push(s.image.publicId));
  site.reviews.forEach((r) => r.avatar?.publicId && ids.push(r.avatar.publicId));
  site.banners.forEach((b) => b.image?.publicId && ids.push(b.image.publicId));

  if (ids.length) await deleteMultiple(ids);
  await ContactSubmission.deleteMany({ website: site._id });
  await site.deleteOne();
  await writeAudit(req, { action: "website.delete", targetType: "Website", targetId: site._id, meta: { slug: site.slug } });
  res.json({ success: true, message: "Website deleted" });
});

/* ---------- contact submissions ---------- */

exports.listSubmissions = asyncHandler(async (req, res) => {
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });
  const items = await ContactSubmission.find({ website: site._id }).sort({ createdAt: -1 });
  res.json({ success: true, items });
});

exports.markSubmissionRead = asyncHandler(async (req, res) => {
  const site = await findOwned(req, req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Website not found" });
  const sub = await ContactSubmission.findOneAndUpdate(
    { _id: req.params.submissionId, website: site._id },
    { isRead: true },
    { new: true }
  );
  if (!sub) return res.status(404).json({ success: false, message: "Submission not found" });
  res.json({ success: true, submission: sub });
});

/* ---------- check slug availability ---------- */

exports.checkSlug = asyncHandler(async (req, res) => {
  const clean = sanitizeSlug(req.query.slug || "");
  if (!clean || !SLUG_RE.test(clean)) {
    return res.json({ success: true, available: false, reason: "invalid format" });
  }
  const taken = await Website.findOne({ slug: clean });
  res.json({ success: true, available: !taken, slug: clean });
});
