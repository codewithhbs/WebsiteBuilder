import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import ImagePicker from "../../components/ImagePicker";

const SCHEMAS = {
  about: {
    title: "About",
    icon: "bi-info-circle",
    image: "image",
    fields: [
      { name: "heading", label: "Heading", type: "text", placeholder: "About Us", ai: "about-heading" },
      { name: "shortText", label: "Short Description", type: "textarea", ai: "about-short", aiContextKeys: ["heading"] },
      { name: "longText", label: "Long Description", type: "textarea", rows: 6, ai: "about-long", aiContextKeys: ["heading", "shortText"] },
    ],
    list: { name: "highlights", label: "Highlights", help: "One per line — these show as bullet points on your site" },
  },
  contact: {
    title: "Contact",
    icon: "bi-envelope",
    fields: [
      { name: "heading", label: "Section Heading", type: "text", placeholder: "Get in Touch" },
      { name: "address", label: "Address", type: "textarea" },
      { name: "phone", label: "Phone", type: "text", placeholder: "+91 98765 43210" },
      { name: "email", label: "Email", type: "email", placeholder: "hello@example.com" },
      { name: "workingHours", label: "Working Hours", type: "text", placeholder: "Mon–Sat, 10am–7pm" },
      { name: "mapEmbedUrl", label: "Google Map Embed URL", type: "text", help: "Get this from Google Maps → Share → Embed a map" },
    ],
  },
  footer: {
    title: "Footer",
    icon: "bi-bottom",
    fields: [
      { name: "tagline", label: "Tagline", type: "text", ai: "footer-tagline" },
      { name: "copyrightText", label: "Copyright Text", type: "text", placeholder: "© 2025 My Business. All rights reserved." },
    ],
    socials: true,
  },
  seo: {
    title: "SEO",
    icon: "bi-search",
    image: "ogImage",
    fields: [
      { name: "title", label: "Page Title", type: "text", help: "Shows in browser tab & Google results (50–60 chars best)", ai: "seo-title" },
      { name: "description", label: "Meta Description", type: "textarea", help: "Short summary for Google (150–160 chars best)", ai: "seo-description", aiContextKeys: ["title"] },
    ],
    list: { name: "keywords", label: "Keywords", help: "One per line — words people might search to find you" },
  },
};

const SOCIAL_FIELDS = [
  { key: "facebook", icon: "bi-facebook" },
  { key: "instagram", icon: "bi-instagram" },
  { key: "twitter", icon: "bi-twitter-x" },
  { key: "linkedin", icon: "bi-linkedin" },
  { key: "youtube", icon: "bi-youtube" },
  { key: "whatsapp", icon: "bi-whatsapp" },
  { key: "website", icon: "bi-globe" },
];

export default function FlatSection({ site, section, reload }) {
  const schema = SCHEMAS[section];
  const initial = site[section] || {};

  const [form, setForm] = useState(() => {
    const o = {};
    schema.fields.forEach((f) => { o[f.name] = initial[f.name] || ""; });
    if (schema.list) o[schema.list.name] = (initial[schema.list.name] || []).join("\n");
    if (schema.socials) o.socialLinks = { ...SOCIAL_FIELDS.reduce((a, s) => ({ ...a, [s.key]: "" }), {}), ...(initial.socialLinks || {}) };
    return o;
  });
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {};
      schema.fields.forEach((f) => { payload[f.name] = form[f.name]; });
      if (schema.list) {
        payload[schema.list.name] = form[schema.list.name].split("\n").map((s) => s.trim()).filter(Boolean);
      }
      if (schema.socials) payload.socialLinks = form.socialLinks;

      const fd = new FormData();
      fd.append("payload", JSON.stringify(payload));
      if (imgFile && schema.image) fd.append(schema.image, imgFile);
      await api.patch(`/employee/websites/${site._id}/section/${section}`, fd);
      toast.success(`${schema.title} saved`);
      setImgFile(null);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const aiContext = (keys = []) => {
    const ctx = { siteName: site.basicInfo?.siteName, tagline: site.basicInfo?.tagline, section };
    keys.forEach((k) => { ctx[k] = form[k]; });
    return ctx;
  };

  const applyHighlightsSuggestion = async () => {
    // Special helper: AI-generate bullet highlights
    const fakeApply = (text) => setForm((f) => ({ ...f, [schema.list.name]: text }));
    return fakeApply;
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <i className={`bi ${schema.icon} text-primary fs-5 me-2`}></i>
        <h6 className="mb-0">{schema.title}</h6>
      </div>

      {schema.image && (
        <div className="mb-3">
          <ImagePicker label="Image" currentUrl={initial[schema.image]?.url} onChange={setImgFile} />
        </div>
      )}

      {schema.fields.map((f) => (
        <div className="mb-3" key={f.name}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label small fw-semibold mb-0">{f.label}</label>
           
          </div>
          {f.type === "textarea" ? (
            <textarea
              className="form-control"
              rows={f.rows || 3}
              value={form[f.name]}
              onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
              placeholder={f.placeholder}
            />
          ) : (
            <input
              type={f.type}
              className="form-control"
              value={form[f.name]}
              onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
              placeholder={f.placeholder}
            />
          )}
          {f.help && <div className="form-text">{f.help}</div>}
        </div>
      ))}

      {schema.list && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label small fw-semibold mb-0">{schema.list.label}</label>
            
          </div>
          <textarea
            className="form-control"
            rows="4"
            value={form[schema.list.name]}
            onChange={(e) => setForm({ ...form, [schema.list.name]: e.target.value })}
          />
          {schema.list.help && <div className="form-text">{schema.list.help}</div>}
        </div>
      )}

      {schema.socials && (
        <>
          <hr className="my-4" />
          <h6 className="mb-3"><i className="bi bi-share me-2"></i>Social Links</h6>
          <div className="row g-3">
            {SOCIAL_FIELDS.map((s) => (
              <div className="col-md-6" key={s.key}>
                <label className="form-label small fw-semibold text-capitalize">
                  <i className={`bi ${s.icon} me-1`}></i>{s.key}
                </label>
                <input
                  className="form-control"
                  value={form.socialLinks[s.key]}
                  onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, [s.key]: e.target.value } })}
                  placeholder={`https://${s.key}.com/yourpage`}
                />
              </div>
            ))}
          </div>
        </>
      )}

      <button className="btn btn-primary mt-3" onClick={save} disabled={saving}>
        {saving ? (
          <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</>
        ) : (
          <><i className="bi bi-check-lg me-1"></i>Save {schema.title}</>
        )}
      </button>
    </div>
  );
}