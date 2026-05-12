const AuditLog = require("../models/auditLog.model");

const writeAudit = async (req, { action, targetType, targetId, meta }) => {
  try {
    if (!req.user) return;
    await AuditLog.create({
      actor: req.user._id,
      actorRole: req.user.role,
      action,
      targetType: targetType || "",
      targetId: targetId || null,
      meta: meta || {},
      ip: req.ip,
    });
  } catch (err) {
    console.warn("[audit] write failed:", err.message);
  }
};

module.exports = { writeAudit };
