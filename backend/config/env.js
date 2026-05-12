const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGODB_URL: process.env.MONGODB_URL || "mongodb://localhost:27017/service_platform",
  JWT_SECRET: process.env.JWT_SECRET || "dev_secret_change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLOUD_NAME: process.env.CLOUDNAME,
  CLOUD_API: process.env.CLOUD_KEY,
  CLOUD_SECRET_KEY: process.env.CLOUD_SECRET_KEY,
  ROOT_DOMAIN: process.env.ROOT_DOMAIN || "yoursite.com",
  CORS_ORIGINS: process.env.CORS_ORIGINS || "*",
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || "admin@yoursite.com",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
  SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || "Super Admin",
};
