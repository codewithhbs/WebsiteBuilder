const mongoose = require("mongoose");

const StatsTracker = new mongoose.Schema(
    {
        key: {
            type: String
        },
        value: {
            type: String
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("stats", StatsTracker);
