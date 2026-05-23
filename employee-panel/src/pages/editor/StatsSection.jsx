import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";

const StatsSection = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [form, setForm] = useState({ key: "", value: "" });

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await api.get("/stats");
            setStats(res.data.data || []);
        } catch (err) {
            toast.error("Failed to load stats");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const openCreate = () => {
        setForm({ key: "", value: "" });
        setEditMode(false);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setForm({ key: item.key, value: item.value });
        setCurrentId(item._id);
        setEditMode(true);
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (!form.key || !form.value) {
                return toast.error("All fields required");
            }

            if (editMode) {
                await api.put(`/stats/${currentId}`, form);
                toast.success("Updated successfully");
            } else {
                await api.post("/stats", { data: form });
                toast.success("Created successfully");
            }

            setShowModal(false);
            fetchStats();

        } catch (err) {
            console.log(err)
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        const confirm = window.confirm("Are you sure to delete this stat?");
        if (!confirm) return;

        try {
            await api.delete(`/stats/${id}`);
            toast.success("Deleted successfully");
            fetchStats();
        } catch {
            toast.error("Delete failed");
        }
    };

    const handleDeleteAll = async () => {
        const confirm = window.confirm("Are you sure to delete ALL stats?");
        if (!confirm) return;

        try {
            await Promise.all(stats.map(s => api.delete(`/stats/${s._id}`)));
            toast.success("All stats deleted");
            fetchStats();
        } catch {
            toast.error("Bulk delete failed");
        }
    };

    return (
        <div className="container mt-4">

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Website Stats</h4>

                <div>
                    <button className="btn btn-danger me-2" onClick={handleDeleteAll}>
                        Delete All
                    </button>

                    <button className="btn btn-primary" onClick={openCreate}>
                        + New Stat
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="card shadow-sm">
                <div className="card-body">
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <table className="table table-bordered table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th>Key</th>
                                    <th>Value</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {stats.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center">
                                            No stats found
                                        </td>
                                    </tr>
                                ) : (
                                    stats.map((item) => (
                                        <tr key={item._id}>
                                            <td>{item.key}</td>
                                            <td>{item.value}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-warning me-2"
                                                    onClick={() => openEdit(item)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(item._id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="modal d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editMode ? "Edit Stat" : "Create Stat"}
                                </h5>
                                <button
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                />
                            </div>

                            <div className="modal-body">
                                <div className="mb-3">
                                    <label>Key</label>
                                    <input
                                        className="form-control"
                                        value={form.key}
                                        onChange={(e) =>
                                            setForm({ ...form, key: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="mb-3">
                                    <label>Value</label>
                                    <input
                                        className="form-control"
                                        value={form.value}
                                        onChange={(e) =>
                                            setForm({ ...form, value: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn btn-success"
                                    onClick={handleSave}
                                >
                                    {editMode ? "Update" : "Create"}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsSection;