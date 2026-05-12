import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";

export default function Websites() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const params = { q, limit: 100 };
    if (filter !== "all") params.isLive = filter === "live";
    const { data } = await api.get("/employee/websites", { params });
    setItems(data.items);
  };
  useEffect(() => { load(); }, [q, filter]);

  const del = async (id, slug) => {
    if (!confirm(`Delete website "${slug}"? This is permanent.`)) return;
    try {
      await api.delete(`/admin/websites/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <h4 className="mb-3">Websites</h4>
      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-8"><input className="form-control" placeholder="Search slug…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="col-md-4">
            <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="live">Live only</option>
              <option value="draft">Draft only</option>
            </select>
          </div>
        </div>
      </div>
      <div className="card p-3">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Slug</th><th>Client</th><th>Owner</th><th>Theme</th><th>Status</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">No websites</td></tr>
              ) : items.map((w) => (
                <tr key={w._id}>
                  <td><Link to={`/websites/${w._id}`}>{w.slug}</Link></td>
                  <td className="small">{w.client?.businessName || w.client?.name || "—"}</td>
                  <td className="small">{w.ownerEmployee?.name || "—"}</td>
                  <td><code className="small">{w.themeKey}</code></td>
                  <td><span className={"badge " + (w.isLive ? "badge-soft-success" : "badge-soft-warning")}>{w.isLive ? "Live" : "Draft"}</span></td>
                  <td className="small text-muted">{new Date(w.updatedAt).toLocaleDateString()}</td>
                  <td><button className="btn btn-sm btn-outline-danger" onClick={() => del(w._id, w.slug)}><i className="bi bi-trash"></i></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
