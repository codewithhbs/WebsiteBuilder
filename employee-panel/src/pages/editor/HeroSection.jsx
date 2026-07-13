import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import ImagePicker from "../../components/ImagePicker";
import ConfirmModal from "../../components/ConfirmModal";

const blank = { title: "", subtitle: "", ctaText: "", ctaLink: "", displayOrder: 0, isActive: true };

const HERO_LAYOUTS = [
  { value: "form",      label: "Callback Form — text left, form right (default)" },
  { value: "imageForm", label: "Image + Form — bg photo, content left, form right" },
  { value: "centered",  label: "Centered — text in the middle, no form" },
  { value: "split",     label: "Split — text left, image card right (no form)" },
  { value: "imageBg",   label: "Image Background — full photo + overlay" },
  { value: "slider",    label: "Slider — rotating background images + overlay" },
  { value: "banner",    label: "Banner — pure auto-rotating images, no text" },
  { value: "gradient",  label: "Gradient — theme color background" },
];

export default function HeroSection({ site, reload }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // hero appearance settings (website-level)
  const [hs, setHs] = useState({
    layout: "form",
    overlayColor: "primary",
    overlayStyle: "gradient",
    overlayOpacity: 60,
    slideInterval: 5000,
    showForm: true,
    ...(site.heroSettings || {}),
  });
  const [savingHs, setSavingHs] = useState(false);

  const slides = site.heroSlides || [];

  const saveHeroSettings = async () => {
    setSavingHs(true);
    try {
      await api.patch(`/employee/websites/${site._id}/section/heroSettings`, hs);
      toast.success("Hero style saved");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save hero style");
    } finally {
      setSavingHs(false);
    }
  };

  const usesOverlay = ["imageBg", "imageForm", "slider", "banner"].includes(hs.layout);
  const usesForm = ["form", "imageBg", "imageForm", "slider"].includes(hs.layout);
  const isBanner = hs.layout === "banner";

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
      {/* ── HERO STYLE SETTINGS ── */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <i className="bi bi-sliders text-primary fs-5 me-2"></i>
            <h6 className="mb-0">Hero Style</h6>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Layout</label>
              <select className="form-select" value={hs.layout} onChange={(e) => setHs({ ...hs, layout: e.target.value })}>
                {HERO_LAYOUTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="form-text small">
                {hs.layout === "slider" && "Add 2+ slide images below — they rotate automatically behind the text."}
                {hs.layout === "imageBg" && "The first slide image becomes the full background. Add more to rotate."}
                {hs.layout === "imageForm" && "Background photo with content on the left and the callback form on the right. Add 2+ images to rotate."}
                {hs.layout === "banner" && "Pure image carousel — no text or form. Add 2+ slide images; they auto-rotate. Great as a top banner."}
                {hs.layout === "split" && "Content on the left, the first slide image shown as a card on the right. No form."}
                {hs.layout === "gradient" && "Uses your theme's primary color — no image needed."}
                {hs.layout === "centered" && "Clean centered text, no callback form."}
                {hs.layout === "form" && "Classic layout with the callback form on the right."}
              </div>
            </div>

            {usesForm && (
              <div className="col-md-6 d-flex align-items-start pt-4">
                <div className="form-check form-switch">
                  <input id="hsShowForm" className="form-check-input" type="checkbox"
                    checked={hs.showForm !== false}
                    onChange={(e) => setHs({ ...hs, showForm: e.target.checked })} />
                  <label htmlFor="hsShowForm" className="form-check-label small">Show callback form on the hero</label>
                </div>
              </div>
            )}
          </div>

          {isBanner && (
            <div className="alert alert-info small mt-3 mb-0">
              <i className="bi bi-info-circle me-1"></i>
              Banner mode sirf images dikhata hai (koi text/form nahi). Neeche "Hero Slides" me 2+ images add karo — wo auto-rotate karengi. Overlay optional hai.
            </div>
          )}

          {usesOverlay && (
            <div className="border rounded-3 p-3 mt-3" style={{ background: "#f8fafc" }}>
              <div className="small fw-bold text-uppercase text-muted mb-2">
                <i className="bi bi-layers-half me-1"></i>Overlay (text readability)
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Overlay Color</label>
                  <select className="form-select form-select-sm" value={hs.overlayColor} onChange={(e) => setHs({ ...hs, overlayColor: e.target.value })}>
                    <option value="primary">Theme color (recommended)</option>
                    <option value="dark">Dark / black</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Overlay Style</label>
                  <select className="form-select form-select-sm" value={hs.overlayStyle} onChange={(e) => setHs({ ...hs, overlayStyle: e.target.value })}>
                    <option value="gradient">Gradient (diagonal fade)</option>
                    <option value="solid">Solid tint</option>
                    <option value="none">No overlay</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Overlay Darkness — {hs.overlayOpacity}%</label>
                  <input type="range" className="form-range" min="0" max="100" step="5"
                    value={hs.overlayOpacity}
                    onChange={(e) => setHs({ ...hs, overlayOpacity: Number(e.target.value) })} />
                </div>
              </div>
              <div className="small text-muted">Overlay ka color theme ke primary color se match hota hai. Darkness badhao agar text photo pe clearly na dikhe.</div>
            </div>
          )}

          {hs.layout === "slider" && (
            <div className="mt-3" style={{ maxWidth: 260 }}>
              <label className="form-label small fw-semibold">Slide interval (ms)</label>
              <input type="number" className="form-control form-control-sm" value={hs.slideInterval}
                onChange={(e) => setHs({ ...hs, slideInterval: Number(e.target.value) || 5000 })} />
            </div>
          )}

          <div className="mt-3">
            <button className="btn btn-sm btn-primary" onClick={saveHeroSettings} disabled={savingHs}>
              {savingHs ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</> : <><i className="bi bi-check-lg me-1"></i>Save Hero Style</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO SLIDES ── */}
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