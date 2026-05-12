import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

const StatCard = ({ icon, label, value, color }) => (
  <div className="col-md-4 col-xl-2 mb-3">
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

  useEffect(() => {
    api.get("/admin/dashboard").then((r) => setData(r.data));
  }, []);

  if (!data) return <div>Loading…</div>;
  const { stats, topEmployees, recentLogs } = data;

  return (
    <div>
      <h4 className="mb-4">Dashboard</h4>
      <div className="row">
        <StatCard icon="bi-people" label="Employees" value={stats.employees} color="#3b82f6" />
        <StatCard icon="bi-person-vcard" label="Clients" value={stats.clients} color="#10b981" />
        <StatCard icon="bi-globe2" label="Websites" value={stats.websites} color="#a855f7" />
        <StatCard icon="bi-broadcast" label="Live" value={stats.liveWebsites} color="#ef4444" />
        <StatCard icon="bi-envelope" label="Submissions" value={stats.submissions} color="#f59e0b" />
      </div>

      <div className="row mt-3">
        <div className="col-lg-5 mb-3">
          <div className="card p-3">
            <h6 className="mb-3">Top Employees</h6>
            {topEmployees.length === 0 ? (
              <div className="empty-state small">No data yet</div>
            ) : (
              <ul className="list-unstyled mb-0">
                {topEmployees.map((e) => (
                  <li key={e._id} className="d-flex justify-content-between py-2 border-bottom">
                    <span><Link to={`/employees/${e._id}`}>{e.user.name}</Link><div className="small text-muted">{e.user.email}</div></span>
                    <span className="text-end">
                      <span className="badge bg-light text-dark">{e.websiteCount} sites</span>
                      <div className="small text-success">{e.live} live</div>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="col-lg-7 mb-3">
          <div className="card p-3">
            <h6 className="mb-3">Recent Activity</h6>
            {recentLogs.length === 0 ? (
              <div className="empty-state small">No activity yet</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr><th>When</th><th>Who</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((l) => (
                      <tr key={l._id}>
                        <td className="small text-muted">{new Date(l.createdAt).toLocaleString()}</td>
                        <td className="small">{l.actor?.name || "—"}</td>
                        <td><code className="small">{l.action}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
