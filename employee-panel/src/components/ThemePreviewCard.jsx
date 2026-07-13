import { useMemo, useState } from "react";

/* ─────────────────────────────────────────────────────────────────
   ThemePreviewCard
   ─────────────────────────────────────────────────────────────────
   Renders a theme as a card with a live scaled-down iframe preview
   (loaded from theme.previewImage.url). Falls back to a colored
   placeholder if the theme has no preview.

   Props:
     theme    – theme object from /api/public/themes
     active   – boolean, is this the currently selected theme
     onSelect – () => void, called when the card is clicked
     compact  – optional, smaller card for tighter grids
   ───────────────────────────────────────────────────────────────── */
export default function ThemePreviewCard({ theme, active, onSelect, compact = false }) {
  const [loaded, setLoaded] = useState(false);

  // Derive backend origin so iframe src is an absolute URL.
  // VITE_API_BASE is typically "https://webgmbapi.hovermedia.in/api" in dev
  // or "https://webgmbapi.hovermedia.in/api" in prod. Strip the /api
  // suffix to get the origin that serves /themes/*.
  const backendOrigin = useMemo(() => {
    const apiBase = import.meta.env.VITE_API_BASE || "/api";
    if (/^https?:\/\//.test(apiBase)) return apiBase.replace(/\/api\/?$/, "");
    // relative /api → same origin as the frontend
    return "";
  }, []);

  const previewPath = theme.previewImage?.url || "";
  const iframeSrc = previewPath
    ? (previewPath.startsWith("http") ? previewPath : `${backendOrigin}${previewPath}`)
    : "";

  // Fullscreen preview URL (opens new tab)
  const fullPreviewUrl = iframeSrc;

  const scale = compact ? 0.28 : 0.34;
  const invPct = `${Math.round(100 / scale)}%`;

  return (
    <div
      className={"card h-100 border-2 " + (active ? "border-primary shadow" : "border")}
      style={{
        cursor: "pointer",
        transition: "transform .2s, box-shadow .2s, border-color .2s",
        borderRadius: 14,
        overflow: "hidden",
      }}
      onClick={onSelect}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
    >
      {/* Preview area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: compact ? "16/11" : "16/10",
          overflow: "hidden",
          background: "linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 100%)",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {iframeSrc ? (
          <>
            <iframe
              src={iframeSrc}
              title={`${theme.name} preview`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              style={{
                position: "absolute",
                top: 0, left: 0,
                width: invPct,
                height: invPct,
                border: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                pointerEvents: "none",
                background: "#fff",
                opacity: loaded ? 1 : 0,
                transition: "opacity .4s",
              }}
              scrolling="no"
            />
            {!loaded && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#94a3b8", fontSize: ".85rem",
              }}>
                <div>
                  <div className="spinner-border spinner-border-sm text-secondary mb-2"></div>
                  <div className="small">Loading preview…</div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Fallback when theme has no preview URL (single-page themes we didn't build previews for)
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "#64748b", background: "linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)",
          }}>
            <i className="bi bi-palette-fill" style={{ fontSize: "2.5rem", opacity: .3 }}></i>
            <div className="small mt-2 text-muted">{theme.themeKey}</div>
          </div>
        )}

        {/* Selected overlay */}
        {active && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "var(--bs-primary, #0d6efd)",
            color: "#fff",
            padding: "5px 10px",
            borderRadius: 999,
            fontSize: ".75rem",
            fontWeight: 700,
            display: "flex", alignItems: "center", gap: 4,
            boxShadow: "0 4px 12px rgba(13,110,253,.35)",
          }}>
            <i className="bi bi-check-circle-fill"></i>
            Selected
          </div>
        )}

        {/* Expand fullscreen button */}
        {fullPreviewUrl && (
          <a
            href={fullPreviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="btn btn-sm btn-light shadow-sm"
            style={{
              position: "absolute",
              bottom: 10, right: 10,
              padding: "4px 10px",
              fontSize: ".78rem",
              fontWeight: 600,
              opacity: .95,
            }}
            title="Open full preview in new tab"
          >
            <i className="bi bi-box-arrow-up-right me-1"></i>Full preview
          </a>
        )}
      </div>

      {/* Info */}
      <div className={"card-body " + (compact ? "p-3" : "p-3")}>
        <div className="d-flex justify-content-between align-items-start mb-1">
          <div className="fw-bold" style={{ fontSize: compact ? ".95rem" : "1rem" }}>{theme.name}</div>
          {active && !compact && <i className="bi bi-check-circle-fill text-primary"></i>}
        </div>
        <code className="small text-muted d-block">{theme.themeKey}</code>
        {!compact && theme.description && (
          <p className="small text-muted mt-2 mb-0" style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {theme.description}
          </p>
        )}
      </div>
    </div>
  );
}
