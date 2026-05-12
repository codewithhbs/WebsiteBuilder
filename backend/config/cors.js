const cors = require("cors");
const ENV = require("./env");

const origins = ENV.CORS_ORIGINS || "*";

const corsOptions = {
  origin: (origin, callback) => {
    console.log("🌍 Incoming Origin:", origin);

    // Allow Postman / mobile apps / server requests
    if (!origin) {
      return callback(null, true);
    }

    // Allow all
    if (origins === "*") {
      return callback(null, true);
    }

    // Allowed origins list
    const allowedOrigins = origins
      .split(",")
      .map((o) => o.trim());

    // Exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow subdomains
    try {
      const url = new URL(origin);

      if (
        url.hostname === ENV.ROOT_DOMAIN ||
        url.hostname.endsWith(
          `.${ENV.ROOT_DOMAIN}`
        )
      ) {
        return callback(null, true);
      }
    } catch (e) {
      console.log("❌ Invalid origin:", origin);
    }

    console.log(
      "❌ CORS Blocked:",
      origin
    );

    return callback(
      new Error(
        `CORS blocked for origin: ${origin}`
      ),
      false
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-requested-with",
  ],

  exposedHeaders: [
    "Content-Length",
    "Content-Type",
  ],

  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);