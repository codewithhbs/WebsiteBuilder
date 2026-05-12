import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import ImagePicker from "../../components/ImagePicker";

// schemas drive form fields per section
const SCHEMAS = {
  services: {
    label: "Services",
    imageField: "image",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "icon", label: "Icon (bi-icon class or URL)", type: "text", help: "e.g. bi-car-front" },
      { name: "price", label: "Price label", type: "text", help: "e.g. Starting ₹999" },
      { name: "displayOrder", label: "Order", type: "number" },
      { name: "isActive", label: "Active", type: "checkbox", default: true },
    ],
    cols: (item) => [
      item.image?.url ? <img src={item.image.url} className="preview-img" /> : <i className="bi bi-image text-muted"></i>,
      <><strong>{item.title}</strong><div className="small text-muted">{item.description?.slice(0, 60)}</div></>,
      item.price,
      <span className={"badge " + (item.isActive ? "badge-soft-success" : "badge-soft-warning")}>{item.isActive ? "Active" : "Hidden"}</span>,
    ],
    headers: ["Image", "Service", "Price", "Status"],
  },
  reviews: {
    label: "Reviews",
    imageField: "avatar",
    fields: [
      { name: "name", label: "Reviewer Name", type: "text", required: true },
      { name: "designation", label: "Designation", type: "text" },
      { name: "rating", label: "Rating (1-5)", type: "number", min: 1, max: 5, default: 5 },
      { name: "text", label: "Review Text", type: "textarea" },
      { name: "displayOrder", label: "Order", type: "number" },
      { name: "isApproved", label: "Approved (visible)", type: "checkbox", default: true },
    ],
    cols: (item) => [
      item.avatar?.url ? <img src={item.avatar.url} className="preview-img" style={{ borderRadius: "50%" }} /> : <i className="bi bi-person-circle fs-3 text-muted"></i>,
      <><strong>{item.name}</strong><div className="small text-muted">{item.designation}</div></>,
      "★".repeat(item.rating || 0),
      <span className={"badge " + (item.isApproved ? "badge-soft-success" : "badge-soft-warning")}>{item.isApproved ? "Visible" : "Hidden"}</span>,
    ],
    headers: ["Photo", "Reviewer", "Rating", "Status"],
  },
  banners: {
    label: "Banners",
    imageField: "image",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "text" },
      { name: "ctaText", label: "CTA Text", type: "text" },
      { name: "ctaLink", label: "CTA Link", type: "text" },
      { name: "position", label: "Position", type: "select", options: ["top", "middle", "bottom", "popup"], default: "middle" },
      { name: "displayOrder", label: "Order", type: "number" },
      { name: "isActive", label: "Active", type: "checkbox", default: true },
    ],
    cols: (item) => [
      item.image?.url ? <img src={item.image.url} className="preview-img" /> : <i className="bi bi-image text-muted"></i>,
      <><strong>{item.title}</strong><div className="small text-muted">{item.subtitle}</div></>,
      <span className="badge bg-light text-dark">{item.position}</span>,
      <span className={"badge " + (item.isActive ? "badge-soft-success" : "badge-soft-warning")}>{item.isActive ? "Active" : "Hidden"}</span>,
    ],
    headers: ["Image", "Banner", "Position", "Status"],
  },
};

const buildBlank = (schema) => {
  const o = {};
  schema.fields.forEach((f) => {
    if (f.default !== undefined) o[f.name] = f.default;
    else if (f.type === "number") o[f.name] = 0;
    else if (f.type === "checkbox") o[f.name] = false;
    else o[f.name] = "";
  });
  return o;
};

export default function ArraySection({ site, section, reload }) {
  const schema = SCHEMAS[section];
  const items = site[section] || [];
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(buildBlank(schema));
  const [imgFile, setImgFile] = useState(null);

  const openNew = () => { setForm({ ...buildBlank(schema), displayOrder: items.length }); setImgFile(null); setEditing({}); };
  const openEdit = (it) => { setForm({ ...buildBlank(schema), ...it }); setImgFile(null); setEditing(it); };

  const save = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imgFile) fd.append("image", imgFile);
      if (editing._id) {
        await api.patch(`/employee/websites/${site._id}/${section}/${editing._id}`, fd);
      } else {
        await api.post(`/employee/websites/${site._id}/${section}`, fd);
      }
      toast.success("Saved");
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const del = async (it) => {
    if (!confirm("Delete?")) return;
    try {
      await api.delete(`/employee/websites/${site._id}/${section}/${it._id}`);
      toast.success("Deleted");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h6 className="mb-0">{schema.label} ({items.length})</h6>
        <button className="btn btn-sm btn-primary" onClick={openNew}><i className="bi bi-plus-lg me-1"></i>Add {schema.label.replace(/s$/, "")}</button>
      </div>

      {items.length === 0 ? <div className="empty-state">No {schema.label.toLowerCase()} yet</div> : (
        <table className="table align-middle">
          <thead><tr>{schema.headers.map((h) => <th key={h}>{h}</th>)}<th></th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                {schema.cols(it).map((c, i) => <td key={i}>{c}</td>)}
                <td>
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(it)}><i className="bi bi-pencil"></i></button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => del(it)}><i className="bi bi-trash"></i></button>
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
              <div className="modal-header"><h5 className="modal-title">{editing._id ? "Edit" : "New"} {schema.label.replace(/s$/, "")}</h5><button type="button" className="btn-close" onClick={() => setEditing(null)}></button></div>
              <div className="modal-body">
                <ImagePicker label="Image" currentUrl={editing[schema.imageField]?.url} onChange={setImgFile} />
                {schema.fields.map((f) => (
                  <div className="mb-2" key={f.name}>
                    {f.type === "checkbox" ? (
                      <div className="form-check">
                        <input id={f.name} className="form-check-input" type="checkbox" checked={!!form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} />
                        <label htmlFor={f.name} className="form-check-label small">{f.label}</label>
                      </div>
                    ) : (
                      <>
                        <label className="form-label small">{f.label}{f.required && " *"}</label>
                        {f.type === "textarea" ? (
                          <textarea className="form-control" rows="3" value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} required={f.required} />
                        ) : f.type === "select" ? (
                          <select className="form-select" value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input className="form-control" type={f.type} min={f.min} max={f.max} value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })} required={f.required} />
                        )}
                        {f.help && <div className="form-text">{f.help}</div>}
                      </>
                    )}
                  </div>
                ))}
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
