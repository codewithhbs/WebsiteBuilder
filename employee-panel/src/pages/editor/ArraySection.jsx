import { useState } from "react"
import toast from "react-hot-toast"
import api from "../../api/client"
import ImagePicker from "../../components/ImagePicker"
import ConfirmModal from "../../components/ConfirmModal"

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SCHEMAS = {
  services: {
    label: "Services",
    singularLabel: "Service",
    imageField: "image",
    emptyIcon: "bi-tools",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "icon",
        label: "Icon",
        type: "text",
        help: "Bootstrap icon class, e.g. bi-car-front"
      },
      {
        name: "price",
        label: "Price Label",
        type: "text",
        help: "e.g. Starting ₹999"
      },
      { name: "displayOrder", label: "Display Order", type: "number" },
      { name: "isActive", label: "Active", type: "checkbox", default: true }
    ],
    cols: item => [
      {
        key: "image",
        content: item.image?.url ? (
          <img src={item.image.url} className="as-thumb" alt="" />
        ) : (
          <span className="as-thumb-placeholder">
            <i className="bi bi-image" />
          </span>
        )
      },
      {
        key: "info",
        content: (
          <div>
            <div className="as-row-title">{item.title}</div>
            {item.description && (
              <div className="as-row-sub">
                {item.description.slice(0, 70)}
                {item.description.length > 70 ? "…" : ""}
              </div>
            )}
          </div>
        )
      },
      {
        key: "price",
        content: item.price ? (
          <span className="as-chip as-chip-blue">{item.price}</span>
        ) : (
          <span className="as-muted">—</span>
        )
      },
      {
        key: "status",
        content: (
          <span
            className={`as-badge ${
              item.isActive ? "as-badge-green" : "as-badge-amber"
            }`}
          >
            <i
              className={`bi ${
                item.isActive ? "bi-check-circle-fill" : "bi-eye-slash-fill"
              } me-1`}
            />
            {item.isActive ? "Active" : "Hidden"}
          </span>
        )
      }
    ],
    headers: ["Image", "Service", "Price", "Status"]
  },

  reviews: {
    label: "Reviews",
    singularLabel: "Review",
    imageField: "avatar",
    emptyIcon: "bi-chat-square-quote",
    fields: [
      { name: "name", label: "Reviewer Name", type: "text", required: true },
      { name: "designation", label: "Designation", type: "text" },
      {
        name: "rating",
        label: "Rating (1–5)",
        type: "number",
        min: 1,
        max: 5,
        default: 5
      },
      { name: "text", label: "Review Text", type: "textarea" },
      { name: "displayOrder", label: "Display Order", type: "number" },
      {
        name: "isApproved",
        label: "Approved (visible)",
        type: "checkbox",
        default: true
      }
    ],
    cols: item => [
      {
        key: "avatar",
        content: item.avatar?.url ? (
          <img
            src={item.avatar.url}
            className="as-thumb as-thumb-round"
            alt=""
          />
        ) : (
          <span className="as-thumb-placeholder as-thumb-round">
            <i className="bi bi-person-fill" />
          </span>
        )
      },
      {
        key: "info",
        content: (
          <div>
            <div className="as-row-title">{item.name}</div>
            {item.designation && (
              <div className="as-row-sub">{item.designation}</div>
            )}
          </div>
        )
      },
      {
        key: "rating",
        content: (
          <span className="as-stars">
            {[1, 2, 3, 4, 5].map(s => (
              <i
                key={s}
                className={`bi ${
                  s <= (item.rating || 0) ? "bi-star-fill" : "bi-star"
                }`}
              />
            ))}
          </span>
        )
      },
      {
        key: "status",
        content: (
          <span
            className={`as-badge ${
              item.isApproved ? "as-badge-green" : "as-badge-amber"
            }`}
          >
            <i
              className={`bi ${
                item.isApproved ? "bi-check-circle-fill" : "bi-eye-slash-fill"
              } me-1`}
            />
            {item.isApproved ? "Visible" : "Hidden"}
          </span>
        )
      }
    ],
    headers: ["Photo", "Reviewer", "Rating", "Status"]
  },

  banners: {
    label: "Banners",
    singularLabel: "Banner",
    imageField: "image",
    emptyIcon: "bi-card-image",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "text" },
      { name: "ctaText", label: "CTA Text", type: "text" },
      { name: "ctaLink", label: "CTA Link", type: "text" },
      {
        name: "position",
        label: "Position",
        type: "select",
        options: ["top", "middle", "bottom", "popup"],
        default: "middle"
      },
      { name: "displayOrder", label: "Display Order", type: "number" },
      { name: "isActive", label: "Active", type: "checkbox", default: true }
    ],
    cols: item => [
      {
        key: "image",
        content: item.image?.url ? (
          <img src={item.image.url} className="as-thumb as-thumb-wide" alt="" />
        ) : (
          <span className="as-thumb-placeholder as-thumb-wide">
            <i className="bi bi-image" />
          </span>
        )
      },
      {
        key: "info",
        content: (
          <div>
            <div className="as-row-title">
              {item.title || <span className="as-muted">Untitled</span>}
            </div>
            {item.subtitle && <div className="as-row-sub">{item.subtitle}</div>}
          </div>
        )
      },
      {
        key: "position",
        content: <span className="as-chip as-chip-purple">{item.position}</span>
      },
      {
        key: "status",
        content: (
          <span
            className={`as-badge ${
              item.isActive ? "as-badge-green" : "as-badge-amber"
            }`}
          >
            <i
              className={`bi ${
                item.isActive ? "bi-check-circle-fill" : "bi-eye-slash-fill"
              } me-1`}
            />
            {item.isActive ? "Active" : "Hidden"}
          </span>
        )
      }
    ],
    headers: ["Image", "Banner", "Position", "Status"]
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildBlank = schema => {
  const o = {}
  schema.fields.forEach(f => {
    if (f.default !== undefined) o[f.name] = f.default
    else if (f.type === "number") o[f.name] = 0
    else if (f.type === "checkbox") o[f.name] = false
    else o[f.name] = ""
  })
  return o
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArraySection({ site, section, reload }) {
  const schema = SCHEMAS[section]
  const items = site[section] || []

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(buildBlank(schema))
  const [imgFile, setImgFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ── Open form ──────────────────────────────────────────────────────────────

  const openNew = () => {
    setForm({ ...buildBlank(schema), displayOrder: items.length })
    setImgFile(null)
    setEditing({})
  }

  const openEdit = it => {
    setForm({ ...buildBlank(schema), ...it })
    setImgFile(null)
    setEditing(it)
  }

  const closeForm = () => {
    if (saving) return
    setEditing(null)
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (imgFile) fd.append("image", imgFile)

      if (editing._id) {
        await api.patch(
          `/employee/websites/${site._id}/${section}/${editing._id}`,
          fd
        )
        toast.success(`${schema.singularLabel} updated`)
      } else {
        await api.post(`/employee/websites/${site._id}/${section}`, fd)
        toast.success(`${schema.singularLabel} added`)
      }
      setEditing(null)
      reload()
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const askDelete = it => {
    setConfirm({
      title: `Delete ${schema.singularLabel}`,
      message: `Are you sure you want to delete "${it.title ||
        it.name ||
        "this item"}"? This cannot be undone.`,
      confirmText: "Delete",
      confirmClass: "btn btn-danger",
      onConfirm: async () => {
        setDeleting(true)
        try {
          await api.delete(
            `/employee/websites/${site._id}/${section}/${it._id}`
          )
          toast.success("Deleted successfully")
          setConfirm(null)
          reload()
        } catch (err) {
          toast.error(err.response?.data?.message || "Delete failed")
        } finally {
          setDeleting(false)
        }
      }
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
      /* ── Layout ── */
      .as-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
      }
      .as-title {
        font-size: .875rem;
        font-weight: 600;
        color: #111827;
        display: flex;
        align-items: center;
        gap: .5rem;
      }
      .as-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #f3f4f6;
        color: #6b7280;
        border-radius: 20px;
        font-size: .7rem;
        font-weight: 600;
        padding: 1px 8px;
        min-width: 24px;
      }

      /* ── Add btn ── */
      .as-add-btn {
        display: inline-flex;
        align-items: center;
        gap: .35rem;
        font-size: .8rem;
        font-weight: 600;
        padding: .45rem .9rem;
        border-radius: 8px;
        border: none;
        background: #2563eb;
        color: #fff;
        cursor: pointer;
        transition: background .15s, transform .1s;
      }
      .as-add-btn:hover { background: #1d4ed8; }
      .as-add-btn:active { transform: scale(.97); }

      /* ── Empty ── */
      .as-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: .6rem;
        padding: 3rem 1rem;
        background: #f9fafb;
        border: 1.5px dashed #e5e7eb;
        border-radius: 12px;
        color: #9ca3af;
        font-size: .85rem;
      }
      .as-empty i { font-size: 2rem; opacity: .4; }

      /* ── Table ── */
      .as-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: .8375rem;
      }
      .as-table thead th {
        padding: .6rem 1rem;
        font-size: .7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: .06em;
        color: #6b7280;
        background: #f9fafb;
        border-top: 1px solid #f3f4f6;
        border-bottom: 1px solid #f3f4f6;
      }
      .as-table thead th:first-child { border-radius: 8px 0 0 8px; border-left: 1px solid #f3f4f6; }
      .as-table thead th:last-child  { border-radius: 0 8px 8px 0; border-right: 1px solid #f3f4f6; }

      .as-table tbody tr {
        transition: background .12s;
      }
      .as-table tbody tr:hover { background: #f9fafb; }
      .as-table tbody td {
        padding: .75rem 1rem;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: middle;
      }

      /* ── Thumbnail ── */
      .as-thumb {
        width: 44px;
        height: 44px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        display: block;
      }
      .as-thumb-round { border-radius: 50%; }
      .as-thumb-wide { width: 72px; height: 40px; border-radius: 6px; }
      .as-thumb-placeholder {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #f3f4f6;
        color: #9ca3af;
        font-size: 1.2rem;
        border: 1px solid #e5e7eb;
      }

      /* ── Text ── */
      .as-row-title { font-weight: 600; color: #111827; }
      .as-row-sub   { font-size: .75rem; color: #6b7280; margin-top: 2px; }
      .as-muted     { color: #9ca3af; }

      /* ── Chips & badges ── */
      .as-chip {
        display: inline-block;
        font-size: .72rem;
        font-weight: 600;
        padding: 2px 9px;
        border-radius: 6px;
      }
      .as-chip-blue   { background: #eff6ff; color: #2563eb; }
      .as-chip-purple { background: #f5f3ff; color: #7c3aed; }

      .as-badge {
        display: inline-flex;
        align-items: center;
        font-size: .72rem;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 20px;
      }
      .as-badge-green { background: #d1fae5; color: #065f46; }
      .as-badge-amber { background: #fef3c7; color: #92400e; }

      /* ── Stars ── */
      .as-stars { color: #f59e0b; font-size: .8rem; letter-spacing: 1px; }
      .as-stars .bi-star { color: #d1d5db; }

      /* ── Action buttons ── */
      .as-actions { display: flex; align-items: center; gap: .35rem; white-space: nowrap; }
      .as-btn-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 7px;
        border: 1px solid #e5e7eb;
        background: #fff;
        color: #374151;
        font-size: .875rem;
        cursor: pointer;
        transition: background .12s, border-color .12s, color .12s;
      }
      .as-btn-icon:hover { background: #f3f4f6; }
      .as-btn-icon.danger { color: #dc2626; border-color: #fecaca; }
      .as-btn-icon.danger:hover { background: #fef2f2; border-color: #dc2626; }
      .as-btn-icon:disabled { opacity: .45; cursor: not-allowed; }

      /* ── Modal backdrop ── */
      .as-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.45);
        backdrop-filter: blur(3px);
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        animation: asBackdropIn .15s ease;
      }
      @keyframes asBackdropIn { from { opacity: 0 } to { opacity: 1 } }

      .as-modal-card {
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 20px 60px rgba(0,0,0,.2);
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        animation: asCardIn .2s cubic-bezier(.22,1,.36,1);
      }
      @keyframes asCardIn { from { opacity: 0; transform: translateY(16px) scale(.97) } to { opacity: 1; transform: none } }

      .as-modal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.1rem 1.4rem;
        border-bottom: 1px solid #f3f4f6;
      }
      .as-modal-head h6 {
        font-size: .9rem;
        font-weight: 700;
        color: #111827;
        margin: 0;
      }
      .as-close-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 7px;
        border: none;
        background: #f3f4f6;
        color: #374151;
        cursor: pointer;
        font-size: 1rem;
        transition: background .12s;
      }
      .as-close-btn:hover { background: #e5e7eb; }
      .as-close-btn:disabled { opacity: .4; cursor: not-allowed; }

      .as-modal-body {
        padding: 1.25rem 1.4rem;
        overflow-y: auto;
        flex: 1;
      }
      .as-modal-body .mb-2 { margin-bottom: .75rem !important; }

      .as-modal-foot {
        padding: .9rem 1.4rem;
        border-top: 1px solid #f3f4f6;
        display: flex;
        justify-content: flex-end;
        gap: .5rem;
      }

      /* ── Save btn spinner ── */
      .as-save-btn {
        display: inline-flex;
        align-items: center;
        gap: .4rem;
        font-size: .82rem;
        font-weight: 600;
        padding: .5rem 1.1rem;
        border-radius: 8px;
        border: none;
        background: #2563eb;
        color: #fff;
        cursor: pointer;
        transition: background .15s;
        min-width: 80px;
        justify-content: center;
      }
      .as-save-btn:hover:not(:disabled) { background: #1d4ed8; }
      .as-save-btn:disabled { opacity: .65; cursor: not-allowed; }

      .as-cancel-btn {
        font-size: .82rem;
        font-weight: 500;
        padding: .5rem 1rem;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        background: #fff;
        color: #374151;
        cursor: pointer;
        transition: background .12s;
      }
      .as-cancel-btn:hover:not(:disabled) { background: #f3f4f6; }
      .as-cancel-btn:disabled { opacity: .5; cursor: not-allowed; }

      /* ── Skeleton row ── */
      @keyframes asSkeleton { 0%,100%{opacity:.5} 50%{opacity:1} }
      .as-skel { background: #f3f4f6; border-radius: 6px; animation: asSkeleton 1.2s ease infinite; }
    `}</style>

      {/* Header */}
      <div className="as-header">
        <span className="as-title">
          <i className={`bi ${schema.emptyIcon}`} />
          {schema.label}
          <span className="as-count">{items.length}</span>
        </span>
        <button className="as-add-btn" onClick={openNew}>
          <i className="bi bi-plus-lg" />
          Add {schema.singularLabel}
        </button>
      </div>

      {/* Empty */}
      {items.length === 0 && (
        <div className="as-empty">
          <i className={`bi ${schema.emptyIcon}`} />
          <span>
            No {schema.label.toLowerCase()} yet. Click "Add{" "}
            {schema.singularLabel}" to get started.
          </span>
        </div>
      )}

      {/* Table */}
      {items.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="as-table">
            <thead>
              <tr>
                {schema.headers.map(h => (
                  <th key={h}>{h}</th>
                ))}
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it._id}>
                  {schema.cols(it).map(col => (
                    <td key={col.key}>{col.content}</td>
                  ))}
                  <td>
                    <div className="as-actions">
                      <button
                        className="as-btn-icon"
                        title="Edit"
                        onClick={() => openEdit(it)}
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        className="as-btn-icon danger"
                        title="Delete"
                        onClick={() => askDelete(it)}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / New Modal */}
      {editing && (
        <div className="as-modal-backdrop" onClick={closeForm}>
          <div className="as-modal-card" onClick={e => e.stopPropagation()}>
            <form
              onSubmit={save}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflow: "hidden"
              }}
            >
              <div className="as-modal-head">
                <h6>
                  <i
                    className={`bi ${
                      editing._id ? "bi-pencil-square" : "bi-plus-circle"
                    } me-2`}
                  />
                  {editing._id
                    ? `Edit ${schema.singularLabel}`
                    : `New ${schema.singularLabel}`}
                </h6>
                <button
                  type="button"
                  className="as-close-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <div className="as-modal-body">
                <ImagePicker
                  label="Image"
                  currentUrl={editing[schema.imageField]?.url}
                  onChange={setImgFile}
                />

                {schema.fields.map(f => (
                  <div className="mb-2" key={f.name}>
                    {f.type === "checkbox" ? (
                      <div className="form-check">
                        <input
                          id={`as-${f.name}`}
                          className="form-check-input"
                          type="checkbox"
                          checked={!!form[f.name]}
                          onChange={e =>
                            setForm({ ...form, [f.name]: e.target.checked })
                          }
                          disabled={saving}
                        />
                        <label
                          htmlFor={`as-${f.name}`}
                          className="form-check-label small fw-500"
                        >
                          {f.label}
                        </label>
                      </div>
                    ) : (
                      <>
                        <label className="form-label small fw-semibold mb-1">
                          {f.label}
                          {f.required && (
                            <span className="text-danger ms-1">*</span>
                          )}
                        </label>

                        {f.type === "textarea" ? (
                          <textarea
                            className="form-control form-control-sm"
                            rows={3}
                            value={form[f.name]}
                            onChange={e =>
                              setForm({ ...form, [f.name]: e.target.value })
                            }
                            required={f.required}
                            disabled={saving}
                          />
                        ) : f.type === "select" ? (
                          <select
                            className="form-select form-select-sm"
                            value={form[f.name]}
                            onChange={e =>
                              setForm({ ...form, [f.name]: e.target.value })
                            }
                            disabled={saving}
                          >
                            {f.options.map(o => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="form-control form-control-sm"
                            type={f.type}
                            min={f.min}
                            max={f.max}
                            value={form[f.name]}
                            onChange={e =>
                              setForm({
                                ...form,
                                [f.name]:
                                  f.type === "number"
                                    ? Number(e.target.value)
                                    : e.target.value
                              })
                            }
                            required={f.required}
                            disabled={saving}
                          />
                        )}

                        {f.help && (
                          <div
                            className="form-text text-muted"
                            style={{ fontSize: ".72rem" }}
                          >
                            {f.help}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="as-modal-foot">
                <button
                  type="button"
                  className="as-cancel-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="as-save-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                      />
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg" />
                      {editing._id ? "Update" : "Save"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        data={confirm}
        onClose={() => !deleting && setConfirm(null)}
        loading={deleting}
      />
    </>
  )
}
