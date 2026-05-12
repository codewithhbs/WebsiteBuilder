const router = require("express").Router();
const c = require("../controllers/auth.controller");
const { auth } = require("../middlewares/auth.middleware");

router.post("/login", c.login);
router.get("/me", auth, c.me);
router.post("/change-password", auth, c.changePassword);

module.exports = router;
