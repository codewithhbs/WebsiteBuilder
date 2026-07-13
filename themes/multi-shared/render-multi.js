/* ─────────────────────────────────────────────────────────────────
   render-multi.js — Shared engine for multi-page WebsiteBuilder themes
   ─────────────────────────────────────────────────────────────────
   Used by theme-m1 … theme-m5. Each theme provides its own CSS and
   shell HTML (header / footer / <main id="pageContent">), this file
   does all the heavy lifting:

     1. Read window.__SITE_SLUG__ + window.__PAGE_KEY__
     2. Fetch site once: GET /api/public/site/:slug
     3. Fetch page list once: GET /api/public/site/:slug/pages
     4. Build navigation, hydrate header/footer (data-bind)
     5. Fetch current page: GET /api/public/site/:slug/page/:pageKey
     6. Render section blocks into <main id="pageContent">
     7. Wire client-side routing (history pushState + popstate)
     8. Wire callback / contact form
   ───────────────────────────────────────────────────────────────── */

(function () {
  // API base is injected by the backend as window.__API_BASE__ so the
  // renderer works on local dev (relative /api → same origin) and on
  // production (absolute URL to the API server). Fallback keeps older
  // deployments working.
  const apiBase = (typeof window !== "undefined" && window.__API_BASE__)
    ? window.__API_BASE__
    : "https://webgmbapi.hovermedia.in/api";

  const $ = (s, root) => (root || document).querySelector(s);
  const $$ = (s, root) => [...(root || document).querySelectorAll(s)];

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;",
    }[c]));

  const getPath = (obj, path) =>
    String(path || "").split(".").reduce((a, k) => (a != null ? a[k] : undefined), obj);

  const digits = (s) => String(s || "").replace(/[^\d]/g, "");

  const waLink = (phone) => {
    const d = digits(phone);
    if (!d) return "#";
    const num = d.length === 10 ? "91" + d : d;
    return `https://wa.me/${num}`;
  };

  const telHref = (phone) => (phone ? `tel:${phone}` : "#");
  const mailHref = (email) => (email ? `mailto:${email}` : "#");


  /* ─── COLOR THEMING ─── */
  function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
  }
  function shade(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const f = (c) => Math.max(0, Math.min(255, Math.round(c + (percent / 100) * 255)));
    return `#${[f(rgb.r), f(rgb.g), f(rgb.b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }
  function applyBrandColors(basicInfo) {
    if (!basicInfo) return;
    const root = document.documentElement;
    if (basicInfo.primaryColor) {
      root.style.setProperty("--primary", basicInfo.primaryColor);
      root.style.setProperty("--primary-dark", shade(basicInfo.primaryColor, -12));
      root.style.setProperty("--primary-light", shade(basicInfo.primaryColor, 45));
      const rgb = hexToRgb(basicInfo.primaryColor);
      if (rgb) root.style.setProperty("--primary-rgb", `${rgb.r},${rgb.g},${rgb.b}`);
    }
    if (basicInfo.secondaryColor) {
      root.style.setProperty("--accent", basicInfo.secondaryColor);
    }
  }


  /* ─── DATA BINDING (shell only — header/footer) ─── */
  function bindShell(site) {
    $$("[data-bind]").forEach((el) => {
      const v = getPath(site, el.getAttribute("data-bind"));
      if (v != null && v !== "") el.textContent = v;
    });
    $$("[data-bind-attr]").forEach((el) => {
      const [path, attr] = el.getAttribute("data-bind-attr").split("|");
      const v = getPath(site, path);
      if (v) el.setAttribute(attr, v);
    });
  }


  /* ─── ICONS (used across sections) ─── */
  const I = {
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 13 13 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 13 13 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    rocket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/></svg>`,
    zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    award: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>`,
  };
  function svgFor(name) {
    if (!name) return I.check;
    const key = String(name).replace(/^bi[-\s]*/, "").trim().toLowerCase();
    return I[key] || I.check;
  }


  /* ═══════════════════════════════════════════════════════════════
     SECTION RENDERERS — one function per supported section type.
     Each takes (data, ctx) where ctx has helpful site references.
     All output is wrapped in <section class="ms-{type}">.
     ═══════════════════════════════════════════════════════════════ */

  function R_hero(d, ctx) {
    // variant: centered | split | imageBg | slider | gradient | minimal
    const variant = d.variant || "centered";

    const cta1 = d.ctaText
      ? `<a class="ms-btn ms-btn-primary" href="${esc(d.ctaLink || "#")}">${esc(d.ctaText)}</a>`
      : "";
    const cta2 = d.secondaryCtaText
      ? `<a class="ms-btn ms-btn-outline" href="${esc(d.secondaryCtaLink || "#")}">${esc(d.secondaryCtaText)}</a>`
      : "";
    // light-variant buttons for use on dark image/overlay backgrounds
    const cta1Light = d.ctaText
      ? `<a class="ms-btn ms-btn-light" href="${esc(d.ctaLink || "#")}">${esc(d.ctaText)}</a>`
      : "";
    const cta2Light = d.secondaryCtaText
      ? `<a class="ms-btn ms-btn-outline-light" href="${esc(d.secondaryCtaLink || "#")}">${esc(d.secondaryCtaText)}</a>`
      : "";

    const img = d.image?.url
      ? `<img src="${esc(d.image.url)}" alt="${esc(d.image.alt || d.title || "")}" class="ms-hero-img">`
      : "";

    // chips
    const chipsArr = Array.isArray(d.chips) ? d.chips : [];
    const chipsHtml = chipsArr.length
      ? `<div class="ms-hero-chips">${chipsArr.map((c) => {
          const isObj = c && typeof c === "object";
          const label = isObj ? c.label : c;
          const icon  = isObj ? svgFor(c.icon || "check") : I.check;
          return `<span class="ms-chip">${icon}${esc(label || "")}</span>`;
        }).join("")}</div>`
      : "";

    // ── overlay: color themed to primary by default, opacity controllable ──
    // d.overlayStyle: "solid" | "gradient" | "none"  (default gradient)
    // d.overlayOpacity: 0..100 (default 60)
    // d.overlayColor: "primary" | "dark" | custom hex (default primary)
    function overlayCss() {
      const op = (typeof d.overlayOpacity === "number" ? d.overlayOpacity : 60) / 100;
      const style = d.overlayStyle || "gradient";
      if (style === "none") return "";
      let base;
      if (d.overlayColor === "dark") base = "10, 15, 25";
      else if (d.overlayColor && /^#/.test(d.overlayColor)) {
        const r = parseInt(d.overlayColor.slice(1,3),16),
              g = parseInt(d.overlayColor.slice(3,5),16),
              b = parseInt(d.overlayColor.slice(5,7),16);
        base = `${r}, ${g}, ${b}`;
      } else base = "var(--primary-rgb)";
      if (style === "solid")
        return `background: rgba(${base}, ${op});`;
      // gradient (diagonal, stronger at bottom-left for text legibility)
      return `background: linear-gradient(135deg, rgba(${base}, ${op}) 0%, rgba(${base}, ${op * 0.7}) 45%, rgba(${base}, ${op * 0.35}) 100%);`;
    }

    const inner = (light) => `
      ${d.eyebrow ? `<div class="ms-eyebrow${light ? " ms-eyebrow--light" : ""}">${esc(d.eyebrow)}</div>` : ""}
      <h1 class="ms-hero-title">${esc(d.title || "")}</h1>
      ${d.subtitle ? `<p class="ms-hero-sub">${esc(d.subtitle)}</p>` : ""}
      ${chipsHtml}
      <div class="ms-hero-actions">${light ? cta1Light + cta2Light : cta1 + cta2}</div>`;

    /* ── MINIMAL ── */
    if (variant === "minimal") {
      return `
      <section class="ms-hero ms-hero--minimal">
        <div class="ms-container">
          <div class="ms-hero-inner">
            ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
            <h1 class="ms-hero-title">${esc(d.title || "")}</h1>
            ${d.subtitle ? `<p class="ms-hero-sub">${esc(d.subtitle)}</p>` : ""}
          </div>
        </div>
      </section>`;
    }

    /* ── SPLIT ── */
    if (variant === "split") {
      return `
      <section class="ms-hero ms-hero--split">
        <div class="ms-container ms-hero-grid">
          <div class="ms-hero-text">${inner(false)}</div>
          ${img ? `<div class="ms-hero-media">${img}</div>` : `<div class="ms-hero-media ms-hero-visual"></div>`}
        </div>
      </section>`;
    }

    /* ── GRADIENT ── (theme gradient background, light text) */
    if (variant === "gradient") {
      return `
      <section class="ms-hero ms-hero--gradient ms-hero--onDark">
        <div class="ms-container">
          <div class="ms-hero-inner">${inner(true)}</div>
        </div>
      </section>`;
    }

    /* ── IMAGE BACKGROUND ── (single bg image + overlay + centered text) */
    if (variant === "imageBg") {
      const bg = d.image?.url ? `style="background-image:url('${esc(d.image.url)}')"` : "";
      return `
      <section class="ms-hero ms-hero--imageBg ms-hero--onDark">
        <div class="ms-hero-bgimg" ${bg}></div>
        <div class="ms-hero-overlay" style="${overlayCss()}"></div>
        <div class="ms-container">
          <div class="ms-hero-inner">${inner(true)}</div>
        </div>
      </section>`;
    }

    /* ── SLIDER ── (multiple bg images auto-rotate + overlay + text) */
    if (variant === "slider") {
      // images from d.slides[] (each {url}) OR d.images[] OR fallback single d.image
      let slides = [];
      if (Array.isArray(d.slides) && d.slides.length)
        slides = d.slides.map((s) => (typeof s === "string" ? s : s?.url)).filter(Boolean);
      else if (Array.isArray(d.images) && d.images.length)
        slides = d.images.map((s) => (typeof s === "string" ? s : s?.url)).filter(Boolean);
      else if (d.image?.url) slides = [d.image.url];

      const slidesHtml = slides.length
        ? slides.map((u, i) => `<div class="ms-hero-slide${i === 0 ? " active" : ""}" style="background-image:url('${esc(u)}')"></div>`).join("")
        : `<div class="ms-hero-slide active ms-hero-visual"></div>`;
      const dots = slides.length > 1
        ? `<div class="ms-hero-dots">${slides.map((_, i) => `<button class="ms-hero-dot${i === 0 ? " active" : ""}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>`).join("")}</div>`
        : "";

      return `
      <section class="ms-hero ms-hero--slider ms-hero--onDark" data-hero-slider data-interval="${Number(d.slideInterval) || 5000}">
        <div class="ms-hero-slides">${slidesHtml}</div>
        <div class="ms-hero-overlay" style="${overlayCss()}"></div>
        <div class="ms-container">
          <div class="ms-hero-inner">${inner(true)}</div>
        </div>
        ${dots}
      </section>`;
    }

    /* ── CENTERED (default) ── optional soft bg image with overlay */
    const hasBg = d.image?.url && d.useImageBackground;
    if (hasBg) {
      return `
      <section class="ms-hero ms-hero--centered ms-hero--imageBg ms-hero--onDark">
        <div class="ms-hero-bgimg" style="background-image:url('${esc(d.image.url)}')"></div>
        <div class="ms-hero-overlay" style="${overlayCss()}"></div>
        <div class="ms-container">
          <div class="ms-hero-inner">${inner(true)}</div>
        </div>
      </section>`;
    }
    return `
    <section class="ms-hero ms-hero--centered">
      <div class="ms-container">
        <div class="ms-hero-inner">
          ${inner(false)}
          ${img ? `<div class="ms-hero-media ms-hero-media--center">${img}</div>` : ""}
        </div>
      </div>
    </section>`;
  }

  function R_about(d) {
    const variant = d.variant || "image-right";
    const image = d.image?.url
      ? `<img src="${esc(d.image.url)}" alt="${esc(d.image.alt || d.heading || "")}" class="ms-about-img">`
      : `<div class="ms-about-placeholder">${I.users}</div>`;
    const highlights = (d.highlights || [])
      .map((h) => `<li><span class="ms-check">${I.check}</span>${esc(h)}</li>`)
      .join("");

    return `
    <section class="ms-about ms-about--${variant}">
      <div class="ms-container ms-about-grid">
        <div class="ms-about-media">${image}</div>
        <div class="ms-about-content">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          <h2 class="ms-h2">${esc(d.heading || "")}</h2>
          ${d.body ? `<p class="ms-body">${esc(d.body)}</p>` : ""}
          ${highlights ? `<ul class="ms-checklist">${highlights}</ul>` : ""}
        </div>
      </div>
    </section>`;
  }

  function R_features(d) {
    const cols = Math.max(1, Math.min(6, d.columns || 3));
    const items = (d.items || []).map((it) => `
      <div class="ms-feature">
        ${it.icon ? `<div class="ms-feature-icon">${svgFor(it.icon)}</div>` : ""}
        <h3 class="ms-feature-title">${esc(it.title || "")}</h3>
        ${it.description ? `<p class="ms-feature-desc">${esc(it.description)}</p>` : ""}
      </div>`).join("");
    return `
    <section class="ms-features">
      <div class="ms-container">
        <div class="ms-section-header">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
          ${d.subheading ? `<p class="ms-sub">${esc(d.subheading)}</p>` : ""}
        </div>
        <div class="ms-features-grid" style="--cols:${cols}">${items}</div>
      </div>
    </section>`;
  }

  function R_services(d, ctx) {
    const phone = ctx.contactPhone;
    const wa = ctx.contactWa;
    const items = (d.items || []).map((s) => `
      <article class="ms-service">
        ${s.image?.url
          ? `<div class="ms-service-img"><img src="${esc(s.image.url)}" alt="${esc(s.title)}" loading="lazy"></div>`
          : `<div class="ms-service-img ms-service-img--icon">${svgFor(s.icon || "settings")}</div>`
        }
        <div class="ms-service-body">
          <h3 class="ms-service-title">${esc(s.title || "")}</h3>
          ${s.description ? `<p class="ms-service-desc">${esc(s.description)}</p>` : ""}
          ${s.price ? `<div class="ms-service-price">${esc(s.price)}</div>` : ""}
          <div class="ms-service-actions">
            ${s.link
              ? `<a class="ms-btn ms-btn-primary" href="${esc(s.link)}">Learn More</a>`
              : phone
                ? `<a class="ms-btn ms-btn-primary" href="${esc(telHref(phone))}"><span class="ms-btn-icon">${I.phone}</span>Call</a>`
                : ""
            }
            ${wa
              ? `<a class="ms-btn ms-btn-whatsapp" target="_blank" rel="noopener" href="${esc(wa)}"><span class="ms-btn-icon">${I.whatsapp}</span>WhatsApp</a>`
              : ""
            }
          </div>
        </div>
      </article>`).join("");
    return `
    <section class="ms-services">
      <div class="ms-container">
        <div class="ms-section-header">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
          ${d.subheading ? `<p class="ms-sub">${esc(d.subheading)}</p>` : ""}
        </div>
        <div class="ms-services-grid">${items}</div>
      </div>
    </section>`;
  }

  function R_cta(d) {
    const bg = d.background || "primary";
    const cta1 = d.ctaText
      ? `<a class="ms-btn ms-btn-light" href="${esc(d.ctaLink || "#")}">${esc(d.ctaText)}</a>`
      : "";
    const cta2 = d.secondaryCtaText
      ? `<a class="ms-btn ms-btn-outline-light" href="${esc(d.secondaryCtaLink || "#")}">${esc(d.secondaryCtaText)}</a>`
      : "";
    return `
    <section class="ms-cta ms-cta--${bg}" ${d.image?.url ? `style="background-image:url('${esc(d.image.url)}')"` : ""}>
      <div class="ms-container">
        <div class="ms-cta-inner">
          ${d.eyebrow ? `<div class="ms-eyebrow ms-eyebrow--light">${esc(d.eyebrow)}</div>` : ""}
          <h2 class="ms-h2 ms-h2--light">${esc(d.heading || "")}</h2>
          ${d.subheading ? `<p class="ms-cta-sub">${esc(d.subheading)}</p>` : ""}
          <div class="ms-cta-actions">${cta1}${cta2}</div>
        </div>
      </div>
    </section>`;
  }

  function R_testimonials(d) {
    const items = (d.items || []).map((t) => {
      const initial = (t.name || "?").trim().charAt(0).toUpperCase();
      const r = Math.max(1, Math.min(5, t.rating || 5));
      return `
        <article class="ms-testimonial">
          <div class="ms-stars">${"★".repeat(r)}<span class="ms-stars-dim">${"★".repeat(5 - r)}</span></div>
          <p class="ms-testimonial-text">${esc(t.text || "")}</p>
          <div class="ms-testimonial-author">
            <div class="ms-avatar">${t.avatar?.url ? `<img src="${esc(t.avatar.url)}" alt="${esc(t.name)}">` : esc(initial)}</div>
            <div>
              <div class="ms-author-name">${esc(t.name || "")}</div>
              ${t.designation ? `<div class="ms-author-role">${esc(t.designation)}</div>` : ""}
            </div>
          </div>
        </article>`;
    }).join("");
    return `
    <section class="ms-testimonials">
      <div class="ms-container">
        <div class="ms-section-header">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
        </div>
        <div class="ms-testimonials-grid">${items}</div>
      </div>
    </section>`;
  }

  function R_faq(d) {
    const items = (d.items || []).map((f, i) => `
      <div class="ms-faq-item${i === 0 ? " open" : ""}">
        <button class="ms-faq-q" type="button">
          <span>${esc(f.question || "")}</span>
          <span class="ms-faq-icon">${I.plus}</span>
        </button>
        <div class="ms-faq-a"><p>${esc(f.answer || "")}</p></div>
      </div>`).join("");
    return `
    <section class="ms-faq">
      <div class="ms-container">
        <div class="ms-section-header">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
        </div>
        <div class="ms-faq-list">${items}</div>
      </div>
    </section>`;
  }

  function R_gallery(d) {
    const items = (d.items || []).map((g) => `
      <figure class="ms-gallery-item">
        ${g.url ? `<img src="${esc(g.url)}" alt="${esc(g.caption || "")}" loading="lazy">` : ""}
        ${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}
      </figure>`).join("");
    return `
    <section class="ms-gallery">
      <div class="ms-container">
        <div class="ms-section-header">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
        </div>
        <div class="ms-gallery-grid">${items}</div>
      </div>
    </section>`;
  }

  function R_team(d) {
    const items = (d.items || []).map((m) => `
      <article class="ms-team-card">
        <div class="ms-team-photo">${m.photo?.url ? `<img src="${esc(m.photo.url)}" alt="${esc(m.name)}">` : I.user}</div>
        <h3 class="ms-team-name">${esc(m.name || "")}</h3>
        ${m.role ? `<div class="ms-team-role">${esc(m.role)}</div>` : ""}
        ${m.bio ? `<p class="ms-team-bio">${esc(m.bio)}</p>` : ""}
      </article>`).join("");
    return `
    <section class="ms-team">
      <div class="ms-container">
        <div class="ms-section-header">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
        </div>
        <div class="ms-team-grid">${items}</div>
      </div>
    </section>`;
  }

  function R_pricing(d) {
    const plans = (d.plans || []).map((p) => `
      <div class="ms-pricing-card${p.highlighted ? " ms-pricing-card--featured" : ""}">
        ${p.badge ? `<div class="ms-pricing-badge">${esc(p.badge)}</div>` : ""}
        <h3 class="ms-pricing-name">${esc(p.name || "")}</h3>
        <div class="ms-pricing-price">${esc(p.price || "")}</div>
        ${p.period ? `<div class="ms-pricing-period">${esc(p.period)}</div>` : ""}
        <ul class="ms-pricing-feats">
          ${(p.features || []).map((f) => `<li><span class="ms-check">${I.check}</span>${esc(f)}</li>`).join("")}
        </ul>
        ${p.ctaText
          ? `<a class="ms-btn ${p.highlighted ? "ms-btn-primary" : "ms-btn-outline"} ms-btn-block" href="${esc(p.ctaLink || "#")}">${esc(p.ctaText)}</a>`
          : ""
        }
      </div>`).join("");
    return `
    <section class="ms-pricing">
      <div class="ms-container">
        <div class="ms-section-header">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
          ${d.subheading ? `<p class="ms-sub">${esc(d.subheading)}</p>` : ""}
        </div>
        <div class="ms-pricing-grid">${plans}</div>
      </div>
    </section>`;
  }

  function R_stats(d) {
    const items = (d.items || []).map((s) => `
      <div class="ms-stat">
        <div class="ms-stat-num">${esc(s.number || "")}</div>
        <div class="ms-stat-label">${esc(s.label || "")}</div>
      </div>`).join("");
    return `
    <section class="ms-stats">
      <div class="ms-container">
        <div class="ms-stats-grid">${items}</div>
      </div>
    </section>`;
  }

  function R_text(d) {
    const align = d.alignment || "left";
    return `
    <section class="ms-text">
      <div class="ms-container ms-text-inner" style="text-align:${esc(align)}">
        ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
        ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
        ${d.body ? `<div class="ms-text-body">${esc(d.body)}</div>` : ""}
      </div>
    </section>`;
  }

  function R_banner(d) {
    return `
    <section class="ms-banner-block">
      <div class="ms-container">
        <div class="ms-banner-inner" ${d.image?.url ? `style="background-image:url('${esc(d.image.url)}')"` : ""}>
          <div class="ms-banner-text">
            ${d.title ? `<h3>${esc(d.title)}</h3>` : ""}
            ${d.subtitle ? `<p>${esc(d.subtitle)}</p>` : ""}
          </div>
          ${d.ctaText ? `<a class="ms-btn ms-btn-light" href="${esc(d.ctaLink || "#")}">${esc(d.ctaText)}</a>` : ""}
        </div>
      </div>
    </section>`;
  }

  function R_contact(d, ctx) {
    const c = ctx.site.contact || {};
    return `
    <section class="ms-contact">
      <div class="ms-container ms-contact-grid">
        <div class="ms-contact-info">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
          ${d.body ? `<p class="ms-body">${esc(d.body)}</p>` : ""}
          <ul class="ms-contact-list">
            ${c.address ? `<li><span class="ms-ci">${I.pin}</span><span>${esc(c.address)}</span></li>` : ""}
            ${c.phone ? `<li><span class="ms-ci">${I.phone}</span><a href="${esc(telHref(c.phone))}">${esc(c.phone)}</a></li>` : ""}
            ${c.email ? `<li><span class="ms-ci">${I.mail}</span><a href="${esc(mailHref(c.email))}">${esc(c.email)}</a></li>` : ""}
            ${c.workingHours ? `<li><span class="ms-ci">${I.clock}</span><span>${esc(c.workingHours)}</span></li>` : ""}
          </ul>
          ${c.mapEmbedUrl
            ? `<div class="ms-contact-map"><iframe src="${esc(c.mapEmbedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`
            : ""
          }
        </div>
        ${d.showForm !== false ? `
          <form id="msContactForm" class="ms-contact-form">
            <h3 class="ms-form-heading">${esc(d.formHeading || "Send Us a Message")}</h3>
            <div class="ms-field"><label>Your Name</label><input name="name" required></div>
            <div class="ms-field"><label>Mobile Number</label><input name="phone" required></div>
            <div class="ms-field"><label>Email</label><input name="email" type="email"></div>
            <div class="ms-field"><label>Message</label><textarea name="message" rows="4"></textarea></div>
            <button type="submit" class="ms-btn ms-btn-primary ms-btn-block">Send Message</button>
            <div id="msContactStatus" class="ms-form-status"></div>
          </form>
        ` : ""}
      </div>
    </section>`;
  }

  function R_blogList(d) {
    const items = (d.items || []).map((p) => `
      <article class="ms-blog-card">
        ${p.image?.url ? `<div class="ms-blog-img"><img src="${esc(p.image.url)}" alt="${esc(p.title)}"></div>` : ""}
        <div class="ms-blog-body">
          ${p.date ? `<div class="ms-blog-date">${esc(p.date)}</div>` : ""}
          <h3 class="ms-blog-title">${esc(p.title || "")}</h3>
          ${p.excerpt ? `<p class="ms-blog-excerpt">${esc(p.excerpt)}</p>` : ""}
          ${p.link ? `<a class="ms-blog-link" href="${esc(p.link)}">Read more →</a>` : ""}
        </div>
      </article>`).join("");
    return `
    <section class="ms-blog">
      <div class="ms-container">
        <div class="ms-section-header">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
        </div>
        <div class="ms-blog-grid">${items}</div>
      </div>
    </section>`;
  }

  function R_videoEmbed(d) {
    if (!d.url) return "";
    return `
    <section class="ms-video">
      <div class="ms-container">
        ${d.heading ? `<h2 class="ms-h2 ms-text-center">${esc(d.heading)}</h2>` : ""}
        <div class="ms-video-wrap">
          <iframe src="${esc(d.url)}" frameborder="0" allowfullscreen loading="lazy"></iframe>
        </div>
      </div>
    </section>`;
  }

  function R_mapEmbed(d) {
    if (!d.url) return "";
    return `
    <section class="ms-map">
      <div class="ms-container">
        ${d.heading ? `<h2 class="ms-h2 ms-text-center">${esc(d.heading)}</h2>` : ""}
        <div class="ms-map-wrap">
          <iframe src="${esc(d.url)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>
    </section>`;
  }

  function R_logoCloud(d) {
    const items = (d.items || []).map((l) => `
      <div class="ms-logo">${l.url ? `<img src="${esc(l.url)}" alt="${esc(l.alt || "")}" loading="lazy">` : ""}</div>
    `).join("");
    return `
    <section class="ms-logocloud">
      <div class="ms-container">
        ${d.heading ? `<div class="ms-logocloud-heading">${esc(d.heading)}</div>` : ""}
        <div class="ms-logocloud-grid">${items}</div>
      </div>
    </section>`;
  }

  function R_richText(d) {
    return `
    <section class="ms-richtext">
      <div class="ms-container ms-richtext-inner">
        ${d.html || ""}
      </div>
    </section>`;
  }

  /* ─── NEW SECTIONS: steps · marquee · areas · callback ─── */

  // "How It Works" numbered timeline
  function R_steps(d) {
    const items = (d.items || []).map((s, i) => `
      <div class="ms-step">
        <div class="ms-step-num">${i + 1}</div>
        ${s.icon ? `<div class="ms-step-icon">${svgFor(s.icon)}</div>` : ""}
        <h3 class="ms-step-title">${esc(s.title || "")}</h3>
        ${s.description ? `<p class="ms-step-desc">${esc(s.description)}</p>` : ""}
      </div>`).join("");
    return `
    <section class="ms-steps">
      <div class="ms-container">
        <div class="ms-section-header">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
          ${d.subheading ? `<p class="ms-sub">${esc(d.subheading)}</p>` : ""}
        </div>
        <div class="ms-steps-grid" style="--steps:${(d.items || []).length || 4}">${items}</div>
      </div>
    </section>`;
  }

  // Infinite scrolling highlight strip
  function R_marquee(d) {
    const items = (d.items || []);
    if (!items.length) return "";
    const chunk = items.map((t) => `<span class="ms-marquee-item">${esc(t)}</span><span class="ms-marquee-dot">✦</span>`).join("");
    return `
    <section class="ms-marquee${d.background === "primary" ? " ms-marquee--primary" : ""}">
      <div class="ms-marquee-track">${chunk}${chunk}</div>
    </section>`;
  }

  // Service-area chips — each optionally tel-linked to site phone
  function R_areas(d, ctx) {
    const phone = ctx.contactPhone;
    const items = (d.items || []).map((a) => phone
      ? `<a class="ms-area-chip" href="${esc(telHref(phone))}"><span class="ms-area-ic">${I.pin}</span>${esc(a)}</a>`
      : `<span class="ms-area-chip"><span class="ms-area-ic">${I.pin}</span>${esc(a)}</span>`
    ).join("");
    return `
    <section class="ms-areas">
      <div class="ms-container">
        <div class="ms-section-header">
          ${d.eyebrow ? `<div class="ms-eyebrow">${esc(d.eyebrow)}</div>` : ""}
          ${d.heading ? `<h2 class="ms-h2">${esc(d.heading)}</h2>` : ""}
          ${d.subheading ? `<p class="ms-sub">${esc(d.subheading)}</p>` : ""}
        </div>
        <div class="ms-areas-wrap">${items}</div>
        ${d.note ? `<p class="ms-areas-note">${esc(d.note)}</p>` : ""}
      </div>
    </section>`;
  }

  // Callback / lead form — like theme3's hero form, submits to contact endpoint
  function R_callback(d, ctx) {
    return `
    <section class="ms-callback">
      <div class="ms-container">
        <div class="ms-callback-card">
          <div class="ms-callback-info">
            ${d.eyebrow ? `<div class="ms-eyebrow ms-eyebrow--light">${esc(d.eyebrow)}</div>` : ""}
            <h2 class="ms-h2 ms-h2--light">${esc(d.heading || "Request a Callback")}</h2>
            ${d.body ? `<p class="ms-callback-body">${esc(d.body)}</p>` : ""}
            ${ctx.contactPhone ? `
              <a class="ms-btn ms-btn-light" href="${esc(telHref(ctx.contactPhone))}">
                <span class="ms-btn-icon">${I.phone}</span>${esc(ctx.contactPhone)}
              </a>` : ""}
          </div>
          <form class="ms-callback-form" data-callback-form>
            <div class="ms-field"><label>Your Name</label><input name="name" required></div>
            <div class="ms-field"><label>Mobile Number</label><input name="phone" required></div>
            <div class="ms-field"><label>${esc(d.serviceLabel || "What do you need?")}</label><input name="message" placeholder="${esc(d.servicePlaceholder || "Briefly describe your requirement")}"></div>
            <button type="submit" class="ms-btn ms-btn-primary ms-btn-block">${esc(d.buttonText || "Request Callback")}</button>
            <div class="ms-form-status" data-callback-status></div>
          </form>
        </div>
      </div>
    </section>`;
  }

  const RENDERERS = {
    hero: R_hero,
    about: R_about,
    features: R_features,
    services: R_services,
    cta: R_cta,
    testimonials: R_testimonials,
    faq: R_faq,
    gallery: R_gallery,
    team: R_team,
    pricing: R_pricing,
    stats: R_stats,
    text: R_text,
    banner: R_banner,
    contact: R_contact,
    blogList: R_blogList,
    videoEmbed: R_videoEmbed,
    mapEmbed: R_mapEmbed,
    logoCloud: R_logoCloud,
    richText: R_richText,
    steps: R_steps,
    marquee: R_marquee,
    areas: R_areas,
    callback: R_callback,
  };


  /* ─── PAGE RENDER ─── */
  function renderPage(page, ctx) {
    const root = $("#pageContent");
    if (!root) return;
    const html = (page.sections || [])
      .map((sec) => {
        const fn = RENDERERS[sec.type];
        if (!fn) return "";
        try {
          return fn(sec.data || {}, ctx);
        } catch (e) {
          console.error("Renderer error:", sec.type, e);
          return "";
        }
      }).join("");
    root.innerHTML = html;

    initFaq();
    bindContactForm(ctx.site.slug);
    bindCallbackForms(ctx.site.slug);
    initHeroSliders();

    // page-level SEO
    if (page.seo?.title) document.title = page.seo.title;
    setMeta("description", page.seo?.description);
    window.scrollTo({ top: 0, behavior: "instant" });
  }


  /* ─── SEO META HELPER ─── */
  function setMeta(name, content) {
    if (!content) return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }


  /* ─── NAV / FOOTER LINKS ─── */
  /* ─── URL BUILDING ─── */
  // Build a URL for a page. In slug-prefix mode (local dev) URLs are
  // prefixed with /:slug ; on subdomain (production) they're not.
  function pageUrl(pageKey, isHomepage) {
    const prefix = state.bySlugPrefix && state.site ? "/" + state.site.slug : "";
    if (isHomepage || pageKey === "home") return prefix + "/";
    return prefix + "/" + pageKey;
  }

  function buildNav(pages) {
    const navWrap = $("#siteNav");
    if (!navWrap) return;
    const sorted = (pages || [])
      .filter((p) => p.showInNav !== false)
      .sort((a, b) => (a.navOrder || 0) - (b.navOrder || 0));
    navWrap.innerHTML = sorted
      .map((p) => `<a class="ms-nav-link" data-pagekey="${esc(p.pageKey)}" href="${pageUrl(p.pageKey, p.isHomepage)}">${esc(p.navLabel || p.title || p.pageKey)}</a>`)
      .join("");

    // also build footer nav if present
    const footerNav = $("#footerNav");
    if (footerNav) {
      footerNav.innerHTML = sorted
        .map((p) => `<li><a data-pagekey="${esc(p.pageKey)}" href="${pageUrl(p.pageKey, p.isHomepage)}">${esc(p.navLabel || p.title || p.pageKey)}</a></li>`)
        .join("");
    }

    // fix static brand link in header (was hardcoded href="/")
    $$(".ms-brand[data-pagekey]").forEach((a) => a.setAttribute("href", pageUrl("home", true)));

    wireRouting();
  }

  function highlightCurrentNav(pageKey) {
    $$(".ms-nav-link, #footerNav a").forEach((a) => {
      const k = a.getAttribute("data-pagekey");
      a.classList.toggle("active", k === pageKey);
    });
  }


  /* ─── ROUTING ─── */
  function wireRouting() {
    $$("a[data-pagekey]").forEach((a) => {
      if (a.__wired) return;
      a.__wired = true;
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        const key = a.getAttribute("data-pagekey");
        navigateTo(key);
      });
    });
  }

  async function navigateTo(pageKey) {
    const pg = state.pages.find((p) => p.pageKey === pageKey);
    const isHome = pg?.isHomepage || pageKey === "home";
    history.pushState({ pageKey }, "", pageUrl(pageKey, isHome));
    closeMobileNav();
    await loadAndRender(pageKey);
  }


  /* ─── FAQ ACCORDION (re-init after each page render) ─── */
  function initFaq() {
    $$(".ms-faq-item .ms-faq-q").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".ms-faq-item");
        const opened = item.classList.contains("open");
        $$(".ms-faq-item").forEach((x) => x.classList.remove("open"));
        if (!opened) item.classList.add("open");
      });
    });
  }


  /* ─── HERO BACKGROUND SLIDER ─── */
  function initHeroSliders() {
    $$("[data-hero-slider]").forEach((hero) => {
      if (hero.__slider) return;
      hero.__slider = true;
      const slides = $$(".ms-hero-slide", hero);
      const dots = $$(".ms-hero-dot", hero);
      if (slides.length < 2) return;
      let idx = 0;
      const interval = parseInt(hero.getAttribute("data-interval"), 10) || 5000;

      function go(n) {
        idx = (n + slides.length) % slides.length;
        slides.forEach((s, i) => s.classList.toggle("active", i === idx));
        dots.forEach((dt, i) => dt.classList.toggle("active", i === idx));
      }
      dots.forEach((dt) =>
        dt.addEventListener("click", () => {
          go(parseInt(dt.getAttribute("data-slide"), 10));
          restart();
        })
      );
      let timer = setInterval(() => go(idx + 1), interval);
      function restart() { clearInterval(timer); timer = setInterval(() => go(idx + 1), interval); }
    });
  }


  /* ─── CONTACT FORM ─── */
  function bindContactForm(slug) {
    const form = $("#msContactForm");
    if (!form || form.__bound) return;
    form.__bound = true;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = $("#msContactStatus");
      const btn = form.querySelector("[type=submit]");
      const data = Object.fromEntries(new FormData(form));
      status.textContent = "Sending…";
      status.className = "ms-form-status";
      btn.disabled = true;
      try {
        const res = await fetch(`${apiBase}/public/site/${encodeURIComponent(slug)}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            message: data.message || "",
          }),
        });
        const json = await res.json();
        if (json.success) {
          status.textContent = "✓ Message sent! We'll get back to you soon.";
          status.className = "ms-form-status success";
          form.reset();
        } else throw new Error(json.message || "Failed");
      } catch (err) {
        status.textContent = "✗ " + (err.message || "Could not send.");
        status.className = "ms-form-status error";
      } finally {
        btn.disabled = false;
      }
    });
  }

  // Callback lead forms (one or more per page, [data-callback-form])
  function bindCallbackForms(slug) {
    $$("[data-callback-form]").forEach((form) => {
      if (form.__bound) return;
      form.__bound = true;
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const status = form.querySelector("[data-callback-status]");
        const btn = form.querySelector("[type=submit]");
        const data = Object.fromEntries(new FormData(form));
        if (status) { status.textContent = "Sending…"; status.className = "ms-form-status"; }
        btn.disabled = true;
        try {
          const res = await fetch(`${apiBase}/public/site/${encodeURIComponent(slug)}/contact`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.name || "",
              phone: data.phone || "",
              email: "",
              message: data.message || "Callback request",
            }),
          });
          const json = await res.json();
          if (json.success) {
            if (status) { status.textContent = "✓ Request received! We'll call you back shortly."; status.className = "ms-form-status success"; }
            form.reset();
          } else throw new Error(json.message || "Failed");
        } catch (err) {
          if (status) { status.textContent = "✗ " + (err.message || "Could not send."); status.className = "ms-form-status error"; }
        } finally {
          btn.disabled = false;
        }
      });
    });
  }


  /* ─── MOBILE NAV ─── */
  function initMobileNav() {
    const toggle = $("#navToggle");
    const nav = $("#mobileNav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("open");
      nav.classList.toggle("open");
    });
  }
  function closeMobileNav() {
    $("#navToggle")?.classList.remove("open");
    $("#mobileNav")?.classList.remove("open");
  }


  /* ─── FOOTER (social icons, services list) ─── */
  const SOCIAL = {
    facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4z"/></svg>`,
    twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    whatsapp: I.whatsapp,
    website: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg>`,
  };

  function renderFooter(site) {
    const f = site.footer || {};
    const sw = $("#footerSocials");
    if (sw && f.socialLinks) {
      sw.innerHTML = Object.entries(f.socialLinks)
        .filter(([, v]) => !!v)
        .map(([k, v]) =>
          `<a class="ms-social" href="${esc(v)}" target="_blank" rel="noopener" title="${k}">${SOCIAL[k] || SOCIAL.website}</a>`
        ).join("");
    }
  }

  function wireContactLinks(site) {
    const c = site.contact || {};
    const wa = site.footer?.socialLinks?.whatsapp || waLink(c.phone);
    $$("[data-link='tel']").forEach((a) => a.href = telHref(c.phone));
    $$("[data-link='mail']").forEach((a) => a.href = mailHref(c.email));
    $$("[data-link='wa']").forEach((a) => a.href = wa);
  }


  /* ─── BASIC INFO (logo, favicon) ─── */
  function applyBasicInfo(b) {
    if (!b) return;
    const lg = $("#brandLogo");
    if (b.logo?.url && lg) { lg.src = b.logo.url; lg.style.display = ""; }
    const fav = $("#favicon");
    if (b.favicon?.url && fav) fav.href = b.favicon.url;
    applyBrandColors(b);
  }


  /* ─── STATE ─── */
  const state = {
    site: null,
    pages: [],
    currentPageKey: null,
    bySlugPrefix: false,  // true when served from /:slug/... (local dev)
  };


  /* ─── PAGE LOAD ─── */
  async function loadAndRender(pageKey) {
    state.currentPageKey = pageKey;
    highlightCurrentNav(pageKey);
    try {
      const res = await fetch(`${apiBase}/public/site/${encodeURIComponent(state.site.slug)}/page/${encodeURIComponent(pageKey)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      const ctx = {
        site: state.site,
        contactPhone: state.site.contact?.phone || "",
        contactWa: state.site.footer?.socialLinks?.whatsapp || waLink(state.site.contact?.phone),
      };
      renderPage(json.page, ctx);
    } catch (err) {
      console.error(err);
      $("#pageContent").innerHTML = `<div style="padding:80px 20px;text-align:center"><h2>Page not found</h2><p>${esc(err.message || "")}</p></div>`;
    }
  }


  /* ─── INIT ─── */
  async function init() {
    let slug = window.__SITE_SLUG__;
    let pageKey = window.__PAGE_KEY__ || "home";

    if (!slug) {
      // fallback: try ?slug=X (dev mode)
      const sp = new URLSearchParams(location.search);
      slug = sp.get("slug");
    }

    if (!slug) {
      document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:40px"><div><h2>No site slug</h2><p style="color:#6b7280">Open via subdomain or ?slug=name</p></div></div>`;
      return;
    }

    // Detect routing mode by comparing URL first segment with slug:
    //   /gym          → firstSegment="gym", slug="gym" → slug-prefix (local dev)
    //   /gym/about    → firstSegment="gym", slug="gym" → slug-prefix (local dev)
    //   /about        → firstSegment="about", slug="gym" → subdomain (prod)
    //   /             → firstSegment=undefined, slug="gym" → subdomain (prod)
    const firstSegment = location.pathname.split("/").filter(Boolean)[0];
    state.bySlugPrefix = firstSegment === slug;

    try {
      const [siteR, pagesR] = await Promise.all([
        fetch(`${apiBase}/public/site/${encodeURIComponent(slug)}`),
        fetch(`${apiBase}/public/site/${encodeURIComponent(slug)}/pages`),
      ]);
      const siteJ = await siteR.json();
      const pagesJ = await pagesR.json();
      if (!siteJ.success) throw new Error(siteJ.message);

      state.site = siteJ.site;
      state.pages = pagesJ.success ? pagesJ.pages : [];

      applyBasicInfo(state.site.basicInfo);
      bindShell(state.site);
      renderFooter(state.site);
      wireContactLinks(state.site);
      buildNav(state.pages);
      initMobileNav();

      // initial page render
      await loadAndRender(pageKey);

      // browser back/forward
      window.addEventListener("popstate", () => {
        const parts = location.pathname.split("/").filter(Boolean);
        let key = "home";
        if (state.bySlugPrefix) key = parts[1] || "home";
        else key = parts[0] || "home";
        loadAndRender(key);
      });

      // hide preloader
      const pl = $("#preloader");
      if (pl) {
        pl.classList.add("gone");
        setTimeout(() => pl.remove(), 400);
      }
    } catch (err) {
      console.error(err);
      document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:40px"><div><h2>Site unavailable</h2><p style="color:#6b7280">${esc(err.message || "")}</p></div></div>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
