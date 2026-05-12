import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";

const KEYS = ["hero", "about", "services", "reviews", "banners", "contact", "footer"];

export default function VisibilitySection({ site, reload }) {
  const [toggles, setToggles] = useState(() => {
    const t = {};
    KEYS.forEach((k) => { t[k] = site.sections?.[k] !== false; });
    return t;
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("payload", JSON.stringify(toggles));
      await api.patch(`/employee/websites/${site._id}/section/sections`, fd);
      toast.success("Saved");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h6 className="mb-3">Section Visibility</h6>
      <p className="small text-muted">Toggle which sections show on the live site.</p>
      {KEYS.map((k) => (
        <div className="form-check form-switch mb-2" key={k}>
          <input className="form-check-input" type="checkbox" id={k} checked={toggles[k]} onChange={(e) => setToggles({ ...toggles, [k]: e.target.checked })} />
          <label className="form-check-label text-capitalize" htmlFor={k}>{k}</label>
        </div>
      ))}
      <button className="btn btn-primary mt-3" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
    </div>
  );
}
