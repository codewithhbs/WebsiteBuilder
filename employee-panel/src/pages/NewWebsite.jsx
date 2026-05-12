import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";

export default function NewWebsite() {
  const nav = useNavigate();
  const [clients, setClients] = useState([]);
  const [themes, setThemes] = useState([]);
  const [form, setForm] = useState({ clientId: "", themeId: "", slug: "", siteName: "" });
  const [slugStatus, setSlugStatus] = useState(null); // {available, reason}
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/employee/clients", { params: { limit: 200 } }).then((r) => setClients(r.data.items));
    api.get("/public/themes").then((r) => setThemes(r.data.items));
  }, []);

  // debounced slug check
  useEffect(() => {
    if (!form.slug) { setSlugStatus(null); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/employee/websites/check-slug", { params: { slug: form.slug } });
        setSlugStatus(data);
      } catch (_) {}
    }, 400);
    return () => clearTimeout(t);
  }, [form.slug]);

  const submit = async (e) => {
    e.preventDefault();
    if (slugStatus && !slugStatus.available) {
      toast.error("Slug not available");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/employee/websites", form);
      toast.success("Website created");
      nav(`/websites/${data.site._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="mb-3">Create New Website</h4>
      <div className="card p-4" style={{ maxWidth: 700 }}>
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label small">Client</label>
            <select className="form-select" required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">— Select client —</option>
              {clients.map((c) => <option key={c._id} value={c._id}>{c.name} {c.businessName && `(${c.businessName})`}</option>)}
            </select>
            {clients.length === 0 && <div className="form-text text-warning">No clients. Create one first.</div>}
          </div>

          <div className="mb-3">
            <label className="form-label small">Site Name (optional, defaults to client business)</label>
            <input className="form-control" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
          </div>

          <div className="mb-3">
            <label className="form-label small">Subdomain Slug</label>
            <div className="input-group">
              <input className="form-control" required placeholder="my-client" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <span className="input-group-text small">.yoursite.com</span>
            </div>
            {slugStatus && (
              <div className={"small mt-1 " + (slugStatus.available ? "text-success" : "text-danger")}>
                {slugStatus.available ? `✓ ${slugStatus.slug} is available` : `✗ ${slugStatus.reason || "taken"}`}
              </div>
            )}
            <div className="form-text">Letters, numbers, hyphens. 3–40 chars.</div>
          </div>

          <div className="mb-3">
            <label className="form-label small">Theme</label>
            <div className="row">
              {themes.map((t) => (
                <div key={t._id} className="col-md-6 mb-2">
                  <label className={"card p-2 d-flex flex-row gap-2 align-items-center " + (form.themeId === t._id ? "border-primary" : "")}>
                    <input type="radio" name="theme" checked={form.themeId === t._id} onChange={() => setForm({ ...form, themeId: t._id })} />
                    <div>
                      <div className="fw-bold small">{t.name}</div>
                      <code className="small text-muted">{t.themeKey}</code>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !form.clientId || !form.themeId}>
            {loading ? "Creating…" : "Create Website"}
          </button>
        </form>
      </div>
    </div>
  );
}
