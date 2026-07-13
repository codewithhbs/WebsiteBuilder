import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import ConfirmModal from "../../components/ConfirmModal";
import SectionEditor, { SECTION_TYPES, SECTION_DEFAULTS } from "./SectionEditor";

/* ─────────────────────────────────────────────────────────────────
   Small helpers
   ───────────────────────────────────────────────────────────────── */
const sanitizeKey = (s) =>
  String(s || "").toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const iconOf = (type) => SECTION_TYPES.find((t) => t.key === type)?.icon || "bi-square";
const labelOf = (type) => SECTION_TYPES.find((t) => t.key === type)?.label || type;


/* ─────────────────────────────────────────────────────────────────
   1. TYPE PICKER — modal to pick a section type when adding
   ───────────────────────────────────────────────────────────────── */
function SectionTypePicker({ onPick, onClose }) {
  const [q, setQ] = useState("");
  const filtered = SECTION_TYPES.filter(
    (t) => t.label.toLowerCase().includes(q.toLowerCase()) || t.desc.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-scrollable modal-lg my-4" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow">
          <div className="modal-header">
            <h5 className="modal-title"><i className="bi bi-plus-circle me-2 text-primary"></i>Add a Section</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <input className="form-control" placeholder="Search section types…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            </div>
            <div className="row g-2">
              {filtered.map((t) => (
                <div key={t.key} className="col-md-6">
                  <button
                    type="button"
                    className="btn btn-light border w-100 text-start p-3 h-100"
                    onClick={() => onPick(t.key)}
                  >
                    <div className="d-flex align-items-start gap-2">
                      <i className={`bi ${t.icon} text-primary fs-4`}></i>
                      <div>
                        <div className="fw-bold small">{t.label}</div>
                        <div className="small text-muted">{t.desc}</div>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
              {filtered.length === 0 && <div className="col-12 text-center text-muted py-3">No matches</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────
   2. PAGE MODAL — create / edit a page (settings only)
   ───────────────────────────────────────────────────────────────── */
function PageFormModal({ page, isNew, websiteId, onClose, onSaved, hasHomepage }) {
  const [form, setForm] = useState({
    pageKey:    page?.pageKey    || "",
    title:      page?.title      || "",
    navLabel:   page?.navLabel   || "",
    navOrder:   page?.navOrder   ?? 0,
    isHomepage: !!page?.isHomepage,
    showInNav:  page?.showInNav !== false,
    isLive:     page?.isLive    !== false,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const key = sanitizeKey(form.pageKey);
    if (!key) { toast.error("Page URL slug is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, pageKey: key };
      if (isNew) {
        await api.post(`/employee/websites/${websiteId}/pages`, payload);
        toast.success("Page created");
      } else {
        await api.patch(`/employee/pages/${page._id}`, payload);
        toast.success("Page updated");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => !saving && onClose()}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <form className="modal-content border-0 shadow" onSubmit={submit}>
          <div className="modal-header">
            <h5 className="modal-title"><i className="bi bi-file-earmark-plus me-2 text-primary"></i>{isNew ? "New Page" : "Edit Page"}</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={saving}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label small fw-semibold">Page URL Slug</label>
              <input
                className="form-control"
                value={form.pageKey}
                onChange={(e) => setForm({ ...form, pageKey: e.target.value })}
                placeholder="about, services, portfolio…"
                required
              />
              <div className="form-text">Lower-case letters, numbers, hyphens. This becomes the URL: <code>/{sanitizeKey(form.pageKey) || "page"}</code></div>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Page Title</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="About Us" />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Nav Label (optional)</label>
              <input className="form-control" value={form.navLabel} onChange={(e) => setForm({ ...form, navLabel: e.target.value })} placeholder="Falls back to Page Title" />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Nav Order</label>
              <input type="number" className="form-control" value={form.navOrder} onChange={(e) => setForm({ ...form, navOrder: Number(e.target.value) })} />
            </div>
            <hr />
            <div className="form-check form-switch mb-2">
              <input id="fmHome" className="form-check-input" type="checkbox" checked={form.isHomepage} onChange={(e) => setForm({ ...form, isHomepage: e.target.checked })} />
              <label htmlFor="fmHome" className="form-check-label small">Set as homepage {hasHomepage && !page?.isHomepage && <span className="text-warning">(will replace current homepage)</span>}</label>
            </div>
            <div className="form-check form-switch mb-2">
              <input id="fmNav" className="form-check-input" type="checkbox" checked={form.showInNav} onChange={(e) => setForm({ ...form, showInNav: e.target.checked })} />
              <label htmlFor="fmNav" className="form-check-label small">Show in navigation menu</label>
            </div>
            <div className="form-check form-switch mb-2">
              <input id="fmLive" className="form-check-input" type="checkbox" checked={form.isLive} onChange={(e) => setForm({ ...form, isLive: e.target.checked })} />
              <label htmlFor="fmLive" className="form-check-label small">Page is live / published</label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</> : <><i className="bi bi-check-lg me-1"></i>{isNew ? "Create Page" : "Save Page"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────
   3. SECTIONS PANEL — for the currently selected page
   ───────────────────────────────────────────────────────────────── */
function SectionsList({ page, reload }) {
  const [picking, setPicking]           = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [confirm, setConfirm]           = useState(null);
  const [busy, setBusy]                 = useState(false);
  const [reordering, setReordering]     = useState(false);

  const sections = [...(page.sections || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const addSection = async (type) => {
    setPicking(false);
    const defaults = SECTION_DEFAULTS[type] || {};
    // open editor immediately with unsaved defaults so the user can tweak before saving
    const displayOrder = sections.reduce((m, s) => Math.max(m, s.displayOrder || 0), -1) + 1;
    setEditingSection({ type, data: JSON.parse(JSON.stringify(defaults)), isActive: true, displayOrder, _id: null });
  };

  const doDelete = async (sec) => {
    setBusy(true);
    try {
      await api.delete(`/employee/pages/${page._id}/sections/${sec._id}`);
      toast.success("Section deleted");
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setBusy(false); }
  };

  const move = async (idx, delta) => {
    const target = idx + delta;
    if (target < 0 || target >= sections.length) return;
    setReordering(true);
    try {
      const next = [...sections];
      [next[idx], next[target]] = [next[target], next[idx]];
      const rebuilt = next.map((s, i) => ({ ...s, displayOrder: i }));
      await api.put(`/employee/pages/${page._id}/sections`, { sections: rebuilt });
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reorder failed");
    } finally { setReordering(false); }
  };

  const toggleActive = async (sec) => {
    try {
      await api.patch(`/employee/pages/${page._id}/sections/${sec._id}`, { isActive: !sec.isActive });
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="small text-muted">Sections on this page</div>
          <div className="fw-bold">{sections.length} block{sections.length === 1 ? "" : "s"}</div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => setPicking(true)}>
          <i className="bi bi-plus-lg me-1"></i>Add Section
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-5 bg-light rounded">
          <i className="bi bi-layers text-muted" style={{ fontSize: "3rem" }}></i>
          <p className="text-muted mt-2 mb-3">No sections yet on this page.</p>
          <button className="btn btn-sm btn-outline-primary" onClick={() => setPicking(true)}>
            <i className="bi bi-plus-lg me-1"></i>Add your first section
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {sections.map((s, i) => {
            const title = s.data?.title || s.data?.heading || s.data?.name || "";
            return (
              <div key={s._id} className={"border rounded p-3 " + (s.isActive === false ? "bg-light" : "bg-white")}>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex flex-column btn-group-vertical">
                    <button className="btn btn-sm btn-link p-0" onClick={() => move(i, -1)} disabled={i === 0 || reordering} title="Move up">
                      <i className="bi bi-caret-up-fill"></i>
                    </button>
                    <button className="btn btn-sm btn-link p-0" onClick={() => move(i, 1)}  disabled={i === sections.length - 1 || reordering} title="Move down">
                      <i className="bi bi-caret-down-fill"></i>
                    </button>
                  </div>
                  <div className="d-flex align-items-center justify-content-center rounded" style={{ width: 42, height: 42, background: "#eef2ff", color: "#4f46e5" }}>
                    <i className={`bi ${iconOf(s.type)} fs-5`}></i>
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold">{labelOf(s.type)}</span>
                      {s.isActive === false && <span className="badge bg-warning-subtle text-warning">Hidden</span>}
                    </div>
                    {title && <div className="small text-muted text-truncate">{title}</div>}
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-secondary" title={s.isActive === false ? "Show" : "Hide"} onClick={() => toggleActive(s)}>
                      <i className={"bi " + (s.isActive === false ? "bi-eye-slash" : "bi-eye")}></i>
                    </button>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => setEditingSection(s)} title="Edit">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirm({
                      title: "Delete this section?",
                      message: `"${labelOf(s.type)}" section will be permanently removed from this page.`,
                      variant: "danger",
                      confirmText: "Delete",
                      onConfirm: () => doDelete(s),
                    })} title="Delete">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {picking && <SectionTypePicker onPick={addSection} onClose={() => setPicking(false)} />}
      {editingSection && <SectionEditor pageId={page._id} section={editingSection} onClose={() => setEditingSection(null)} onSaved={reload} />}
      <ConfirmModal data={confirm} onClose={() => !busy && setConfirm(null)} loading={busy} />
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────
   4. PAGE SEO PANEL
   ───────────────────────────────────────────────────────────────── */
function PageSeoPanel({ page, reload }) {
  const [form, setForm] = useState(page.seo || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(page.seo || {}); }, [page._id]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/employee/pages/${page._id}`, { seo: form });
      toast.success("SEO saved");
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const patch = (u) => setForm({ ...form, ...u });

  return (
    <div>
      <div className="alert alert-info small mb-3"><i className="bi bi-info-circle me-2"></i>Per-page SEO. Overrides the site-level SEO for this page only.</div>
      <div className="mb-3">
        <label className="form-label small fw-semibold">Page Title</label>
        <input className="form-control" value={form.title || ""} onChange={(e) => patch({ title: e.target.value })} placeholder="About Us | My Business" />
      </div>
      <div className="mb-3">
        <label className="form-label small fw-semibold">Meta Description</label>
        <textarea className="form-control" rows="3" value={form.description || ""} onChange={(e) => patch({ description: e.target.value })} placeholder="A short description that shows in search results."></textarea>
      </div>
      <div className="mb-3">
        <label className="form-label small fw-semibold">Canonical URL</label>
        <input className="form-control" value={form.canonicalUrl || ""} onChange={(e) => patch({ canonicalUrl: e.target.value })} placeholder="https://your-site.com/about" />
      </div>
      <div className="mb-3">
        <label className="form-label small fw-semibold">Robots</label>
        <select className="form-select" value={form.robots || "index, follow"} onChange={(e) => patch({ robots: e.target.value })}>
          <option value="index, follow">index, follow (default)</option>
          <option value="noindex, follow">noindex, follow</option>
          <option value="noindex, nofollow">noindex, nofollow</option>
        </select>
      </div>
      <button className="btn btn-primary" onClick={save} disabled={saving}>
        {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</> : <><i className="bi bi-check-lg me-1"></i>Save SEO</>}
      </button>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────
   5. PAGE PANEL — sections | SEO tabs for one page
   ───────────────────────────────────────────────────────────────── */
function PagePanel({ page, reload }) {
  const [tab, setTab] = useState("sections");
  return (
    <div>
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={"nav-link " + (tab === "sections" ? "active" : "")} onClick={() => setTab("sections")}>
            <i className="bi bi-layers me-1"></i>Sections
          </button>
        </li>
        <li className="nav-item">
          <button className={"nav-link " + (tab === "seo" ? "active" : "")} onClick={() => setTab("seo")}>
            <i className="bi bi-search me-1"></i>Page SEO
          </button>
        </li>
      </ul>
      {tab === "sections" && <SectionsList page={page} reload={reload} />}
      {tab === "seo"      && <PageSeoPanel page={page} reload={reload} />}
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────
   6. MAIN — pages list left, panel right
   ───────────────────────────────────────────────────────────────── */
export default function PagesSection({ site }) {
  const [pages, setPages]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal]         = useState(null);          // { new: bool, page: obj|null }
  const [confirm, setConfirm]     = useState(null);
  const [busy, setBusy]           = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/employee/websites/${site._id}/pages`);
      const list = (data.pages || []).sort((a, b) => (a.navOrder || 0) - (b.navOrder || 0));
      setPages(list);
      // preserve current selection if it still exists, otherwise pick homepage / first
      if (list.length > 0) {
        const stillThere = list.find((p) => p._id === selectedId);
        if (!stillThere) {
          const home = list.find((p) => p.isHomepage) || list[0];
          setSelectedId(home._id);
        }
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load pages");
    } finally { setLoading(false); }
  };

  // reload the currently selected page (deep) so section edits reflect immediately
  const reloadSelected = async () => {
    if (!selectedId) return load();
    try {
      const { data } = await api.get(`/employee/pages/${selectedId}`);
      // also refresh the sidebar list to keep counts / titles in sync
      setPages((prev) => prev.map((p) => (p._id === selectedId ? data.page : p)));
    } catch (err) {
      load();
    }
  };

  useEffect(() => { load(); }, [site._id]);

  const doDeletePage = async (page) => {
    setBusy(true);
    try {
      await api.delete(`/employee/pages/${page._id}`);
      toast.success("Page deleted");
      setConfirm(null);
      if (selectedId === page._id) setSelectedId(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setBusy(false); }
  };

  const selectedPage = pages.find((p) => p._id === selectedId);
  const hasHomepage = pages.some((p) => p.isHomepage);

  if (loading) {
    return (
      <div className="text-center py-4"><span className="spinner-border text-primary"></span></div>
    );
  }

  return (
    <div>
      <div className="alert alert-primary d-flex align-items-start gap-2 mb-3">
        <i className="bi bi-info-circle fs-5"></i>
        <div className="small">
          <strong>Multi-page website.</strong> Add pages here. Each page has its own URL, sections, and SEO.
          The homepage is served at the root URL (<code>{site.slug}.hovermedia.in/</code>); other pages sit at <code>/{"{pageKey}"}</code>.
        </div>
      </div>

      <div className="row g-3">
        {/* LEFT — pages list */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0"><i className="bi bi-files me-1"></i>Pages ({pages.length})</h6>
                <button className="btn btn-sm btn-primary" onClick={() => setModal({ new: true, page: null })}>
                  <i className="bi bi-plus-lg me-1"></i>New
                </button>
              </div>

              {pages.length === 0 ? (
                <div className="text-center text-muted small py-4">No pages yet.</div>
              ) : (
                <div className="d-flex flex-column gap-1">
                  {pages.map((p) => (
                    <div
                      key={p._id}
                      className={"d-flex align-items-center justify-content-between p-2 rounded " + (selectedId === p._id ? "bg-primary text-white" : "bg-light")}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedId(p._id)}
                    >
                      <div className="d-flex align-items-center gap-2 min-w-0">
                        <i className={"bi " + (p.isHomepage ? "bi-house-fill" : "bi-file-earmark")}></i>
                        <div className="min-w-0">
                          <div className="fw-bold text-truncate small">{p.title || p.pageKey}</div>
                          <div className={"small text-truncate " + (selectedId === p._id ? "text-white-50" : "text-muted")}>
                            /{p.pageKey} · {p.sections?.length || 0} block{(p.sections?.length || 0) === 1 ? "" : "s"}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        {p.isLive === false && <i className="bi bi-eye-slash-fill" title="Not live"></i>}
                        {p.showInNav === false && !p.isHomepage && <i className="bi bi-signpost-2 text-warning" title="Hidden from nav"></i>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedPage && (
            <div className="card border-0 shadow-sm mt-3">
              <div className="card-body p-3">
                <h6 className="small text-muted text-uppercase mb-2">Selected page</h6>
                <div className="fw-bold mb-1">{selectedPage.title || selectedPage.pageKey}</div>
                <div className="small text-muted mb-3">
                  URL: <code>/{selectedPage.pageKey}</code>{selectedPage.isHomepage && <span className="ms-1 badge bg-success-subtle text-success">Homepage</span>}
                </div>
                <div className="d-grid gap-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => setModal({ new: false, page: selectedPage })}>
                    <i className="bi bi-gear me-1"></i>Page Settings
                  </button>
                  {!selectedPage.isHomepage && (
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirm({
                      title: `Delete "${selectedPage.title || selectedPage.pageKey}"?`,
                      message: "The page and all its sections will be permanently removed.",
                      variant: "danger",
                      confirmText: "Delete Page",
                      onConfirm: () => doDeletePage(selectedPage),
                    })}>
                      <i className="bi bi-trash me-1"></i>Delete Page
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — panel */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3 p-md-4">
              {!selectedPage ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-arrow-left fs-3"></i>
                  <p className="mt-2">Select a page from the left to edit its sections and SEO.</p>
                </div>
              ) : (
                <PagePanel page={selectedPage} reload={reloadSelected} />
              )}
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <PageFormModal
          isNew={!!modal.new}
          page={modal.page}
          websiteId={site._id}
          hasHomepage={hasHomepage}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      <ConfirmModal data={confirm} onClose={() => !busy && setConfirm(null)} loading={busy} />
    </div>
  );
}
