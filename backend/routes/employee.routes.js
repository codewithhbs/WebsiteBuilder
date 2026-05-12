const router = require("express").Router();
const { auth, requireRole } = require("../middlewares/auth.middleware");
const upload = require("../config/multer");
const dash = require("../controllers/dashboard.controller");
const client = require("../controllers/client.controller");
const site = require("../controllers/website.controller");

router.use(auth, requireRole("employee", "admin"));

router.get("/dashboard", dash.employeeDashboard);

// clients
router.get("/clients", client.listClients);
router.get("/clients/:id", client.getClient);
router.post("/clients", client.createClient);
router.patch("/clients/:id", client.updateClient);
router.delete("/clients/:id", client.deleteClient);

// websites
router.get("/websites", site.listWebsites);
router.get("/websites/check-slug", site.checkSlug);
router.get("/websites/:id", site.getWebsite);
router.post("/websites", site.createWebsite);
router.patch("/websites/:id/section/:section", upload.any(), site.updateSection);
router.patch("/websites/:id/theme", site.changeTheme);
router.patch("/websites/:id/publish", site.togglePublish);

// hero slides
router.post("/websites/:id/hero", upload.single("image"), site.addHeroSlide);
router.patch("/websites/:id/hero/:slideId", upload.single("image"), site.updateHeroSlide);
router.delete("/websites/:id/hero/:slideId", site.deleteHeroSlide);

// generic array sections: services | reviews | banners
router.post(
    "/websites/:id/:section",
    upload.single("image"),
    site.addArrayItem
);

router.patch(
    "/websites/:id/:section/:itemId",
    upload.single("image"),
    site.updateArrayItem
);

router.delete(
    "/websites/:id/:section/:itemId",
    site.deleteArrayItem
);

// contact submissions
router.get("/websites/:id/submissions", site.listSubmissions);
router.patch("/websites/:id/submissions/:submissionId/read", site.markSubmissionRead);

module.exports = router;
