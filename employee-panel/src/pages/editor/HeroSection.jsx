import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import ImagePicker from "../../components/ImagePicker";

const blank = { title: "", subtitle: "", ctaText: "", ctaLink: "", displayOrder: 0, isActive: true };

export default function HeroSection({ site, reload }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [imgFile, setImgFile] = useState(null);

  const openNew = () => { setForm({ ...blank, displayOrder: site.heroSlides.length }); setImgFile(null); setEditing({}); };
  const openEdit = (s) => { setForm({ ...s }); setImgFile(null); setEditing(s); };

  const save = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imgFile) fd.append("image", imgFile);
      if (editing._id) {
        await api.patch(`/employee/websites/${site._id}/hero/${editing._id}`, fd);
      } else {
        await api.post(`/employee/websites/${site._id}/hero`, fd);
      }
      toast.success("Saved");
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const del = async (s) => {
    if (!confirm("Delete this slide?")) return;
    try {
      await api.delete(`/employee/websites/${site._id}/hero/${s._id}`);
      toast.success("Deleted");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h6 className="mb-0">Hero Slides ({site.heroSlides.length})</h6>
        <button className="btn btn-sm btn-primary" onClick={openNew}><i className="bi bi-plus-lg me-1"></i>Add Slide</button>
      </div>
      {site.heroSlides.length === 0 ? <div className="empty-state">No slides yet</div> : (
        <table className="table align-middle">
          <thead><tr><th>Image</th><th>Title</th><th>Order</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {site.heroSlides.map((s) => (
              <tr key={s._id}>
                <td>{s.image?.url ? <img src={s.image.url} className="preview-img" /> : "—"}</td>
                <td><strong>{s.title}</strong><div className="small text-muted">{s.subtitle}</div></td>
                <td>{s.displayOrder}</td>
                <td><span className={"badge " + (s.isActive ? "badge-soft-success" : "badge-soft-warning")}>{s.isActive ? "Active" : "Hidden"}</span></td>
                <td>
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(s)}><i className="bi bi-pencil"></i></button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => del(s)}><i className="bi bi-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.4)" }} onClick={() => setEditing(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <form className="modal-content" onSubmit={save}>
              <div className="modal-header"><h5 className="modal-title">{editing._id ? "Edit" : "New"} Slide</h5><button type="button" className="btn-close" onClick={() => setEditing(null)}></button></div>
              <div className="modal-body">
                <ImagePicker label="Slide Image" currentUrl={editing.image?.url} onChange={setImgFile} />
                <div className="mb-2"><label className="form-label small">Title</label><input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="mb-2"><label className="form-label small">Subtitle</label><textarea className="form-control" rows="2" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
                <div className="row">
                  <div className="col-6"><label className="form-label small">CTA Text</label><input className="form-control" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} /></div>
                  <div className="col-6"><label className="form-label small">CTA Link</label><input className="form-control" value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} /></div>
                </div>
                <div className="row mt-2">
                  <div className="col-6"><label className="form-label small">Order</label><input type="number" className="form-control" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></div>
                  <div className="col-6 d-flex align-items-end"><div className="form-check"><input id="hsa" className="form-check-input" type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><label htmlFor="hsa" className="form-check-label small">Active</label></div></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
