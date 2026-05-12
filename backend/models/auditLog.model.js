const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorRole: { type: String, enum: ["admin", "employee"], required: true },
    action: { type: String, required: true }, // e.g. "website.create", "website.publish"
    targetType: { type: String, default: "" }, // "Website" | "Client" | "User"
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: true }
);

AuditLogSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
