import { useEffect, useState } from "react";
import api from "../api/client";

export default function Clients() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await api.get("/employee/clients", { params: { q, limit: 100 } });
    setItems(data.items);
  };
  useEffect(() => { load(); }, [q]);

  return (
    <div>
      <h4 className="mb-3">Clients</h4>
      <div className="card p-3 mb-3">
        <input className="form-control" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card p-3">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr><th>Name</th><th>Business</th><th>Contact</th><th>Created By</th><th>Created</th></tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="5" className="empty-state">No clients yet</td></tr>
              ) : items.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td className="small">{c.businessName || "—"}</td>
                  <td className="small text-muted">{c.email || "—"}<br />{c.phone || ""}</td>
                  <td className="small">{c.createdByEmployee?.name || "—"}</td>
                  <td className="small text-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
