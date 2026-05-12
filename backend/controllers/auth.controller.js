const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ENV = require("../config/env");
const asyncHandler = require("../middlewares/asyncHandler");
const { writeAudit } = require("../utils/audit");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "email & password required" });
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials" });

  user.lastLoginAt = new Date();
  await user.save();

  req.user = user; // for audit
  await writeAudit(req, { action: "auth.login" });

  const token = signToken(user);
  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "oldPassword & newPassword required" });
  }
  const user = await User.findById(req.user._id).select("+password");
  const ok = await user.comparePassword(oldPassword);
  if (!ok) return res.status(401).json({ success: false, message: "Old password incorrect" });
  user.password = newPassword;
  await user.save();
  await writeAudit(req, { action: "auth.changePassword" });
  res.json({ success: true, message: "Password updated" });
});
