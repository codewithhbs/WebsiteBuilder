const router = require("express").Router();
const c = require("../controllers/integration.controller");

// Server-to-server only: every call needs the x-integration-key header.
router.use(c.requireIntegrationKey);

router.post("/sso", c.sso);
router.post("/clients/upsert", c.asTenant, c.upsertClient);
router.get("/clients/:externalClientId", c.asTenant, c.getClient);
router.get("/themes", c.themes);
router.get("/slug", c.slugCheck);
router.post("/websites", c.asTenant, c.createWebsite);
router.put("/websites/:id/prefill", c.asTenant, c.prefillWebsite);
router.patch("/websites/:id/publish", c.asTenant, c.setPublish);
router.delete("/websites/:id", c.asTenant, c.deleteWebsite);

module.exports = router;
