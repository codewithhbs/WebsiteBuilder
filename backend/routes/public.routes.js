const router = require("express").Router();
const site = require("../controllers/website.controller");
const theme = require("../controllers/theme.controller");
const page = require("../controllers/page.controller");

// public theme listing (used in admin/employee panels)
router.get("/themes", theme.listThemes);

// public site fetch by slug — themes call this
router.get("/site/:slug", site.publicGetBySlug);
router.post("/site/:slug/contact", site.publicSubmitContact);

// MULTI-PAGE public endpoints (used by multi-page theme renderers)
router.get("/site/:slug/pages", page.publicListPages);
router.get("/site/:slug/page/:pageKey", page.publicGetPage);

module.exports = router;
