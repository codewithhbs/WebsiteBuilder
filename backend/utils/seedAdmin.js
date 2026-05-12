// run: node utils/seedAdmin.js
const connectDB = require("../config/database");
const ENV = require("../config/env");
const User = require("../models/user.model");
const Theme = require("../models/theme.model");

(async () => {
  await connectDB();

  // seed super admin
  const existing = await User.findOne({ email: ENV.SEED_ADMIN_EMAIL });
  if (existing) {
    console.log("[seed] admin exists:", existing.email);
  } else {
    const admin = await User.create({
      name: ENV.SEED_ADMIN_NAME,
      email: ENV.SEED_ADMIN_EMAIL,
      password: ENV.SEED_ADMIN_PASSWORD,
      role: "admin",
    });
    console.log("[seed] admin created:", admin.email, "/ password:", ENV.SEED_ADMIN_PASSWORD);
  }

  // seed two themes
  const themes = [
    { themeKey: "theme1", name: "Classic Light", description: "Light theme with sliders and clean layout" },
    { themeKey: "theme2", name: "Modern Dark", description: "Dark theme with vibrant accents" },
  ];
  for (const t of themes) {
    const found = await Theme.findOne({ themeKey: t.themeKey });
    if (!found) {
      await Theme.create(t);
      console.log("[seed] theme created:", t.themeKey);
    } else {
      console.log("[seed] theme exists:", t.themeKey);
    }
  }

  console.log("[seed] done");
  process.exit(0);
})();
