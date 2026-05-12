import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

const StatCard = ({ icon, label, value, color }) => (
  <div className="col-md-3 mb-3">
    <div className="card stat-card p-3 h-100">
      <div className="d-flex align-items-center gap-3">
        <div className="icon" style={{ background: color + "22", color }}>
          <i className={`bi ${icon}`}></i>
        </div>
        <div>
          <div className="text-muted small">{label}</div>
          <div className="fs-4 fw-bold">{value}</div>
        </div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/employee/dashboard").then((r) => setData(r.data)); }, []);
  if (!data) return <div>Loading…</div>;
  const { stats, recentSites } = data;

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h4 className="mb-0">Dashboard</h4>
        <Link to="/websites/new" className="btn btn-primary"><i className="bi bi-plus-lg me-1"></i>New Website</Link>
      </div>
      <div className="row">
        <StatCard icon="bi-person-vcard" label="Clients" value={stats.clients} color="#10b981" />
        <StatCard icon="bi-globe2" label="Websites" value={stats.websites} color="#a855f7" />
        <StatCard icon="bi-broadcast" label="Live" value={stats.liveWebsites} color="#ef4444" />
        <StatCard icon="bi-envelope" label="Leads" value={stats.submissions} color="#f59e0b" />
      </div>
      <div className="card p-3 mt-3">
        <h6 className="mb-3">Recent Websites</h6>
        {recentSites.length === 0 ? <div className="empty-state">No websites yet. <Link to="/websites/new">Create one</Link></div> : (
          <table className="table align-middle">
            <thead><tr><th>Slug</th><th>Client</th><th>Theme</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {recentSites.map((w) => (
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
        )}
      </div>
    </div>
  );
}
