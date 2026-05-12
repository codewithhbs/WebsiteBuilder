import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import ImagePicker from "../../components/ImagePicker";

export default function BasicSection({ site, reload, themes }) {
  const [form, setForm] = useState({
    siteName: site.basicInfo?.siteName || "",
    tagline: site.basicInfo?.tagline || "",
    primaryColor: site.basicInfo?.primaryColor || "#0d6efd",
    secondaryColor: site.basicInfo?.secondaryColor || "#6c757d",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("payload", JSON.stringify(form));
      if (logoFile) fd.append("logo", logoFile);
      if (faviconFile) fd.append("favicon", faviconFile);
      await api.patch(`/employee/websites/${site._id}/section/basicInfo`, fd);
      toast.success("Saved");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const changeTheme = async (themeId) => {
    if (!confirm("Change theme? Site content stays, only layout changes.")) return;
    try {
      await api.patch(`/employee/websites/${site._id}/theme`, { themeId });
      toast.success("Theme changed");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <h6 className="mb-3">Site Info</h6>
      <div className="row">
        <div className="col-md-6"><label className="form-label small">Site Name</label><input className="form-control mb-3" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label small">Tagline</label><input className="form-control mb-3" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label small">Primary Color</label><input type="color" className="form-control form-control-color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div>
        <div className="col-md-6"><label className="form-label small">Secondary Color</label><input type="color" className="form-control form-control-color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} /></div>
      </div>
      <ImagePicker label="Logo" currentUrl={site.basicInfo?.logo?.url} onChange={setLogoFile} name="logo" />
      <ImagePicker label="Favicon" currentUrl={site.basicInfo?.favicon?.url} onChange={setFaviconFile} name="favicon" />
      <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Basic Info"}</button>

      <hr className="my-4" />
      <h6 className="mb-3">Theme</h6>
      <div className="row">
        {themes.map((t) => (
          <div key={t._id} className="col-md-4 mb-2">
            <div className={"card p-3 " + (site.themeKey === t.themeKey ? "border-primary" : "")}>
              <div className="fw-bold">{t.name}</div>
              <code className="small text-muted">{t.themeKey}</code>
              {site.themeKey === t.themeKey ? (
                <span className="badge bg-primary mt-2">Active</span>
              ) : (
                <button className="btn btn-sm btn-outline-primary mt-2" onClick={() => changeTheme(t._id)}>Switch to this</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
