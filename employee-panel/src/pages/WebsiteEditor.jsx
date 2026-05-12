import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";
import BasicSection from "./editor/BasicSection";
import HeroSection from "./editor/HeroSection";
import ArraySection from "./editor/ArraySection";
import FlatSection from "./editor/FlatSection";
import VisibilitySection from "./editor/VisibilitySection";
import SubmissionsSection from "./editor/SubmissionsSection";
import ConfirmModal from "../components/ConfirmModal";

const TABS = [
  { key: "basic", label: "Basic & Theme", icon: "bi-gear" },
  { key: "hero", label: "Hero Slides", icon: "bi-images" },
  { key: "about", label: "About", icon: "bi-info-circle" },
  { key: "services", label: "Services", icon: "bi-grid" },
  { key: "reviews", label: "Reviews", icon: "bi-star" },
  { key: "banners", label: "Banners", icon: "bi-megaphone" },
  { key: "contact", label: "Contact", icon: "bi-envelope" },
  { key: "footer", label: "Footer", icon: "bi-bottom" },
  { key: "seo", label: "SEO", icon: "bi-search" },
  { key: "visibility", label: "Visibility", icon: "bi-eye" },
  { key: "submissions", label: "Submissions", icon: "bi-inbox" },
];

export default function WebsiteEditor() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab") : "basic";

  const [site, setSite] = useState(null);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const setTab = (key) => {
    const next = new URLSearchParams(params);
    next.set("tab", key);
    setParams(next, { replace: true });
  };

  const load = async () => {
    try {
      const { data } = await api.get(`/employee/websites/${id}`);
      setSite(data.site);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load site");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    api.get("/public/themes").then((r) => setThemes(r.data.items)).catch(() => {});
  }, [id]);

  const doPublishToggle = async () => {
    setPublishing(true);
    try {
      const { data } = await api.patch(`/employee/websites/${id}/publish`);
      toast.success(data.isLive ? "Site is now live" : "Site unpublished");
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setPublishing(false);
    }
  };

  const askPublishToggle = () => {
    setConfirm({
      title: site.isLive ? "Unpublish site?" : "Publish site live?",
      message: site.isLive
        ? "Visitors will no longer be able to access this site."
        : "Your site will be visible to everyone at the live URL.",
      variant: site.isLive ? "danger" : "success",
      icon: site.isLive ? "bi-pause-circle" : "bi-broadcast",
      confirmText: site.isLive ? "Unpublish" : "Publish",
      onConfirm: doPublishToggle,
    });
  };

  if (loading || !site) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary me-2"></div>
        <span className="text-muted">Loading editor…</span>
      </div>
    );
  }

  return (
    <div>
      <Link to="/websites" className="text-muted small text-decoration-none">
        <i className="bi bi-arrow-left me-1"></i>Back to websites
      </Link>

      <div className="card border-0 shadow-sm mt-2 mb-3">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-3">
              {site.basicInfo?.logo?.url ? (
                <img
                  src={site.basicInfo.logo.url}
                  alt=""
                  style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8, background: "#f8f9fa" }}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center bg-light rounded" style={{ width: 56, height: 56 }}>
                  <i className="bi bi-globe text-muted fs-3"></i>
                </div>
              )}
              <div>
                <h4 className="mb-1">{site.basicInfo?.siteName || site.slug}</h4>
                <a href={site.liveUrl} target="_blank" rel="noopener noreferrer" className="small text-decoration-none">
                  <i className="bi bi-box-arrow-up-right me-1"></i>{site.liveUrl}
                </a>
                <div className="mt-2 d-flex flex-wrap gap-2">
                  <span className={"badge " + (site.isLive ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning")}>
                    <i className={"bi me-1 " + (site.isLive ? "bi-broadcast" : "bi-pencil-square")}></i>
                    {site.isLive ? "Live" : "Draft"}
                  </span>
                  <span className="badge bg-light text-dark border">
                    <i className="bi bi-palette me-1"></i>{site.themeKey}
                  </span>
                </div>
              </div>
            </div>
            <button
              className={"btn " + (site.isLive ? "btn-outline-danger" : "btn-success")}
              onClick={askPublishToggle}
              disabled={publishing}
            >
              {publishing ? (
                <><span className="spinner-border spinner-border-sm me-1"></span>Working…</>
              ) : (
                <><i className={"bi me-1 " + (site.isLive ? "bi-pause-circle" : "bi-broadcast")}></i>{site.isLive ? "Unpublish" : "Publish Live"}</>
              )}
            </button>
          </div>
        </div>
      </div>

      <ul className="nav nav-pills mb-3 flex-nowrap p-2 bg-light rounded shadow-sm" style={{ overflowX: "auto" }}>
        {TABS.map((t) => (
          <li className="nav-item" key={t.key}>
            <button
              className={"nav-link text-nowrap " + (tab === t.key ? "active" : "text-dark")}
              onClick={() => setTab(t.key)}
            >
              <i className={`bi ${t.icon} me-1`}></i>{t.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {tab === "basic" && <BasicSection site={site} reload={load} themes={themes} />}
          {tab === "hero" && <HeroSection site={site} reload={load} />}
          {tab === "about" && <FlatSection key={tab} site={site} section="about" reload={load} />}
          {tab === "services" && <ArraySection key={tab} site={site} section="services" reload={load} />}
          {tab === "reviews" && <ArraySection key={tab} site={site} section="reviews" reload={load} />}
          {tab === "banners" && <ArraySection key={tab} site={site} section="banners" reload={load} />}
          {tab === "contact" && <FlatSection key={tab} site={site} section="contact" reload={load} />}
          {tab === "footer" && <FlatSection key={tab} site={site} section="footer" reload={load} />}
          {tab === "seo" && <FlatSection key={tab} site={site} section="seo" reload={load} />}
          {tab === "visibility" && <VisibilitySection site={site} reload={load} />}
          {tab === "submissions" && <SubmissionsSection site={site} />}
        </div>
      </div>

      <ConfirmModal data={confirm} onClose={() => !publishing && setConfirm(null)} loading={publishing} />
    </div>
  );
}