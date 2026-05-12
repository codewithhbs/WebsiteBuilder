const Client = require("../models/client.model");
const Website = require("../models/website.model");
const asyncHandler = require("../middlewares/asyncHandler");
const { writeAudit } = require("../utils/audit");

const scopeFilter = (req) =>
  req.user.role === "admin" ? {} : { createdByEmployee: req.user._id };

exports.listClients = asyncHandler(async (req, res) => {
  const { q = "", page = 1, limit = 20 } = req.query;
  const filter = scopeFilter(req);
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
      { phone: new RegExp(q, "i") },
      { businessName: new RegExp(q, "i") },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Client.find(filter)
      .populate("createdByEmployee", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Client.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page: Number(page), limit: Number(limit) });
});

exports.getClient = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...scopeFilter(req) };
  const client = await Client.findOne(filter).populate("createdByEmployee", "name email");
  if (!client) return res.status(404).json({ success: false, message: "Client not found" });
  const websites = await Website.find({ client: client._id })
    .select("slug isLive themeKey createdAt publishedAt");
  res.json({ success: true, client, websites });
});

exports.createClient = asyncHandler(async (req, res) => {
  const { name, email, phone, businessName, notes } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "name required" });

  const client = await Client.create({
    name,
    email: email || "",
    phone: phone || "",
    businessName: businessName || "",
    notes: notes || "",
    createdByEmployee: req.user._id,
  });

  await writeAudit(req, {
    action: "client.create",
    targetType: "Client",
    targetId: client._id,
    meta: { name: client.name },
  });

  res.status(201).json({ success: true, client });
});

exports.updateClient = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...scopeFilter(req) };
  const client = await Client.findOne(filter);
  if (!client) return res.status(404).json({ success: false, message: "Client not found" });

  ["name", "email", "phone", "businessName", "notes", "isActive"].forEach((k) => {
    if (req.body[k] !== undefined) client[k] = req.body[k];
  });
  await client.save();
  await writeAudit(req, { action: "client.update", targetType: "Client", targetId: client._id });
  res.json({ success: true, client });
});

exports.deleteClient = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...scopeFilter(req) };
  const client = await Client.findOne(filter);
  if (!client) return res.status(404).json({ success: false, message: "Client not found" });
  client.isActive = false;
  await client.save();
  await writeAudit(req, { action: "client.deactivate", targetType: "Client", targetId: client._id });
  res.json({ success: true, message: "Client deactivated" });
});
