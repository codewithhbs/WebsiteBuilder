import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";

const KEYS = [
  { key: "hero", label: "Hero Slides", icon: "bi-images", desc: "Banner carousel at the top of the homepage" },
  { key: "about", label: "About", icon: "bi-info-circle", desc: "Your story, mission, and highlights" },
  { key: "services", label: "Services", icon: "bi-grid", desc: "List of what you offer" },
  { key: "reviews", label: "Reviews", icon: "bi-star", desc: "Customer testimonials" },
  { key: "banners", label: "Banners", icon: "bi-megaphone", desc: "Promotional banners" },
  { key: "contact", label: "Contact", icon: "bi-envelope", desc: "Contact info, address, and map" },
  { key: "footer", label: "Footer", icon: "bi-bottom", desc: "Bottom of every page" },
];

export default function VisibilitySection({ site, reload }) {
  const [toggles, setToggles] = useState(() => {
    const t = {};
    KEYS.forEach(({ key }) => { t[key] = site.sections?.[key] !== false; });
    return t;
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("payload", JSON.stringify(toggles));
      await api.patch(`/employee/websites/${site._id}/section/sections`, fd);
      toast.success("Visibility saved");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const visibleCount = Object.values(toggles).filter(Boolean).length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <i className="bi bi-eye text-primary fs-5 me-2"></i>
          <h6 className="mb-0">Section Visibility</h6>
        </div>
        <span className="badge bg-light text-dark border">
          {visibleCount} of {KEYS.length} visible
        </span>
      </div>
      <p className="small text-muted">Choose which sections appear on your live site. Hidden sections keep their content — just not shown to visitors.</p>

      <div className="list-group">
        {KEYS.map(({ key, label, icon, desc }) => (
          <label className="list-group-item d-flex align-items-center" key={key} style={{ cursor: "pointer" }}>
            <i className={`bi ${icon} text-primary fs-5 me-3`}></i>
            <div className="flex-grow-1">
              <div className="fw-semibold">{label}</div>
              <div className="small text-muted">{desc}</div>
            </div>
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input"
                type="checkbox"
                checked={toggles[key]}
                onChange={(e) => setToggles({ ...toggles, [key]: e.target.checked })}
                style={{ cursor: "pointer" }}
              />
            </div>
          </label>
        ))}
      </div>

      <button className="btn btn-primary mt-3" onClick={save} disabled={saving}>
        {saving ? (
          <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
        ) : (
          <><i className="bi bi-check-lg me-1"></i>Save Visibility</>
        )}
      </button>
    </div>
  );
}