const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const ENV = require("../config/env");
const User = require("../models/user.model");
const Client = require("../models/client.model");
const Website = require("../models/website.model");
const asyncHandler = require("../middlewares/asyncHandler");
const site = require("./website.controller");

/**
 * GMB AI Cloud integration.
 * Each GMB tenant maps to one employee user here (created on first use), so
 * tenants only ever see their own clients / websites, and they never log in:
 * the GMB app asks for a short-lived token and opens the panel with it.
 */

/** x-integration-key must match INTEGRATION_KEY (constant-time compare). */
exports.requireIntegrationKey = (req, res, next) => {
  const got = String(req.headers["x-integration-key"] || "");
  const want = String(ENV.INTEGRATION_KEY || "");
  console.log("[integration] requireIntegrationKey got", got, "want", want);
  if (!want) return res.status(503).json({ success: false, message: "INTEGRATION_KEY is not configured on the website builder" });
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ success: false, message: "Invalid integration key" });
  next();
};

async function tenantUser(tenantId, tenantName) {
  const tid = String(tenantId || "").replace(/[^\w-]/g, "");
  if (!tid) throw Object.assign(new Error("tenantId required"), { status: 400 });
  const email = `gmb-tenant-${tid}@gmb.integration`;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name: tenantName || `GMB tenant ${tid}`, email, password: crypto.randomBytes(24).toString("hex"), role: "employee", isActive: true });
  } else if (tenantName && user.name !== tenantName) {
    user.name = tenantName;
    await user.save();
  }
  if (!user.isActive) throw Object.assign(new Error("This workspace is disabled on the website builder"), { status: 403 });
  return user;
}

/** Puts the tenant user on req.user so the normal (owner-scoped) controllers can be reused. */
exports.asTenant = asyncHandler(async (req, res, next) => {
  const tenantId = req.body?.tenantId || req.query.tenantId;
  req.user = await tenantUser(tenantId, req.body?.tenantName);
  next();
});

const liveUrl = (slug) => `https://${slug}.${ENV.ROOT_DOMAIN}`;
const siteOut = (w) => ({ id: w._id, slug: w.slug, isLive: w.isLive, themeKey: w.themeKey, publishedAt: w.publishedAt, updatedAt: w.updatedAt, url: liveUrl(w.slug) });

/** POST /api/integration/sso { tenantId, tenantName } -> { token } (12 h, employee scope) */
exports.sso = asyncHandler(async (req, res) => {
  const user = await tenantUser(req.body.tenantId, req.body.tenantName);
  user.lastLoginAt = new Date();
  await user.save();
  const token = jwt.sign({ id: user._id }, ENV.JWT_SECRET, { expiresIn: "12h" });
  res.json({ success: true, token, rootDomain: ENV.ROOT_DOMAIN });
});

/** POST /api/integration/clients/upsert { tenantId, tenantName, externalClientId, name, businessName, phone, email, notes } */
exports.upsertClient = asyncHandler(async (req, res) => {
  const { tenantId, externalClientId, name, businessName, phone, email, notes } = req.body;
  if (!externalClientId || !name) return res.status(400).json({ success: false, message: "externalClientId and name required" });
  const ref = `gmb:${tenantId}:${externalClientId}`;
  const client = await Client.findOneAndUpdate(
    { externalRef: ref, createdByEmployee: req.user._id },
    { $set: { name, businessName: businessName || name, phone: phone || "", email: email || "", notes: notes || "" }, $setOnInsert: { externalRef: ref, createdByEmployee: req.user._id } },
    { new: true, upsert: true },
  );
  const websites = await Website.find({ client: client._id, ownerEmployee: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, client: { id: client._id, name: client.name }, websites: websites.map(siteOut) });
});

/** GET /api/integration/clients/:externalClientId?tenantId= */
exports.getClient = asyncHandler(async (req, res) => {
  const ref = `gmb:${req.query.tenantId}:${req.params.externalClientId}`;
  const client = await Client.findOne({ externalRef: ref, createdByEmployee: req.user._id });
  if (!client) return res.json({ success: true, client: null, websites: [] });
  const websites = await Website.find({ client: client._id, ownerEmployee: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, client: { id: client._id, name: client.name }, websites: websites.map(siteOut) });
});

/** PATCH /api/integration/websites/:id/publish { tenantId, live: true|false } */
exports.setPublish = asyncHandler(async (req, res, next) => {
  const w = await Website.findOne({ _id: req.params.id, ownerEmployee: req.user._id });
  if (!w) return res.status(404).json({ success: false, message: "Website not found" });
  if (typeof req.body.live === "boolean" && w.isLive === req.body.live) return res.json({ success: true, isLive: w.isLive, liveUrl: liveUrl(w.slug) });
  return site.togglePublish(req, res, next);
});

/** DELETE /api/integration/websites/:id?tenantId= - only the tenant's own site */
exports.deleteWebsite = asyncHandler(async (req, res, next) => {
  const w = await Website.findOne({ _id: req.params.id, ownerEmployee: req.user._id });
  if (!w) return res.status(404).json({ success: false, message: "Website not found" });
  return site.deleteWebsite(req, res, next);
});

/* =====================================================================
   Websites built from GMB data
===================================================================== */
const Theme = require("../models/theme.model");

const img = (url) => (url ? { url: String(url), publicId: null } : undefined);
const empty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length) || (v && typeof v === "object" && !Array.isArray(v) && !v.url && Object.keys(v).length === 0);

/**
 * Writes GMB data into a website. mode "fill" only fills empty fields / empty lists
 * (safe to re-run after editing); mode "overwrite" replaces them with Google's data.
 */
function applyPrefill(site, d, mode = "fill") {
  const force = mode === "overwrite";
  const set = (obj, key, val) => {
    if (val === undefined || val === null || val === "") return;
    if (force || empty(obj[key])) obj[key] = val;
  };
  site.basicInfo = site.basicInfo || {};
  set(site.basicInfo, "siteName", d.basicInfo?.siteName);
  set(site.basicInfo, "tagline", d.basicInfo?.tagline);
  if (d.basicInfo?.logo) set(site.basicInfo, "logo", img(d.basicInfo.logo));
  if (d.basicInfo?.primaryColor && /^#[0-9a-f]{6}$/i.test(d.basicInfo.primaryColor)) set(site.basicInfo, "primaryColor", d.basicInfo.primaryColor);

  if (d.hero && (force || !site.heroSlides?.length)) {
    const imgs = d.hero.images?.length ? d.hero.images : [null];
    site.heroSlides = imgs.slice(0, 3).map((u, i) => ({
      title: i === 0 ? d.hero.title : d.basicInfo?.tagline || d.hero.title,
      subtitle: d.hero.subtitle || "",
      ctaText: d.hero.ctaText || "",
      ctaLink: d.hero.ctaLink || "",
      image: img(u),
      displayOrder: i,
      isActive: true,
    }));
  }

  site.about = site.about || {};
  set(site.about, "heading", d.about?.heading);
  set(site.about, "shortText", d.about?.shortText);
  set(site.about, "longText", d.about?.longText);
  if (d.about?.image) set(site.about, "image", img(d.about.image));
  if (d.about?.highlights?.length && (force || !site.about.highlights?.length)) site.about.highlights = d.about.highlights;

  if (d.services?.length && (force || !site.services?.length)) {
    site.services = d.services.map((s, i) => ({ title: s.title, description: s.description || "", price: s.price || "", displayOrder: i, isActive: true }));
  }
  if (d.reviews?.length && (force || !site.reviews?.length)) {
    site.reviews = d.reviews.map((r, i) => ({ name: r.name, rating: Math.min(5, Math.max(1, Number(r.rating) || 5)), text: r.text || "", designation: r.designation || "", isApproved: true, displayOrder: i }));
  }

  site.contact = site.contact || {};
  for (const k of ["heading", "address", "phone", "email", "workingHours", "mapEmbedUrl"]) set(site.contact, k, d.contact?.[k]);

  site.footer = site.footer || {};
  set(site.footer, "tagline", d.footer?.tagline);
  set(site.footer, "copyrightText", d.footer?.copyrightText);
  site.footer.socialLinks = site.footer.socialLinks || {};
  for (const [k, v] of Object.entries(d.socialLinks || {})) set(site.footer.socialLinks, k, v);

  site.seo = site.seo || {};
  set(site.seo, "title", d.seo?.title ? String(d.seo.title).slice(0, 70) : null);
  set(site.seo, "description", d.seo?.description ? String(d.seo.description).slice(0, 160) : null);
  if (d.seo?.keywords?.length && (force || !site.seo.keywords?.length)) site.seo.keywords = d.seo.keywords.slice(0, 20);
  set(site.seo, "author", d.seo?.author);
  set(site.seo, "schemaType", d.seo?.schemaType);
  set(site.seo, "ogTitle", d.seo?.title);
  set(site.seo, "ogDescription", d.seo?.description ? String(d.seo.description).slice(0, 200) : null);
  if (d.seo?.ogImage) set(site.seo, "ogImage", img(d.seo.ogImage));
  for (const k of ["basicInfo", "about", "contact", "footer", "seo"]) site.markModified(k);
  return site;
}

/** GET /api/integration/themes */
exports.themes = asyncHandler(async (req, res) => {
  const items = await Theme.find({ isActive: true }).sort({ createdAt: 1 });
  res.json({ success: true, items: items.map((t) => ({ id: t._id, themeKey: t.themeKey, name: t.name, description: t.description || "", pageType: t.pageType || "single", previewImage: t.previewImage?.url || null })) });
});

/** GET /api/integration/slug?slug= -> { available, slug } */
exports.slugCheck = asyncHandler(async (req, res) => {
  const slug = String(req.query.slug || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const taken = slug ? await Website.exists({ slug }) : true;
  res.json({ success: true, slug, available: Boolean(slug) && !taken, url: slug ? liveUrl(slug) : null });
});

/**
 * POST /api/integration/websites
 * { tenantId, externalClientId, themeId, slug, pageType?, prefill }
 * Creates the site with the normal controller, then fills it with GMB data.
 */
exports.createWebsite = asyncHandler(async (req, res) => {
  const ref = `gmb:${req.body.tenantId}:${req.body.externalClientId}`;
  const client = await Client.findOne({ externalRef: ref, createdByEmployee: req.user._id });
  if (!client) return res.status(404).json({ success: false, message: "Client not synced - open the Website tab first" });
  const theme = await Theme.findById(req.body.themeId);
  if (!theme || !theme.isActive) return res.status(404).json({ success: false, message: "Theme not found" });

  // run the existing createWebsite controller and capture its response
  let status = 200;
  let payload = null;
  const fakeRes = { status(c) { status = c; return this; }, json(b) { payload = b; return this; } };
  const fakeReq = Object.assign(Object.create(req), {
    body: { clientId: client._id, themeId: theme._id, slug: req.body.slug, siteName: req.body.prefill?.basicInfo?.siteName, pageType: theme.pageType || "single" },
  });
  await site.createWebsite(fakeReq, fakeRes, (e) => { throw e; });
  if (!payload?.success) return res.status(status).json(payload || { success: false, message: "Could not create website" });

  const doc = await Website.findById(payload.site._id);
  if (req.body.prefill) {
    applyPrefill(doc, req.body.prefill, "overwrite");
    doc.lastEditedBy = req.user._id;
    await doc.save();
    if (doc.pageType === "multi") await applyMultiPrefill(doc._id, req.body.prefill).catch((e) => console.error("[integration] multi prefill:", e.message));
  }
  res.status(201).json({ success: true, site: siteOut(doc) });
});

/** PUT /api/integration/websites/:id/prefill { tenantId, prefill, mode: "fill" | "overwrite" } */
exports.prefillWebsite = asyncHandler(async (req, res) => {
  const doc = await Website.findOne({ _id: req.params.id, ownerEmployee: req.user._id });
  if (!doc) return res.status(404).json({ success: false, message: "Website not found" });
  if (req.body.mode === "images") {
    await applyImages(doc, req.body.images || {});
    doc.lastEditedBy = req.user._id;
    await doc.save();
    return res.json({ success: true, site: siteOut(doc) });
  }
  applyPrefill(doc, req.body.prefill || {}, req.body.mode === "overwrite" ? "overwrite" : "fill");
  doc.lastEditedBy = req.user._id;
  await doc.save();
  // multi-page sections are only rewritten on an explicit overwrite (keeps manual page edits)
  if (doc.pageType === "multi" && req.body.mode === "overwrite") await applyMultiPrefill(doc._id, req.body.prefill || {});
  res.json({ success: true, site: siteOut(doc) });
});

exports.applyPrefill = applyPrefill;

/* ---------- multi-page sites: replace the starter (placeholder) sections with real GMB data ---------- */
const Page = require("../models/page.model");

async function applyMultiPrefill(websiteId, d) {
  const pages = await Page.find({ website: websiteId });
  const byKey = Object.fromEntries(pages.map((p) => [p.pageKey, p]));
  const sec = (page, type) => page?.sections?.find((s) => s.type === type);
  const services = (d.services || []).map((s) => ({ icon: "check", title: s.title, description: s.description || "", price: s.price || "" }));
  const reviewsCount = Number(String(d.hero?.subtitle || "").match(/\((\d+) reviews\)/)?.[1] || 0);
  const ratingTxt = String(d.hero?.subtitle || "").match(/([\d.]+)★/)?.[1];
  const telLink = d.hero?.ctaLink || "/contact";

  const home = byKey.home;
  if (home) {
    const hero = sec(home, "hero");
    if (hero) {
      hero.data = {
        ...hero.data,
        badge: d.business?.category || "",
        title: d.basicInfo?.siteName ? `*${d.basicInfo.siteName}*` : hero.data.title,
        subtitle: d.basicInfo?.tagline || d.about?.shortText || "",
        chips: services.slice(0, 3).map((s) => ({ icon: "check", label: s.title })),
        ctaText: d.hero?.ctaText || "Contact us",
        ctaLink: telLink,
        secondaryCtaText: "Our services",
        secondaryCtaLink: "/services",
        // no invented numbers: only real Google rating, else nothing
        trustText: ratingTxt ? `Rated ${ratingTxt}/5 on Google${reviewsCount ? ` by ${reviewsCount} customers` : ""}` : "",
        floatingRating: ratingTxt ? `${ratingTxt}/5 on Google` : "",
        floatingStat: services.length ? { icon: "award", number: `${services.length}`, label: "Services offered" } : null,
        ...(d.hero?.images?.[0] ? { image: { url: d.hero.images[0], alt: d.basicInfo?.siteName || "" } } : {}),
      };
    }
    const marquee = sec(home, "marquee");
    if (marquee && services.length) marquee.data = { ...marquee.data, items: services.slice(0, 8).map((s) => s.title) };
    const features = sec(home, "features");
    if (features && services.length) features.data = { ...features.data, eyebrow: "What we do", heading: `Services at ${d.basicInfo?.siteName || "our business"}`, subheading: d.business?.city ? `Serving ${d.business.city} and nearby areas.` : "", items: services.slice(0, 6).map((s) => ({ icon: "check", title: s.title, description: s.description })) };
    const stats = sec(home, "stats");
    if (stats) {
      const items = [
        ratingTxt ? { number: `${ratingTxt}★`, label: "Google rating" } : null,
        reviewsCount ? { number: `${reviewsCount}`, label: "Google reviews" } : null,
        services.length ? { number: `${services.length}`, label: "Services" } : null,
        d.business?.city ? { number: d.business.city, label: "Location" } : null,
      ].filter(Boolean);
      if (items.length >= 2) stats.data = { ...stats.data, items };
      else home.sections = home.sections.filter((s) => s !== stats); // never show made-up stats
    }
    const cta = sec(home, "cta");
    if (cta) cta.data = { ...cta.data, ctaText: d.hero?.ctaText || cta.data.ctaText, ctaLink: telLink };
    if (d.reviews?.length && !sec(home, "testimonials")) {
      home.sections.push({ type: "testimonials", displayOrder: (home.sections.length || 0) + 1, data: { eyebrow: "Google reviews", heading: "What our customers say", items: d.reviews.map((r) => ({ name: r.name, rating: r.rating, text: r.text, designation: "Google review" })) } });
    }
    home.markModified("sections");
    await home.save();
  }

  const about = byKey.about;
  if (about) {
    const a = sec(about, "about");
    if (a) a.data = { ...a.data, heading: d.about?.heading || a.data.heading, body: d.about?.longText || a.data.body, highlights: d.about?.highlights?.length ? d.about.highlights : a.data.highlights, ...(d.about?.image ? { image: { url: d.about.image, alt: d.basicInfo?.siteName || "" } } : {}) };
    const hero = sec(about, "hero");
    if (hero) hero.data = { ...hero.data, title: d.about?.heading || hero.data.title, subtitle: d.basicInfo?.tagline || hero.data.subtitle };
    about.markModified("sections");
    await about.save();
  }

  const svc = byKey.services;
  if (svc && services.length) {
    const s = sec(svc, "services");
    if (s) s.data = { ...s.data, items: services };
    svc.markModified("sections");
    await svc.save();
  }
}
exports.applyMultiPrefill = applyMultiPrefill;


/**
 * mode "images": AI-generated photos from GMB AI Cloud.
 * images = { hero: [url...], about: url, services: { "<service title>": url } }
 * Only image fields change - text and the user's other edits stay as they are.
 */
async function applyImages(doc, images) {
  const norm = (t) => String(t || "").trim().toLowerCase();
  const svc = Object.fromEntries(Object.entries(images.services || {}).map(([k, v]) => [norm(k), v]));
  if (images.hero?.length) {
    if (doc.heroSlides?.length) doc.heroSlides.forEach((h, i) => { if (images.hero[i % images.hero.length]) h.image = img(images.hero[i % images.hero.length]); });
    else doc.heroSlides = images.hero.slice(0, 3).map((u, i) => ({ title: doc.basicInfo?.siteName || "", subtitle: doc.basicInfo?.tagline || "", image: img(u), displayOrder: i, isActive: true }));
    doc.markModified("heroSlides");
    if (doc.seo) { doc.seo.ogImage = img(images.hero[0]); doc.markModified("seo"); }
  }
  if (images.about) {
    doc.about = doc.about || {};
    doc.about.image = img(images.about);
    doc.markModified("about");
  }
  for (const s of doc.services || []) if (svc[norm(s.title)]) s.image = img(svc[norm(s.title)]);
  doc.markModified("services");

  if (doc.pageType === "multi") {
    const pages = await Page.find({ website: doc._id });
    for (const p of pages) {
      let changed = false;
      for (const sec of p.sections || []) {
        if (sec.type === "hero" && p.pageKey === "home" && images.hero?.[0]) { sec.data = { ...sec.data, image: { url: images.hero[0], alt: doc.basicInfo?.siteName || "" } }; changed = true; }
        if (sec.type === "about" && images.about) { sec.data = { ...sec.data, image: { url: images.about, alt: doc.basicInfo?.siteName || "" } }; changed = true; }
        if (sec.type === "services" && Array.isArray(sec.data?.items)) {
          sec.data = { ...sec.data, items: sec.data.items.map((it) => (svc[norm(it.title)] ? { ...it, image: { url: svc[norm(it.title)] } } : it)) };
          changed = true;
        }
      }
      if (changed) { p.markModified("sections"); await p.save(); }
    }
  }
}
exports.applyImages = applyImages;
