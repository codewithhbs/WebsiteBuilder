import { useEffect, useState } from "react";
import api from "../api/client";

// admin sees per-employee audit; this page shows recent global activity from dashboard endpoint
export default function Audit() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get("/admin/dashboard").then((r) => setLogs(r.data.recentLogs));
  }, []);

  return (
    <div>
      <h4 className="mb-3">Recent Activity</h4>
      <div className="card p-3">
        <table className="table table-sm align-middle">
          <thead><tr><th>When</th><th>Actor</th><th>Role</th><th>Action</th><th>Target</th></tr></thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="5" className="empty-state">No activity</td></tr>
            ) : logs.map((l) => (
              <tr key={l._id}>
                <td className="small text-muted">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="small">{l.actor?.name || "—"}</td>
                <td><span className="badge bg-light text-dark">{l.actorRole}</span></td>
                <td><code className="small">{l.action}</code></td>
                <td className="small">{l.targetType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-muted small mt-2">For full per-employee history, open an employee detail.</div>
    </div>
  );
}
