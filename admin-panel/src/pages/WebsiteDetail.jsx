import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";

export default function WebsiteDetail() {
  const { id } = useParams();
  const [site, setSite] = useState(null);

  useEffect(() => {
    api.get(`/employee/websites/${id}`).then((r) => setSite(r.data.site));
  }, [id]);

  if (!site) return <div>Loading…</div>;

  return (
    <div>
      <Link to="/websites" className="text-muted small"><i className="bi bi-arrow-left me-1"></i>Back</Link>
      <div className="card p-4 mt-2 mb-3">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h4 className="mb-1">{site.basicInfo?.siteName || site.slug}</h4>
            <a href={site.liveUrl} target="_blank" rel="noopener" className="small">{site.liveUrl}</a>
            <div className="mt-2">
              <span className={"badge me-2 " + (site.isLive ? "badge-soft-success" : "badge-soft-warning")}>{site.isLive ? "Live" : "Draft"}</span>
              <span className="badge bg-light text-dark me-2">Theme: {site.themeKey}</span>
              <span className="text-muted small">Owner: {site.ownerEmployee?.name} · Client: {site.client?.businessName || site.client?.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <Summary label="Hero Slides" count={site.heroSlides?.length || 0} icon="bi-images" />
        <Summary label="Services" count={site.services?.length || 0} icon="bi-grid" />
        <Summary label="Reviews" count={site.reviews?.length || 0} icon="bi-star" />
        <Summary label="Banners" count={site.banners?.length || 0} icon="bi-megaphone" />
      </div>

      <div className="card p-3 mt-3">
        <h6>About</h6>
        <div className="small text-muted">{site.about?.shortText || "—"}</div>
      </div>

      <div className="card p-3 mt-3">
        <h6>Contact Info</h6>
        <div className="small">
          <div>📍 {site.contact?.address || "—"}</div>
          <div>📞 {site.contact?.phone || "—"}</div>
          <div>✉️ {site.contact?.email || "—"}</div>
        </div>
      </div>
    </div>
  );
}

const Summary = ({ label, count, icon }) => (
  <div className="col-md-3 mb-3">
    <div className="card p-3">
      <div className="d-flex align-items-center gap-3">
        <i className={`bi ${icon} fs-3 text-primary`}></i>
        <div>
          <div className="text-muted small">{label}</div>
          <div className="fs-5 fw-bold">{count}</div>
        </div>
      </div>
    </div>
  </div>
);
