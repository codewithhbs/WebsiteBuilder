import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import ImagePicker from "../../components/ImagePicker";

const SCHEMAS = {
  about: {
    title: "About",
    image: "image",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "shortText", label: "Short Description", type: "textarea" },
      { name: "longText", label: "Long Description", type: "textarea", rows: 6 },
    ],
    list: { name: "highlights", label: "Highlights (one per line)" },
  },
  contact: {
    title: "Contact",
    fields: [
      { name: "heading", label: "Section Heading", type: "text" },
      { name: "address", label: "Address", type: "textarea" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "workingHours", label: "Working Hours", type: "text" },
      { name: "mapEmbedUrl", label: "Google Map Embed URL", type: "text" },
    ],
  },
  footer: {
    title: "Footer",
    fields: [
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "copyrightText", label: "Copyright Text", type: "text" },
    ],
    socials: true,
  },
  seo: {
    title: "SEO",
    image: "ogImage",
    fields: [
      { name: "title", label: "Page Title", type: "text" },
      { name: "description", label: "Meta Description", type: "textarea" },
    ],
    list: { name: "keywords", label: "Keywords (one per line)" },
  },
};

const SOCIAL_FIELDS = ["facebook", "instagram", "twitter", "linkedin", "youtube", "whatsapp", "website"];

export default function FlatSection({ site, section, reload }) {
  const schema = SCHEMAS[section];
  const initial = site[section] || {};

  const [form, setForm] = useState(() => {
    const o = {};
    schema.fields.forEach((f) => { o[f.name] = initial[f.name] || ""; });
    if (schema.list) o[schema.list.name] = (initial[schema.list.name] || []).join("\n");
    if (schema.socials) o.socialLinks = { ...SOCIAL_FIELDS.reduce((a, k) => ({ ...a, [k]: "" }), {}), ...(initial.socialLinks || {}) };
    return o;
  });
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      // build payload
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
      <h6 className="mb-3">{schema.title}</h6>
      {schema.image && <ImagePicker label="Image" currentUrl={initial[schema.image]?.url} onChange={setImgFile} />}
      {schema.fields.map((f) => (
        <div className="mb-3" key={f.name}>
          <label className="form-label small">{f.label}</label>
          {f.type === "textarea" ? (
            <textarea className="form-control" rows={f.rows || 3} value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
          ) : (
            <input type={f.type} className="form-control" value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
          )}
        </div>
      ))}
      {schema.list && (
        <div className="mb-3">
          <label className="form-label small">{schema.list.label}</label>
          <textarea className="form-control" rows="4" value={form[schema.list.name]} onChange={(e) => setForm({ ...form, [schema.list.name]: e.target.value })} />
        </div>
      )}
      {schema.socials && (
        <>
          <h6 className="mt-4 mb-2">Social Links</h6>
          <div className="row">
            {SOCIAL_FIELDS.map((k) => (
              <div className="col-md-6 mb-2" key={k}>
                <label className="form-label small text-capitalize">{k}</label>
                <input className="form-control" value={form.socialLinks[k]} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, [k]: e.target.value } })} />
              </div>
            ))}
          </div>
        </>
      )}
      <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
    </div>
  );
}
