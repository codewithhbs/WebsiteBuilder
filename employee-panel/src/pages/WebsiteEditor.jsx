import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";
import BasicSection from "./editor/BasicSection";
import HeroSection from "./editor/HeroSection";
import ArraySection from "./editor/ArraySection";
import FlatSection from "./editor/FlatSection";
import VisibilitySection from "./editor/VisibilitySection";
import SubmissionsSection from "./editor/SubmissionsSection";

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
  const [site, setSite] = useState(null);
  const [themes, setThemes] = useState([]);
  const [tab, setTab] = useState("basic");

  const load = async () => {
    const { data } = await api.get(`/employee/websites/${id}`);
    setSite(data.site);
  };
  useEffect(() => {
    load();
    api.get("/public/themes").then((r) => setThemes(r.data.items));
  }, [id]);

  const togglePublish = async () => {
    try {
      const { data } = await api.patch(`/employee/websites/${id}/publish`);
      toast.success(data.isLive ? "Published" : "Unpublished");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  if (!site) return <div>Loading…</div>;

  return (
    <div>
      <Link to="/websites" className="text-muted small"><i className="bi bi-arrow-left me-1"></i>Back</Link>
      <div className="card p-4 mt-2 mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1">{site.basicInfo?.siteName || site.slug}</h4>
            <a href={site.liveUrl} target="_blank" rel="noopener" className="small">{site.liveUrl}</a>
            <div className="mt-2">
              <span className={"badge me-2 " + (site.isLive ? "badge-soft-success" : "badge-soft-warning")}>{site.isLive ? "Live" : "Draft"}</span>
              <span className="badge bg-light text-dark">Theme: {site.themeKey}</span>
            </div>
          </div>
          <button className={"btn " + (site.isLive ? "btn-outline-danger" : "btn-success")} onClick={togglePublish}>
            <i className={"bi me-1 " + (site.isLive ? "bi-pause-circle" : "bi-broadcast")}></i>
            {site.isLive ? "Unpublish" : "Publish Live"}
          </button>
        </div>
      </div>

      <ul className="nav nav-tabs section-tabs mb-3 flex-nowrap" style={{ overflowX: "auto" }}>
        {TABS.map((t) => (
          <li className="nav-item" key={t.key}>
            <button className={"nav-link " + (tab === t.key ? "active" : "")} onClick={() => setTab(t.key)}>
              <i className={`bi ${t.icon} me-1`}></i>{t.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="card p-4">
        {tab === "basic" && <BasicSection site={site} reload={load} themes={themes} />}
        {tab === "hero" && <HeroSection site={site} reload={load} />}
        {tab === "about" && <FlatSection key={tab} site={site} section="about" reload={load} />}
        {tab === "services" && <ArraySection site={site} section="services" reload={load} />}
        {tab === "reviews" && <ArraySection site={site} section="reviews" reload={load} />}
        {tab === "banners" && <ArraySection site={site} section="banners" reload={load} />}
        {tab === "contact" && <FlatSection key={tab} site={site} section="contact" reload={load} />}
        {tab === "footer" && <FlatSection key={tab} site={site} section="footer" reload={load} />}
        {tab === "seo" && <FlatSection key={tab} site={site} section="seo" reload={load} />}
        {tab === "visibility" && <VisibilitySection site={site} reload={load} />}
        {tab === "submissions" && <SubmissionsSection site={site} />}
      </div>
    </div>
  );
}
