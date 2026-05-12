import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";

export default function SubmissionsSection({ site }) {
  const [items, setItems] = useState([]);

  const load = async () => {
    const { data } = await api.get(`/employee/websites/${site._id}/submissions`);
    setItems(data.items);
  };
  useEffect(() => { load(); }, [site._id]);

  const markRead = async (s) => {
    try {
      await api.patch(`/employee/websites/${site._id}/submissions/${s._id}/read`);
      toast.success("Marked read");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <h6 className="mb-3">Contact Submissions ({items.length})</h6>
      {items.length === 0 ? <div className="empty-state">No submissions yet</div> : (
        <table className="table align-middle">
          <thead><tr><th>When</th><th>Name</th><th>Contact</th><th>Message</th><th></th></tr></thead>
          <tbody>
            {items.map((s) => (
              <tr key={s._id} className={s.isRead ? "" : "table-warning"}>
                <td className="small text-muted">{new Date(s.createdAt).toLocaleString()}</td>
                <td>{s.name}</td>
                <td className="small">{s.email}<br />{s.phone}</td>
                <td className="small">{s.message}</td>
                <td>{!s.isRead && <button className="btn btn-sm btn-outline-primary" onClick={() => markRead(s)}>Mark read</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
