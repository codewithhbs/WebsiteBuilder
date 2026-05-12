import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";

export default function SubmissionsSection({ site }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [filter, setFilter] = useState("all"); // all | unread | read

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/employee/websites/${site._id}/submissions`);
      setItems(data.items || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [site._id]);

  const markRead = async (s) => {
    setMarkingId(s._id);
    try {
      await api.patch(`/employee/websites/${site._id}/submissions/${s._id}/read`);
      toast.success("Marked as read");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setMarkingId(null);
    }
  };

  const filtered = items.filter((s) => {
    if (filter === "unread") return !s.isRead;
    if (filter === "read") return s.isRead;
    return true;
  });
  const unreadCount = items.filter((s) => !s.isRead).length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center">
          <i className="bi bi-inbox text-primary fs-5 me-2"></i>
          <h6 className="mb-0">
            Contact Submissions <span className="text-muted">({items.length})</span>
            {unreadCount > 0 && <span className="badge bg-danger ms-2">{unreadCount} unread</span>}
          </h6>
        </div>
        <div className="btn-group btn-group-sm">
          <button className={"btn " + (filter === "all" ? "btn-primary" : "btn-outline-secondary")} onClick={() => setFilter("all")}>All</button>
          <button className={"btn " + (filter === "unread" ? "btn-primary" : "btn-outline-secondary")} onClick={() => setFilter("unread")}>Unread</button>
          <button className={"btn " + (filter === "read" ? "btn-primary" : "btn-outline-secondary")} onClick={() => setFilter("read")}>Read</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
          <div className="text-muted mt-2 small">Loading submissions…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-5 bg-light rounded">
          <i className="bi bi-inbox text-muted" style={{ fontSize: "3rem" }}></i>
          <p className="text-muted mt-2 mb-0">
            {filter === "all" ? "No submissions yet" : `No ${filter} submissions`}
          </p>
          {filter === "all" && (
            <p className="text-muted small">When visitors fill out your contact form, their messages show up here.</p>
          )}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>When</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Message</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id} className={s.isRead ? "" : "fw-semibold"}>
                  <td className="small text-muted text-nowrap">
                    {!s.isRead && <span className="badge bg-danger me-1">New</span>}
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td>{s.name}</td>
                  <td className="small">
                    {s.email && <div><i className="bi bi-envelope me-1 text-muted"></i>{s.email}</div>}
                    {s.phone && <div><i className="bi bi-telephone me-1 text-muted"></i>{s.phone}</div>}
                  </td>
                  <td className="small" style={{ maxWidth: 300 }}>{s.message}</td>
                  <td className="text-end">
                    {!s.isRead && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => markRead(s)}
                        disabled={markingId === s._id}
                      >
                        {markingId === s._id ? (
                          <><span className="spinner-border spinner-border-sm me-1"></span>…</>
                        ) : (
                          <><i className="bi bi-check2 me-1"></i>Mark read</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}