const User = require("../models/user.model");
const Client = require("../models/client.model");
const Website = require("../models/website.model");
const ContactSubmission = require("../models/contactSubmission.model");
const AuditLog = require("../models/auditLog.model");
const asyncHandler = require("../middlewares/asyncHandler");

exports.adminDashboard = asyncHandler(async (req, res) => {
  const [employees, clients, websites, liveWebsites, submissions, recentLogs] = await Promise.all([
    User.countDocuments({ role: "employee" }),
    Client.countDocuments({}),
    Website.countDocuments({}),
    Website.countDocuments({ isLive: true }),
    ContactSubmission.countDocuments({}),
    AuditLog.find({}).sort({ createdAt: -1 }).limit(20).populate("actor", "name email role"),
  ]);

  // top employees by website count
  const topEmployees = await Website.aggregate([
    { $group: { _id: "$ownerEmployee", websiteCount: { $sum: 1 }, live: { $sum: { $cond: ["$isLive", 1, 0] } } } },
    { $sort: { websiteCount: -1 } },
    { $limit: 5 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $project: { _id: 1, websiteCount: 1, live: 1, "user.name": 1, "user.email": 1 } },
  ]);

  res.json({
    success: true,
    stats: { employees, clients, websites, liveWebsites, submissions },
    topEmployees,
    recentLogs,
  });
});

exports.employeeDashboard = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const [clients, websites, liveWebsites, submissions] = await Promise.all([
    Client.countDocuments({ createdByEmployee: owner }),
    Website.countDocuments({ ownerEmployee: owner }),
    Website.countDocuments({ ownerEmployee: owner, isLive: true }),
    ContactSubmission.aggregate([
      { $lookup: { from: "websites", localField: "website", foreignField: "_id", as: "w" } },
      { $unwind: "$w" },
      { $match: { "w.ownerEmployee": owner } },
      { $count: "total" },
    ]),
  ]);

  const recentSites = await Website.find({ ownerEmployee: owner })
    .populate("client", "name businessName")
    .sort({ updatedAt: -1 })
    .limit(8)
    .select("slug isLive themeKey publishedAt updatedAt client");

  res.json({
    success: true,
    stats: {
      clients,
      websites,
      liveWebsites,
      submissions: submissions[0]?.total || 0,
    },
    recentSites,
  });
});
