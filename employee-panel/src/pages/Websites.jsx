import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function Websites() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await api.get("/employee/websites", { params: { q, limit: 100 } });
    setItems(data.items);
  };
  useEffect(() => { load(); }, [q]);

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h4 className="mb-0">My Websites</h4>
        <Link to="/websites/new" className="btn btn-primary"><i className="bi bi-plus-lg me-1"></i>New Website</Link>
      </div>
      <div className="card p-3 mb-3"><input className="form-control" placeholder="Search slug…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="card p-3">
        <table className="table align-middle">
          <thead><tr><th>Slug</th><th>Client</th><th>Theme</th><th>Status</th><th>Updated</th></tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan="5" className="empty-state">No websites yet</td></tr> :
              items.map((w) => (
                <tr key={w._id}>
                  <td><Link to={`/websites/${w._id}`}>{w.slug}</Link></td>
                  <td className="small">{w.client?.businessName || w.client?.name || "—"}</td>
                  <td><code className="small">{w.themeKey}</code></td>
                  <td><span className={"badge " + (w.isLive ? "badge-soft-success" : "badge-soft-warning")}>{w.isLive ? "Live" : "Draft"}</span></td>
                  <td className="small text-muted">{new Date(w.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
