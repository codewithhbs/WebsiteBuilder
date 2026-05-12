const router = require("express").Router();
const { auth, requireRole } = require("../middlewares/auth.middleware");
const upload = require("../config/multer");
const emp = require("../controllers/employee.controller");
const theme = require("../controllers/theme.controller");
const dash = require("../controllers/dashboard.controller");
const site = require("../controllers/website.controller");

router.use(auth, requireRole("admin"));

router.get("/dashboard", dash.adminDashboard);

// employees
router.get("/employees", emp.listEmployees);
router.get("/employees/:id", emp.getEmployee);
router.get("/employees/:id/history", emp.employeeHistory);
router.post("/employees", upload.single("avatar"), emp.createEmployee);
router.patch("/employees/:id", upload.single("avatar"), emp.updateEmployee);
router.delete("/employees/:id", emp.deleteEmployee);

// themes (admin-only manage)
router.post("/themes", upload.single("previewImage"), theme.createTheme);
router.patch("/themes/:id", upload.single("previewImage"), theme.updateTheme);

// admin can hard-delete a website
router.delete("/websites/:id", site.deleteWebsite);

module.exports = router;
