import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";

const blank = { name: "", email: "", phone: "", businessName: "", notes: "" };

export default function Clients() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {_id...} = edit
  const [form, setForm] = useState(blank);

  const load = async () => {
    const { data } = await api.get("/employee/clients", { params: { q, limit: 100 } });
    setItems(data.items);
  };
  useEffect(() => { load(); }, [q]);

  const openNew = () => { setForm(blank); setEditing({}); };
  const openEdit = (c) => { setForm({ name: c.name, email: c.email, phone: c.phone, businessName: c.businessName, notes: c.notes }); setEditing(c); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing._id) {
        await api.patch(`/employee/clients/${editing._id}`, form);
        toast.success("Updated");
      } else {
        await api.post("/employee/clients", form);
        toast.success("Created");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const del = async (c) => {
    if (!confirm(`Deactivate "${c.name}"?`)) return;
    try {
      await api.delete(`/employee/clients/${c._id}`);
      toast.success("Deactivated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h4 className="mb-0">My Clients</h4>
        <button className="btn btn-primary" onClick={openNew}><i className="bi bi-plus-lg me-1"></i>New Client</button>
      </div>
      <div className="card p-3 mb-3"><input className="form-control" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="card p-3">
        <table className="table align-middle">
          <thead><tr><th>Name</th><th>Business</th><th>Contact</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan="5" className="empty-state">No clients yet</td></tr> :
              items.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td className="small">{c.businessName || "—"}</td>
                  <td className="small text-muted">{c.email}<br />{c.phone}</td>
                  <td className="small text-muted">{c.notes || "—"}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(c)}><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => del(c)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.4)" }} onClick={() => setEditing(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <form className="modal-content" onSubmit={save}>
              <div className="modal-header">
                <h5 className="modal-title">{editing._id ? "Edit Client" : "New Client"}</h5>
                <button type="button" className="btn-close" onClick={() => setEditing(null)}></button>
              </div>
              <div className="modal-body">
                {["name", "businessName", "email", "phone"].map((k) => (
                  <div className="mb-2" key={k}>
                    <label className="form-label small text-capitalize">{k}</label>
                    <input className="form-control" required={k === "name"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                  </div>
                ))}
                <div className="mb-2">
                  <label className="form-label small">Notes</label>
                  <textarea className="form-control" rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing._id ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
