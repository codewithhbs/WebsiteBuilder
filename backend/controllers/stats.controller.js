const Stats = require("../models/stats.tracker.model");
const asyncHandler = require("../middlewares/asyncHandler");
const { writeAudit } = require("../utils/audit");


// CREATE (Single + Bulk)
exports.createStats = asyncHandler(async (req, res) => {
    try {
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: "Data is required"
            });
        }

        let result;

        // BULK CREATE
        if (Array.isArray(data)) {

            result = await Stats.insertMany(data);

            await writeAudit(req, {
                action: "CREATE_BULK_STATS",
                targetType: "Website",
                targetId: null,
                meta: data
            });

        } else {

            // SINGLE CREATE
            result = await Stats.create(data);

            await writeAudit(req, {
                action: "CREATE_STATS",
                targetType: "Website",
                targetId: result._id,
                meta: data
            });
        }

        return res.status(201).json({
            success: true,
            message: "Stats created successfully",
            data: result
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// GET ALL
exports.getAllStats = asyncHandler(async (req, res) => {
    try {

        const stats = await Stats.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// GET SINGLE
exports.getStatsById = asyncHandler(async (req, res) => {
    try {

        const { id } = req.params;

        const stat = await Stats.findById(id);

        if (!stat) {
            return res.status(404).json({
                success: false,
                message: "Stats not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: stat
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// UPDATE
exports.updateStats = asyncHandler(async (req, res) => {
    try {

        const { id } = req.params;
        const { key, value } = req.body;

        const updated = await Stats.findByIdAndUpdate(
            id,
            { key, value },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Stats not found"
            });
        }

        await writeAudit(req, {
            action: "UPDATE_STATS",
            targetType: "Website",
            targetId: updated._id,
            meta: {
                key,
                value
            }
        });

        return res.status(200).json({
            success: true,
            message: "Stats updated successfully",
            data: updated
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// DELETE
exports.deleteStats = asyncHandler(async (req, res) => {
    try {

        const { id } = req.params;

        const deleted = await Stats.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Stats not found"
            });
        }

        await writeAudit(req, {
            action: "DELETE_STATS",
            targetType: "Website",
            targetId: deleted._id,
            meta: deleted
        });

        return res.status(200).json({
            success: true,
            message: "Stats deleted successfully"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});