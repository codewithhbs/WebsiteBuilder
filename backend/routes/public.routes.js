const router = require("express").Router();
const site = require("../controllers/website.controller");
const theme = require("../controllers/theme.controller");
const websiteModel = require("../models/website.model");

// public theme listing (used in admin/employee panels)
router.get("/themes", theme.listThemes);

// public site fetch by slug — themes call this
router.get("/site/:slug", site.publicGetBySlug);
router.post("/site/:slug/contact", site.publicSubmitContact);


module.exports = router;
