const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const ENV = require("./config/env");

const globalErrorHandler = require("./middlewares/error.middleware");
const notFound = require("./middlewares/notFound.middleware");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const employeeRoutes = require("./routes/employee.routes");
const statsRoutes = require("./routes/stats.routes");
const publicRoutes = require("./routes/public.routes");

const websiteModel = require("./models/website.model");

const app = express();


// ─────────────────────────────────────────────
// SECURITY
// ─────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);


// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://webgmbapi.hovermedia.in",

  "https://hovermedia.in",
  "https://www.hovermedia.in",
  "https://gmbwebadmin.hovermedia.in",
  "https://www.gmbwebadmin.hovermedia.in",
  "https://gmbemployee.hovermedia.in",
  "https://www.gmbemployee.hovermedia.in",
  "https://webgmbapi.hovermedia.in",
  "https://www.webgmbapi.hovermedia.in",
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("CORS ORIGIN:", origin);
      if (!origin) return callback(null, true);
      if (origin === "null") return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (origin.endsWith(".hovermedia.in")) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// ─────────────────────────────────────────────
// BODY PARSER
// ─────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));


// ─────────────────────────────────────────────
// LOGGER
// ─────────────────────────────────────────────

if (ENV.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}


// ─────────────────────────────────────────────
// STATIC THEMES
// ─────────────────────────────────────────────

app.use(
  "/themes",
  express.static(path.join(__dirname, "../themes"), {
    maxAge: "30d",
    etag: true,
    lastModified: true,
  })
);


// ─────────────────────────────────────────────
// RATE LIMITER
// ─────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authLimiter);


// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  return res.json({
    success: true,
    status: "ok",
    time: new Date().toISOString(),
  });
});


// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/public", publicRoutes);


// ─────────────────────────────────────────────
// SEO INJECTOR HELPER
// ─────────────────────────────────────────────

function buildSeoTags(seo = {}) {
  const e = (s) => String(s || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const tags = [];

  if (seo.title)       tags.push(`<title>${e(seo.title)}</title>`);
  if (seo.description) tags.push(`<meta name="description" content="${e(seo.description)}">`);

  const kw = Array.isArray(seo.keywords)
    ? seo.keywords.map((k) => k.replace(/^"|",?$/g, "").trim()).join(", ")
    : seo.keywords;
  if (kw)                tags.push(`<meta name="keywords" content="${e(kw)}">`);
  if (seo.robots)        tags.push(`<meta name="robots" content="${e(seo.robots)}">`);
  if (seo.author)        tags.push(`<meta name="author" content="${e(seo.author)}">`);
  if (seo.language)      tags.push(`<meta name="language" content="${e(seo.language)}">`);
  if (seo.revisitAfter)  tags.push(`<meta name="revisit-after" content="${e(seo.revisitAfter)}">`);
  if (seo.rating)        tags.push(`<meta name="rating" content="${e(seo.rating)}">`);
  if (seo.distribution)  tags.push(`<meta name="distribution" content="${e(seo.distribution)}">`);
  if (seo.canonicalUrl)  tags.push(`<link rel="canonical" href="${e(seo.canonicalUrl)}">`);

  // Open Graph
  const ogTitle = seo.ogTitle || seo.title;
  const ogDesc  = seo.ogDescription || seo.description;
  if (ogTitle)           tags.push(`<meta property="og:title" content="${e(ogTitle)}">`);
  if (ogDesc)            tags.push(`<meta property="og:description" content="${e(ogDesc)}">`);
  if (seo.ogType)        tags.push(`<meta property="og:type" content="${e(seo.ogType)}">`);
  if (seo.canonicalUrl)  tags.push(`<meta property="og:url" content="${e(seo.canonicalUrl)}">`);
  if (seo.ogImage?.url)  tags.push(`<meta property="og:image" content="${e(seo.ogImage.url)}">`);

  // Twitter Card
  tags.push(`<meta name="twitter:card" content="${e(seo.twitterCard || "summary_large_image")}">`);
  if (ogTitle)                tags.push(`<meta name="twitter:title" content="${e(seo.twitterTitle || ogTitle)}">`);
  if (ogDesc)                 tags.push(`<meta name="twitter:description" content="${e(seo.twitterDescription || ogDesc)}">`);
  if (seo.twitterImage?.url)  tags.push(`<meta name="twitter:image" content="${e(seo.twitterImage.url)}">`);

  // JSON-LD Schema
  if (seo.schemaType) {
    const schema = {
      "@context": "https://schema.org",
      "@type": seo.schemaType,
      name: seo.title,
      description: seo.description,
      url: seo.canonicalUrl,
      ...(seo.ogImage?.url ? { image: seo.ogImage.url } : {}),
    };
    tags.push(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
  }

  return tags.join("\n  ");
}

function serveThemeWithSeo(res, themeKey, site, pageKey) {
  try {
    const htmlPath = path.join(__dirname, `../themes/${themeKey}/index.html`);
    let html = fs.readFileSync(htmlPath, "utf8");

    // strip placeholder title & description meta from static HTML
    html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, "");
    html = html.replace(/<meta\s+name="description"[^>]*>/i, "");

    // inject slug so render.js doesn't need URL param
    const slugScript = `<script>window.__SITE_SLUG__="${site.slug}";window.__API_BASE__="${ENV.PUBLIC_API_BASE}";${
      site.pageType === "multi"
        ? `window.__PAGE_TYPE__="multi";window.__PAGE_KEY__="${pageKey || "home"}";`
        : `window.__PAGE_TYPE__="single";`
    }</script>`;

    // inject SEO tags + slug script before </head>
    const injection = `  ${buildSeoTags(site.seo || {})}\n  ${slugScript}`;
    html = html.replace("</head>", `${injection}\n</head>`);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    console.error("serveThemeWithSeo error:", err);
    return res.status(500).send("Server Error");
  }
}


// pageKey from URL path: "/about" → "about", "/" → "home"
function pageKeyFromPath(p) {
  if (!p || p === "/") return "home";
  const cleaned = String(p).replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!cleaned) return "home";
  // only first segment matters
  const first = cleaned.split("/")[0];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(first)) return "home";
  return first;
}


// ─────────────────────────────────────────────
// LOCAL SLUG ROUTE
// localhost:5400/pooja-enterprises        (single-page or multi homepage)
// localhost:5400/pooja-enterprises/about  (multi-page sub-page)
// ─────────────────────────────────────────────

async function serveLocalSlug(slug, pageKey, res) {
  try {
    const site = await websiteModel.findOne({ slug, isLive: true });
    if (!site) return res.status(404).send("Website not found");
    return serveThemeWithSeo(res, site.themeKey, site, pageKey);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
}

app.get("/:slug", (req, res) => serveLocalSlug(req.params.slug, "home", res));

app.get("/:slug/:pageKey", (req, res) => {
  const pageKey = pageKeyFromPath("/" + req.params.pageKey);
  return serveLocalSlug(req.params.slug, pageKey, res);
});


// ─────────────────────────────────────────────
// SUBDOMAIN ROUTER
// pooja-enterprises.hovermedia.in
// ─────────────────────────────────────────────

app.use(async (req, res, next) => {
  try {
    const host = req.hostname.toLowerCase();
    console.log("host", host);

    const root = process.env.ROOT_DOMAIN;

    const reservedHosts = [
      `gmbemployee.${root}`,
      `www.gmbemployee.${root}`,
      `gmbwebadmin.${root}`,
      `www.gmbwebadmin.${root}`,
      `webgmbapi.${root}`,
      `www.webgmbapi.${root}`,
    ];

    let slug = null;

    if (
      host.endsWith(root) &&
      host !== root &&
      host !== `www.${root}` &&
      !reservedHosts.includes(host)
    ) {
      slug = host.replace(`.${root}`, "");
    }

    if (!slug) return next();

    const site = await websiteModel.findOne({ slug, isLive: true });

    if (!site) return res.status(404).send("Website not found");

    const pageKey = site.pageType === "multi" ? pageKeyFromPath(req.path) : "home";

    return serveThemeWithSeo(res, site.themeKey, site, pageKey);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});


// ─────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────

app.use(notFound);


// ─────────────────────────────────────────────
// GLOBAL ERROR
// ─────────────────────────────────────────────

app.use(globalErrorHandler);


module.exports = app;