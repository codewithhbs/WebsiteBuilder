import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import ImagePicker from "../../components/ImagePicker";
import ConfirmModal from "../../components/ConfirmModal";

const blank = { title: "", subtitle: "", ctaText: "", ctaLink: "", displayOrder: 0, isActive: true };

export default function HeroSection({ site, reload }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const slides = site.heroSlides || [];

  const openNew = () => {
    setForm({ ...blank, displayOrder: slides.length });
    setImgFile(null);
    setEditing({});
  };
  const openEdit = (s) => {
    setForm({ ...s });
    setImgFile(null);
    setEditing(s);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imgFile) fd.append("image", imgFile);
      if (editing._id) {
        await api.patch(`/employee/websites/${site._id}/hero/${editing._id}`, fd);
      } else {
        await api.post(`/employee/websites/${site._id}/hero`, fd);
      }
      toast.success(editing._id ? "Slide updated" : "Slide added");
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (s) => {
    setDeleting(true);
    try {
      await api.delete(`/employee/websites/${site._id}/hero/${s._id}`);
      toast.success("Slide deleted");
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setDeleting(false);
    }
  };

  const askDelete = (s) => {
    setConfirm({
      title: "Delete this slide?",
      message: `"${s.title || "Untitled slide"}" will be permanently removed.`,
      variant: "danger",
      confirmText: "Delete",
      onConfirm: () => doDelete(s),
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <i className="bi bi-images text-primary fs-5 me-2"></i>
          <h6 className="mb-0">Hero Slides <span className="text-muted">({slides.length})</span></h6>
        </div>
        <button className="btn btn-sm btn-primary" onClick={openNew}>
          <i className="bi bi-plus-lg me-1"></i>Add Slide
        </button>
      </div>

      {slides.length === 0 ? (
        <div className="text-center py-5 bg-light rounded">
          <i className="bi bi-images text-muted" style={{ fontSize: "3rem" }}></i>
          <p className="text-muted mt-2 mb-3">No hero slides yet</p>
          <button className="btn btn-sm btn-outline-primary" onClick={openNew}>
            <i className="bi bi-plus-lg me-1"></i>Add your first slide
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Order</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {slides.map((s) => (
                <tr key={s._id}>
                  <td>
                    {s.image?.url ? (
                      <img src={s.image.url} className="preview-img rounded" alt="" style={{ width: 60, height: 40, objectFit: "cover" }} />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <strong>{s.title || "Untitled"}</strong>
                    <div className="small text-muted">{s.subtitle}</div>
                  </td>
                  <td><span className="badge bg-light text-dark border">{s.displayOrder}</span></td>
                  <td>
                    <span className={"badge " + (s.isActive ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning")}>
                      <i className={"bi me-1 " + (s.isActive ? "bi-check-circle" : "bi-eye-slash")}></i>
                      {s.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(s)} title="Edit">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => askDelete(s)} title="Delete">
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => !saving && setEditing(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <form className="modal-content border-0 shadow" onSubmit={save}>
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-images me-2"></i>{editing._id ? "Edit" : "New"} Slide
                </h5>
                <button type="button" className="btn-close" onClick={() => setEditing(null)} disabled={saving}></button>
              </div>
              <div className="modal-body">
                <ImagePicker label="Slide Image" currentUrl={editing.image?.url} onChange={setImgFile} />

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold mb-0">Title</label>
                   
                  </div>
                  <input
                    className="form-control"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Welcome to our store"
                  />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-semibold mb-0">Subtitle</label>
                   
                  </div>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="A short supporting line"
                  />
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">CTA Text</label>
                    <input className="form-control" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Shop now" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">CTA Link</label>
                    <input className="form-control" value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} placeholder="/shop" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Display Order</label>
                    <input type="number" className="form-control" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
                  </div>
                  <div className="col-md-6 d-flex align-items-end">
                    <div className="form-check form-switch">
                      <input id="hsa" className="form-check-input" type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                      <label htmlFor="hsa" className="form-check-label small">Active (visible on site)</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
                  ) : (
                    <><i className="bi bi-check-lg me-1"></i>Save Slide</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal data={confirm} onClose={() => !deleting && setConfirm(null)} loading={deleting} />
    </div>
  );
}