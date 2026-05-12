import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import ImagePicker from "../../components/ImagePicker";
import ConfirmModal from "../../components/ConfirmModal";

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
  const [confirm, setConfirm] = useState(null);
  const [themeBusy, setThemeBusy] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("payload", JSON.stringify(form));
      if (logoFile) fd.append("logo", logoFile);
      if (faviconFile) fd.append("favicon", faviconFile);
      await api.patch(`/employee/websites/${site._id}/section/basicInfo`, fd);
      toast.success("Basic info saved");
      setLogoFile(null);
      setFaviconFile(null);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const doChangeTheme = async (themeId) => {
    setThemeBusy(true);
    try {
      await api.patch(`/employee/websites/${site._id}/theme`, { themeId });
      toast.success("Theme changed");
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setThemeBusy(false);
    }
  };

  const askChangeTheme = (theme) => {
    setConfirm({
      title: `Switch to "${theme.name}"?`,
      message: "Your content stays exactly the same — only the layout & styling will change.",
      variant: "primary",
      icon: "bi-palette-fill",
      confirmText: "Switch theme",
      onConfirm: () => doChangeTheme(theme._id),
    });
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <i className="bi bi-gear-fill text-primary fs-5 me-2"></i>
        <h6 className="mb-0">Site Info</h6>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Site Name</label>
          <input
            className="form-control"
            value={form.siteName}
            onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            placeholder="My Awesome Business"
          />
        </div>
        <div className="col-md-6">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label small fw-semibold mb-0">Tagline</label>
       
          </div>
          <input
            className="form-control"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            placeholder="A short, catchy line about your business"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Primary Color</label>
          <div className="input-group">
            <input
              type="color"
              className="form-control form-control-color"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              style={{ maxWidth: 60 }}
            />
            <input
              className="form-control"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            />
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Secondary Color</label>
          <div className="input-group">
            <input
              type="color"
              className="form-control form-control-color"
              value={form.secondaryColor}
              onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
              style={{ maxWidth: 60 }}
            />
            <input
              className="form-control"
              value={form.secondaryColor}
              onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="row g-3 mt-3">
        <div className="col-md-6">
          <ImagePicker label="Logo" currentUrl={site.basicInfo?.logo?.url} onChange={setLogoFile} name="logo" />
        </div>
        <div className="col-md-6">
          <ImagePicker label="Favicon" currentUrl={site.basicInfo?.favicon?.url} onChange={setFaviconFile} name="favicon" />
        </div>
      </div>

      <button className="btn btn-primary mt-3" onClick={save} disabled={saving}>
        {saving ? (
          <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
        ) : (
          <><i className="bi bi-check-lg me-1"></i>Save Basic Info</>
        )}
      </button>

      <hr className="my-4" />

      <div className="d-flex align-items-center mb-3">
        <i className="bi bi-palette-fill text-primary fs-5 me-2"></i>
        <h6 className="mb-0">Theme</h6>
      </div>
      <p className="text-muted small">Choose how your site looks. Switching theme keeps all your content intact.</p>

      <div className="row g-3">
        {themes.map((t) => {
          const active = site.themeKey === t.themeKey;
          return (
            <div key={t._id} className="col-md-4">
              <div className={"card h-100 " + (active ? "border-primary shadow-sm" : "border")}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{t.name}</div>
                      <code className="small text-muted">{t.themeKey}</code>
                    </div>
                    {active && <i className="bi bi-check-circle-fill text-primary fs-5"></i>}
                  </div>
                  {active ? (
                    <span className="badge bg-primary mt-3">Active theme</span>
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-primary mt-3 w-100"
                      onClick={() => askChangeTheme(t)}
                      disabled={themeBusy}
                    >
                      Switch to this
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal data={confirm} onClose={() => !themeBusy && setConfirm(null)} loading={themeBusy} />
    </div>
  );
}