const express = require("express");
const router = express.Router();

const statsController = require("../controllers/stats.controller");

router.post("/", statsController.createStats);
router.get("/", statsController.getAllStats);
router.get("/:id", statsController.getStatsById);
router.put("/:id", statsController.updateStats);
router.delete("/:id", statsController.deleteStats);

module.exports = router;