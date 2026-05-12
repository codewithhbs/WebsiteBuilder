const User = require("../models/user.model");
const Website = require("../models/website.model");
const AuditLog = require("../models/auditLog.model");
const asyncHandler = require("../middlewares/asyncHandler");
const { writeAudit } = require("../utils/audit");
const { uploadBuffer, deleteFile } = require("../utils/uploadToCloudinary");

exports.listEmployees = asyncHandler(async (req, res) => {
  const { q = "", page = 1, limit = 20, isActive } = req.query;
  const filter = { role: "employee" };
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  // attach website counts
  const ids = items.map((e) => e._id);
  const counts = await Website.aggregate([
    { $match: { ownerEmployee: { $in: ids } } },
    { $group: { _id: "$ownerEmployee", total: { $sum: 1 }, live: { $sum: { $cond: ["$isLive", 1, 0] } } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c]));
  const enriched = items.map((e) => {
    const c = countMap.get(String(e._id)) || { total: 0, live: 0 };
    return { ...e.toObject(), websiteCount: c.total, liveCount: c.live };
  });

  res.json({ success: true, items: enriched, total, page: Number(page), limit: Number(limit) });
});

exports.getEmployee = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== "employee") {
    return res.status(404).json({ success: false, message: "Employee not found" });
  }
  const websites = await Website.find({ ownerEmployee: user._id })
    .populate("client", "name businessName")
    .select("slug isLive themeKey createdAt publishedAt client")
    .sort({ createdAt: -1 });

  res.json({ success: true, user, websites });
});

exports.createEmployee = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "name, email, password required" });
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ success: false, message: "Email already exists" });

  let avatar = {};
  if (req.file) {
    const r = await uploadBuffer(req.file.buffer, "service-platform/avatars");
    avatar = { url: r.secure_url, publicId: r.public_id };
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone: phone || "",
    role: "employee",
    avatar,
    createdBy: req.user._id,
  });

  await writeAudit(req, {
    action: "employee.create",
    targetType: "User",
    targetId: user._id,
    meta: { email: user.email },
  });

  res.status(201).json({ success: true, user: { ...user.toObject(), password: undefined } });
});

exports.updateEmployee = asyncHandler(async (req, res) => {
  const { name, phone, isActive, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user || user.role !== "employee") {
    return res.status(404).json({ success: false, message: "Employee not found" });
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (isActive !== undefined) user.isActive = isActive === true || isActive === "true";
  if (password) user.password = password;

  if (req.file) {
    if (user.avatar?.publicId) await deleteFile(user.avatar.publicId);
    const r = await uploadBuffer(req.file.buffer, "service-platform/avatars");
    user.avatar = { url: r.secure_url, publicId: r.public_id };
  }

  await user.save();
  await writeAudit(req, { action: "employee.update", targetType: "User", targetId: user._id });
  res.json({ success: true, user });
});

exports.deleteEmployee = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== "employee") {
    return res.status(404).json({ success: false, message: "Employee not found" });
  }
  // soft delete: deactivate instead of removing (keeps websites/audit linked)
  user.isActive = false;
  await user.save();
  await writeAudit(req, { action: "employee.deactivate", targetType: "User", targetId: user._id });
  res.json({ success: true, message: "Employee deactivated" });
});

exports.employeeHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find({ actor: req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AuditLog.countDocuments({ actor: req.params.id }),
  ]);

  res.json({ success: true, items: logs, total, page: Number(page), limit: Number(limit) });
});
