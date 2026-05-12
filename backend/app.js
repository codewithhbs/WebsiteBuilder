const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const ENV = require("./config/env");
const path = require("path")
const globalErrorHandler = require("./middlewares/error.middleware");
const notFound = require("./middlewares/notFound.middleware");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const employeeRoutes = require("./routes/employee.routes");
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
  })
);


// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",

      "https://hovermedia.in",
      "https://www.hovermedia.in",

      "https://gmbwebadmin.hovermedia.in",
      "https://www.gmbwebadmin.hovermedia.in",

      "https://gmbemployee.hovermedia.in",
      "https://www.gmbemployee.hovermedia.in",

      "https://webgmbapi.hovermedia.in",
      "https://www.webgmbapi.hovermedia.in",

      "null",
    ],

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
// ─────────────────────────────────────────────
// BODY PARSER
// ─────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ─────────────────────────────────────────────
// LOGGER
// ─────────────────────────────────────────────

if (ENV.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}



app.use(
  "/themes",
  express.static(
    path.join(__dirname, "../themes"),
    {
      maxAge: "30d",
      etag: true,
      lastModified: true,
    }
  )
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

app.use(
  "/api/auth/login",
  authLimiter
);

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
// ROUTES
// ─────────────────────────────────────────────
app.get("/:slug", async (req, res) => {
  try {
    const site = await websiteModel.findOne({
      slug: req.params.slug,
      isLive: true,
    });

    if (!site) {
      return res.status(404).send("Website not found");
    }

    return res.redirect(
      `/themes/${site.themeKey}/index.html?slug=${site.slug}`
    );

  } catch (err) {
    console.error(err);

    res.status(500).send("Server Error");
  }
});



app.use(async (req, res) => {

  try {

    const host = req.hostname.toLowerCase();

    const root = process.env.ROOT_DOMAIN;

    let slug = null;

    if (
      host.endsWith(root) &&
      host !== root &&
      host !== `www.${root}`
    ) {

      slug = host.replace(`.${root}`, "");
    }

    if (!slug) {
      return res.send("HoverMedia Main Website");
    }

    const site = await websiteModel.findOne({
      slug,
      isLive: true,
    });

    if (!site) {
      return res.status(404).send("Website not found");
    }

    return res.sendFile(
      path.join(
        __dirname,
        `../themes/${site.themeKey}/index.html`
      )
    );

  } catch (err) {

    console.error(err);

    res.status(500).send("Server Error");
  }
});


app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/employee", employeeRoutes);

app.use("/api/public", publicRoutes);

// ─────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────

app.use(notFound);
app.get("/", (req, res) => {
  res.send("Hello")
})

// ─────────────────────────────────────────────
// GLOBAL ERROR
// ─────────────────────────────────────────────

app.use(globalErrorHandler);

module.exports = app;