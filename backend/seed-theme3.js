/* seed-theme3.js
   One-shot script to register theme3 (Ajay Ambulance Style) in the DB.
   Run from backend folder:  node seed-theme3.js
*/
require("dotenv").config();
const mongoose = require("mongoose");
const ENV = require("./config/env");
const Theme = require("./models/theme.model");

(async () => {
  try {
    await mongoose.connect(ENV.MONGODB_URL);
    console.log("[db] connected:", mongoose.connection.name);

    const themeKey = "theme3";
    const exists = await Theme.findOne({ themeKey });

    if (exists) {
      console.log(`[seed] theme3 already exists (id: ${exists._id}). Skipping.`);
      console.log("        If you want to refresh it, delete it from DB first.");
    } else {
      const theme = await Theme.create({
        themeKey: "theme3",
        name: "Callback Pro — Service Business",
        description:
          "Modern service-business template with a hero callback form, dynamic services grid, why-choose-us blocks, how-it-works flow, areas served chips, testimonials, FAQ accordion, and a bold final CTA. Bold accent + clean white surface with green WhatsApp buttons. All copy is dynamic via the standard /api/public/site/:slug contract.",
        isActive: true,
      });
      console.log(`[seed] theme3 created (id: ${theme._id}) ✓`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("[seed] error:", err.message);
    process.exit(1);
  }
})();
