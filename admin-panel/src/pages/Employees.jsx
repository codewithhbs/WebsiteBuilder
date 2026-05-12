import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";

export default function Employees() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });

  const load = async () => {
    const { data } = await api.get("/admin/employees", { params: { q } });
    setItems(data.items);
  };

  useEffect(() => { load(); }, [q]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/employees", form);
      toast.success("Employee created");
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", phone: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const toggleActive = async (e) => {
    try {
      await api.patch(`/admin/employees/${e._id}`, { isActive: !e.isActive });
      toast.success(e.isActive ? "Deactivated" : "Activated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Employees</h4>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <i className="bi bi-plus-lg me-1"></i> New Employee
        </button>
      </div>

      <div className="card p-3 mb-3">
        <input className="form-control" placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card p-3">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Sites</th><th>Live</th><th>Status</th><th>Joined</th><th></th></tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">No employees yet</td></tr>
              ) : items.map((e) => (
                <tr key={e._id}>
                  <td><Link to={`/employees/${e._id}`}>{e.name}</Link></td>
                  <td className="small text-muted">{e.email}</td>
                  <td>{e.websiteCount}</td>
                  <td><span className="badge badge-soft-success">{e.liveCount}</span></td>
                  <td>
                    <span className={"badge " + (e.isActive ? "badge-soft-success" : "badge-soft-danger")}>
                      {e.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="small text-muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleActive(e)}>
                      {e.isActive ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.4)" }} onClick={() => setShowCreate(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <form className="modal-content" onSubmit={create}>
              <div className="modal-header">
                <h5 className="modal-title">Create Employee</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreate(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2"><label className="form-label small">Name</label><input required className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="mb-2"><label className="form-label small">Email</label><input required type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="mb-2"><label className="form-label small">Password</label><input required minLength={6} type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                <div className="mb-2"><label className="form-label small">Phone</label><input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
