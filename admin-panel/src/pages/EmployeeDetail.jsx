import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";

export default function EmployeeDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("websites");

  useEffect(() => {
    api.get(`/admin/employees/${id}`).then((r) => setData(r.data));
    api.get(`/admin/employees/${id}/history`).then((r) => setHistory(r.data.items));
  }, [id]);

  if (!data) return <div>Loading…</div>;
  const { user, websites } = data;

  return (
    <div>
      <Link to="/employees" className="text-muted small"><i className="bi bi-arrow-left me-1"></i>Back</Link>
      <div className="card p-4 mt-2 mb-3">
        <div className="d-flex align-items-center gap-3">
          {user.avatar?.url ? (
            <img src={user.avatar.url} alt="" width="64" height="64" className="rounded-circle" />
          ) : (
            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 64, height: 64 }}>
              <i className="bi bi-person fs-3 text-muted"></i>
            </div>
          )}
          <div>
            <h5 className="mb-0">{user.name}</h5>
            <div className="text-muted small">{user.email} · {user.phone || "—"}</div>
            <div className="mt-1">
              <span className={"badge " + (user.isActive ? "badge-soft-success" : "badge-soft-danger")}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
              <span className="text-muted small ms-3">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              {user.lastLoginAt && <span className="text-muted small ms-3">Last login {new Date(user.lastLoginAt).toLocaleString()}</span>}
            </div>
          </div>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item"><button className={"nav-link " + (tab === "websites" ? "active" : "")} onClick={() => setTab("websites")}>Websites ({websites.length})</button></li>
        <li className="nav-item"><button className={"nav-link " + (tab === "history" ? "active" : "")} onClick={() => setTab("history")}>Activity ({history.length})</button></li>
      </ul>

      {tab === "websites" && (
        <div className="card p-3">
          {websites.length === 0 ? <div className="empty-state">No websites created</div> : (
            <table className="table align-middle">
              <thead><tr><th>Slug</th><th>Client</th><th>Theme</th><th>Status</th><th>Published</th><th>Created</th></tr></thead>
              <tbody>
                {websites.map((w) => (
                  <tr key={w._id}>
                    <td><Link to={`/websites/${w._id}`}>{w.slug}</Link></td>
                    <td>{w.client?.businessName || w.client?.name || "—"}</td>
                    <td><code className="small">{w.themeKey}</code></td>
                    <td>
                      <span className={"badge " + (w.isLive ? "badge-soft-success" : "badge-soft-warning")}>
                        {w.isLive ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="small text-muted">{w.publishedAt ? new Date(w.publishedAt).toLocaleDateString() : "—"}</td>
                    <td className="small text-muted">{new Date(w.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="card p-3">
          {history.length === 0 ? <div className="empty-state">No activity yet</div> : (
            <table className="table table-sm align-middle">
              <thead><tr><th>When</th><th>Action</th><th>Target</th><th>Meta</th></tr></thead>
              <tbody>
                {history.map((l) => (
                  <tr key={l._id}>
                    <td className="small text-muted">{new Date(l.createdAt).toLocaleString()}</td>
                    <td><code className="small">{l.action}</code></td>
                    <td className="small">{l.targetType}</td>
                    <td className="small text-muted"><code>{JSON.stringify(l.meta || {})}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
