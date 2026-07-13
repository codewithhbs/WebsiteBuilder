/* render3.js — Theme 3 hydration engine (Ajay Ambulance Style)
   Same API contract as theme1/theme2 — fully backward compatible.
   Pulls site data from /api/public/site/:slug and stats from /api/stats.
*/
(function () {
  const params = new URLSearchParams(location.search);
  const apiBase = (typeof window !== "undefined" && window.__API_BASE__) ? window.__API_BASE__ : "https://webgmbapi.hovermedia.in/api";

  let slug = window.__SITE_SLUG__ || params.get("slug");
  if (!slug) {
    const host = location.hostname, parts = host.split(".");
    if (parts.length >= 3) slug = parts[0];
    else if (parts.length === 2 && parts[0] !== "www") slug = parts[0];
  }

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function getPath(obj, path) {
    return path.split(".").reduce((a, k) => a != null ? a[k] : undefined, obj);
  }

  function digitsOnly(s) { return String(s || "").replace(/[^\d]/g, ""); }

  function waLinkFromPhone(phone) {
    const d = digitsOnly(phone);
    if (!d) return "#";
    // assume Indian number if 10 digits; add 91
    const num = d.length === 10 ? "91" + d : d;
    return `https://wa.me/${num}`;
  }


  /* ── DATA BINDING ─────────────────────────────────── */
  function setBound(site) {
    $$("[data-bind]").forEach(el => {
      const v = getPath(site, el.getAttribute("data-bind"));
      if (v != null && v !== "") el.textContent = v;
    });
    $$("[data-bind-attr]").forEach(el => {
      const [path, attr] = el.getAttribute("data-bind-attr").split("|");
      const v = getPath(site, path);
      if (v) el.setAttribute(attr, v);
    });
  }

  function hideDisabled(sections) {
    if (!sections) return;
    $$("[data-section]").forEach(el => {
      const k = el.getAttribute("data-section");
      if (sections[k] === false) el.style.display = "none";
    });
  }


  /* ── SEO META TAGS ────────────────────────────────── */
  function renderSeo(seo) {
    if (!seo) return;

    const setMeta = (name, content, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };

    const setLink = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
      el.setAttribute("href", href);
    };

    if (seo.title) document.title = seo.title;
    setMeta("description", seo.description);
    setMeta("keywords", Array.isArray(seo.keywords) ? seo.keywords.map(k => String(k).trim()).join(", ") : seo.keywords);
    setMeta("robots", seo.robots || "index, follow");
    setMeta("author", seo.author);
    setMeta("language", seo.language);
    setMeta("revisit-after", seo.revisitAfter);
    setMeta("rating", seo.rating);
    setMeta("distribution", seo.distribution);
    setLink("canonical", seo.canonicalUrl);

    setMeta("og:title", seo.ogTitle || seo.title, true);
    setMeta("og:description", seo.ogDescription || seo.description, true);
    setMeta("og:type", seo.ogType || "website", true);
    setMeta("og:url", seo.ogUrl || seo.canonicalUrl, true);
    if (seo.ogImage?.url) setMeta("og:image", seo.ogImage.url, true);

    setMeta("twitter:card", seo.twitterCard || "summary_large_image");
    setMeta("twitter:title", seo.twitterTitle || seo.ogTitle || seo.title);
    setMeta("twitter:description", seo.twitterDescription || seo.ogDescription || seo.description);
    if (seo.twitterImage?.url) setMeta("twitter:image", seo.twitterImage.url);

    if (seo.schemaType) {
      let ld = document.querySelector("script[type='application/ld+json']");
      if (!ld) { ld = document.createElement("script"); ld.type = "application/ld+json"; document.head.appendChild(ld); }
      ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": seo.schemaType,
        "name": seo.title,
        "description": seo.description,
        "url": seo.canonicalUrl || location.href,
        ...(seo.ogImage?.url ? { "image": seo.ogImage.url } : {})
      });
    }
  }


  /* ── BASIC INFO (logo, favicon, colors) ───────────── */
  function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
  }
  function shadeColor(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const f = (c) => Math.max(0, Math.min(255, Math.round(c + (percent / 100) * 255)));
    return `#${[f(rgb.r), f(rgb.g), f(rgb.b)].map(v => v.toString(16).padStart(2, "0")).join("")}`;
  }

  function renderBasic(b) {
    if (!b) return;
    const lg = $("#brandLogo");
    if (b.logo?.url && lg) { lg.src = b.logo.url; lg.style.display = ""; }
    const fav = $("#favicon"); if (b.favicon?.url && fav) fav.href = b.favicon.url;

    if (b.primaryColor) {
      document.documentElement.style.setProperty("--primary", b.primaryColor);
      document.documentElement.style.setProperty("--primary-dark", shadeColor(b.primaryColor, -12));
      const rgb = hexToRgb(b.primaryColor);
      if (rgb) document.documentElement.style.setProperty("--primary-rgb", `${rgb.r},${rgb.g},${rgb.b}`);
    }
    if (b.secondaryColor) document.documentElement.style.setProperty("--accent", b.secondaryColor);
  }


  /* ── HERO ─────────────────────────────────────────── */
  function renderHero(slides, about, services, settings) {
    settings = settings || {};
    const first = (slides && slides[0]) || null;
    const hero = $(".hero-section");
    const heroGrid = hero ? hero.querySelector(".hero-grid") : null;

    // chips from about.highlights (first 5)
    const chipsWrap = $("#heroChips");
    if (chipsWrap) {
      const chips = (about?.highlights || []).slice(0, 5);
      chipsWrap.innerHTML = chips.map(c => `<span class="hero-chip">${esc(c)}</span>`).join("");
    }

    // populate service dropdown in callback form
    const sel = $("#cbServiceSelect");
    if (sel) {
      const opts = (services || [])
        .filter(s => s.title)
        .map(s => `<option value="${esc(s.title)}">${esc(s.title)}</option>`)
        .join("");
      sel.innerHTML = `<option value="">Select a service</option>${opts}`;
    }

    if (!hero) return;

    // ── LAYOUT ──
    // layout: form | centered | split | imageBg | imageForm | slider | banner | gradient
    const layout = settings.layout || "form";
    hero.setAttribute("data-hero-layout", layout);

    // show / hide the callback form
    // form visible for: form, imageBg, imageForm, slider (unless user disabled it)
    // never for: centered, split, banner, gradient
    const formCol = hero.querySelector(".hero-right");
    const formLayouts = ["form", "imageBg", "imageForm", "slider"];
    const showForm = settings.showForm !== false && formLayouts.includes(layout);
    if (formCol) formCol.style.display = showForm ? "" : "none";

    // hide the whole text/content column for pure banner layout
    const leftCol = hero.querySelector(".hero-left");
    if (leftCol) leftCol.style.display = layout === "banner" ? "none" : "";

    // SPLIT layout: show the first image as a card in the right column (instead of the form)
    const rightCol = hero.querySelector(".hero-right");
    if (rightCol) {
      const existingSplit = rightCol.querySelector(".hero-split-img");
      if (existingSplit) existingSplit.remove();
      const firstImg = (slides || []).map(s => s?.image?.url).find(Boolean);
      if (layout === "split" && firstImg) {
        rightCol.style.display = "";
        const card = document.createElement("div");
        card.className = "hero-split-img";
        card.innerHTML = `<img src="${firstImg}" alt="">`;
        rightCol.appendChild(card);
      }
    }

    // ── BACKGROUND (image / slider / banner / gradient) ──
    const imgs = (slides || []).map(s => s?.image?.url).filter(Boolean);

    // remove any previous layer
    const oldLayer = hero.querySelector(".hero-slides-layer");
    if (oldLayer) oldLayer.remove();
    hero.classList.remove("has-hero-slides", "hero-gradient-bg", "hero-banner-only");

    // which layouts paint a full background image/slider behind content
    const bgImageLayouts = ["imageBg", "imageForm", "slider", "banner"];

    if (layout === "gradient") {
      hero.classList.add("hero-gradient-bg", "has-hero-slides");
      const layer = document.createElement("div");
      layer.className = "hero-slides-layer";
      layer.innerHTML = `<div class="hero-slide-overlay" style="${overlayStyle(settings)}"></div>`;
      hero.insertBefore(layer, hero.firstChild);
    } else if (bgImageLayouts.includes(layout) && imgs.length) {
      hero.classList.add("has-hero-slides");
      if (layout === "banner") hero.classList.add("hero-banner-only");

      const layer = document.createElement("div");
      layer.className = "hero-slides-layer";

      // imageBg + imageForm use first image only (unless multiple → they rotate too);
      // slider + banner rotate through all images
      const rotates = layout === "slider" || layout === "banner" || imgs.length > 1;
      const useImgs = imgs; // keep all; single-image case just won't rotate

      // banner layout: NO overlay by default (pure image), unless user set one
      const wantOverlay = layout === "banner"
        ? (settings.overlayStyle && settings.overlayStyle !== "none")
        : true;

      layer.innerHTML = useImgs.map((u, i) =>
        `<div class="hero-slide-bg2${i === 0 ? " active" : ""}" style="background-image:url('${u}')"></div>`
      ).join("") + (wantOverlay ? `<div class="hero-slide-overlay" style="${overlayStyle(settings)}"></div>` : "");
      hero.insertBefore(layer, hero.firstChild);

      if (rotates && useImgs.length > 1) {
        const els = layer.querySelectorAll(".hero-slide-bg2");
        let idx = 0;
        const iv = Number(settings.slideInterval) || 5000;
        setInterval(() => {
          els[idx].classList.remove("active");
          idx = (idx + 1) % els.length;
          els[idx].classList.add("active");
        }, iv);
      }
    }
  }

  // Build overlay inline style themed to --primary (or dark / hex).
  function overlayStyle(settings) {
    const style = settings.overlayStyle || "gradient";
    if (style === "none") return "background:transparent;";
    const op = (typeof settings.overlayOpacity === "number" ? settings.overlayOpacity : 60) / 100;
    let base;
    if (settings.overlayColor === "dark") base = "10, 15, 25";
    else if (settings.overlayColor && /^#/.test(settings.overlayColor)) {
      const h = settings.overlayColor;
      base = `${parseInt(h.slice(1,3),16)}, ${parseInt(h.slice(3,5),16)}, ${parseInt(h.slice(5,7),16)}`;
    } else base = "var(--primary-rgb)";
    if (style === "solid") return `background: rgba(${base}, ${op});`;
    return `background: linear-gradient(135deg, rgba(${base}, ${op}) 0%, rgba(${base}, ${op * 0.72}) 45%, rgba(${base}, ${op * 0.4}) 100%);`;
  }


  /* ── ABOUT ────────────────────────────────────────── */
  function renderAbout(about) {
    if (!about) return;
    const img = $("#aboutImage"), ph = $("#aboutImagePlaceholder");
    if (about.image?.url && img) {
      img.src = about.image.url;
      img.style.display = "";
      if (ph) ph.style.display = "none";
    }

    // checklist from highlights (full list)
    const cl = $("#aboutChecklist");
    if (cl) {
      const items = about.highlights || [];
      if (items.length) {
        cl.innerHTML = items.map(h => `<div class="about-check">${esc(h)}</div>`).join("");
      }
    }

    // float badge — extract a number from shortText or use default
    const num = $("#aboutBadgeNum");
    if (num && about.shortText) {
      const m = String(about.shortText).match(/(\d+\+?\s*(?:yrs?|years?|\+))/i);
      if (m) num.textContent = m[1].replace(/\s+/g, " ").trim();
    }
  }


  /* ── ICON LIBRARY (for services / why blocks) ─────── */
  const ICONS = {
    "ambulance": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17h2m14 0h2m-2 0a2 2 0 1 1-4 0M5 17a2 2 0 1 0 4 0M3 17V7a1 1 0 0 1 1-1h11v11M15 9h4l3 4v4h-2"/><path d="M11 8v4M9 10h4"/></svg>`,
    "heart": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    "shield": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    "clock": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    "phone": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    "user": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    "users": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    "wallet": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>`,
    "map-pin": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    "truck": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    "check": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    "star": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    "droplet": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
    "activity": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    "wind": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>`,
    "default": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></svg>`,
  };

  function svgForIcon(icon) {
    if (!icon) return ICONS.default;
    const key = String(icon).replace(/^bi[-\s]*/, "").trim().toLowerCase();
    if (ICONS[key]) return ICONS[key];
    const aliases = {
      "telephone": "phone", "telephone-fill": "phone",
      "people": "users", "person": "user", "person-check": "user",
      "geo-alt": "map-pin", "geo": "map-pin",
      "clock-fill": "clock", "stopwatch": "clock",
      "heart-pulse": "heart", "heart-fill": "heart",
      "shield-check": "shield", "shield-fill": "shield",
      "currency-dollar": "wallet", "currency-rupee": "wallet", "cash": "wallet",
      "car-front": "truck", "ambulance-fill": "ambulance",
      "lungs": "wind",
      "droplet-fill": "droplet",
      "activity-fill": "activity",
    };
    if (aliases[key] && ICONS[aliases[key]]) return ICONS[aliases[key]];
    return ICONS.default;
  }


  /* ── SERVICES ─────────────────────────────────────── */
  function renderServices(services, phone, waLink) {
    const wrap = $("#servicesList");
    if (!wrap) return;
    if (!services?.length) {
      wrap.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted)">No services configured yet</div>';
      return;
    }
    wrap.innerHTML = services.map(s => `
      <article class="service-card reveal">
        <div class="service-card-img">
          ${s.image?.url
            ? `<img src="${esc(s.image.url)}" alt="${esc(s.title)}" loading="lazy">`
            : `<div class="service-card-img-placeholder">${svgForIcon(s.icon || "ambulance")}</div>`
          }
        </div>
        <div class="service-card-body">
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description || "")}</p>
          ${s.price ? `<span class="service-price">${esc(s.price)}</span>` : ""}
          <div class="service-card-actions">
            <a class="svc-btn call" href="tel:${esc(phone || "")}" aria-label="Call for ${esc(s.title)}">
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
              Call
            </a>
            <a class="svc-btn wa" href="${esc(waLink)}" target="_blank" rel="noopener" aria-label="WhatsApp for ${esc(s.title)}">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
              WhatsApp
            </a>
          </div>
        </div>
      </article>
    `).join("");
  }


  /* ── WHY CHOOSE US (derived from services or highlights) ─── */
  function renderWhyChooseUs(services, about) {
    const wrap = $("#whyGrid");
    if (!wrap) return;

    let items = [];
    if (services?.length) {
      items = services.slice(0, 10).map(s => ({
        title: s.title,
        desc: (s.description || "").split(/[.!?]/)[0].slice(0, 80),
        icon: s.icon || "ambulance",
      }));
    } else if (about?.highlights?.length) {
      items = about.highlights.slice(0, 10).map(h => ({
        title: h, desc: "", icon: "check",
      }));
    }

    if (!items.length) {
      wrap.closest("section").style.display = "none";
      return;
    }

    wrap.innerHTML = items.map(it => `
      <div class="why-block reveal">
        <div class="wb-icon">${svgForIcon(it.icon)}</div>
        <h4 class="wb-title">${esc(it.title)}</h4>
        ${it.desc ? `<p class="wb-desc">${esc(it.desc)}</p>` : ""}
      </div>
    `).join("");
  }


  /* ── STATS (hero + strip) ─────────────────────────── */
  function parseStat(s) {
    const keyIsNum = /^[\s\d%+,<>~.kKmM-]+$/.test(String(s.key || "").trim());
    const num = keyIsNum ? String(s.key).trim() : String(s.value || "").trim();
    const label = keyIsNum ? String(s.value || "").trim() : String(s.key || "").trim();
    return { num, label };
  }

  function renderStats(stats) {
    if (!stats?.length) return;
    const parsed = stats.map(parseStat).filter(p => p.num || p.label);

    // hero stats — first 3
    const heroStats = $("#heroStats");
    if (heroStats && parsed.length) {
      heroStats.innerHTML = parsed.slice(0, 3).map(p => `
        <div class="hs-item">
          <strong>${esc(p.num)}</strong>
          <span>${esc(p.label)}</span>
        </div>
      `).join("");
    }

    // stats strip — up to 5
    const strip = $("#statsStrip");
    if (strip && parsed.length) {
      strip.innerHTML = parsed.slice(0, 5).map(p => `
        <div class="ss-item">
          <span class="ss-num">${esc(p.num)}</span>
          <span class="ss-label">${esc(p.label)}</span>
        </div>
      `).join("");
    }
  }


  /* ── AREAS (from SEO keywords or fallback) ────────── */
  function renderAreas(seo, phone) {
    const wrap = $("#areasChips");
    if (!wrap) return;

    let areas = [];
    if (Array.isArray(seo?.keywords) && seo.keywords.length) {
      // pick keywords that look like place names (start with capital, 1-3 words)
      areas = seo.keywords
        .map(k => String(k).replace(/^"|",?$/g, "").trim())
        .filter(k => k && k.length > 2 && k.length < 40 && !/[.@#]/.test(k))
        .slice(0, 8);
    }

    if (!areas.length) {
      areas = ["Local Area", "Nearby Zones", "Surrounding Sectors", "+ Nearby Areas"];
    }

    const telHref = phone ? `tel:${phone}` : "#";
    wrap.innerHTML = areas.map(a =>
      `<a class="area-chip" href="${esc(telHref)}">${esc(a)}</a>`
    ).join("");
  }


  /* ── TESTIMONIALS ─────────────────────────────────── */
  function renderTestimonials(reviews) {
    const wrap = $("#testimonialsList");
    if (!wrap) return;
    if (!reviews?.length) {
      wrap.closest("section").style.display = "none";
      return;
    }
    wrap.innerHTML = reviews.map(r => {
      const initial = (r.name || "?").trim().charAt(0).toUpperCase();
      const rating = Math.max(1, Math.min(5, r.rating || 5));
      return `
        <article class="testimonial-card reveal">
          <div class="tc-quote">"</div>
          <div class="tc-stars">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</div>
          <p class="tc-text">${esc(r.text || "")}</p>
          <div class="tc-author">
            <div class="tc-avatar">
              ${r.avatar?.url
                ? `<img src="${esc(r.avatar.url)}" alt="${esc(r.name)}" loading="lazy">`
                : esc(initial)
              }
            </div>
            <div>
              <div class="tc-name">${esc(r.name)}</div>
              ${r.designation ? `<div class="tc-desig">${esc(r.designation)}</div>` : ""}
            </div>
          </div>
        </article>
      `;
    }).join("");
  }


  /* ── BANNERS ──────────────────────────────────────── */
  function renderBanners(banners) {
    const buckets = {
      top: $("#bannersTop"),
      middle: $("#bannersMiddle"),
      bottom: $("#bannersBottom"),
      popup: $("#popupBanner"),
    };
    Object.values(buckets).forEach(el => el && (el.innerHTML = ""));

    (banners || []).forEach(b => {
      if (b.isActive === false) return;
      const target = buckets[b.position] || buckets.middle;
      if (!target) return;
      const isPopup = b.position === "popup";

      const bgStyle = b.image?.url
        ? `style="position:absolute;inset:0;background-image:url('${esc(b.image.url)}');background-size:cover;background-position:center;opacity:.22;z-index:0;"`
        : "";
      const bgDiv = b.image?.url ? `<div ${bgStyle}></div>` : "";

      const node = document.createElement("div");
      node.className = "banner-block";
      node.innerHTML = `
        ${bgDiv}
        ${isPopup ? `<button class="banner-close" onclick="this.closest('#popupBanner').style.display='none'">×</button>` : ""}
        <div class="banner-deco"></div>
        <div class="banner-deco2"></div>
        <div class="banner-inner">
          <div class="banner-left">
            ${b.title ? `<div class="banner-tag">Limited Offer</div><h4>${esc(b.title)}</h4>` : ""}
            ${b.subtitle ? `<p>${esc(b.subtitle)}</p>` : ""}
          </div>
          ${b.ctaText ? `<div class="banner-right"><a class="btn-banner" href="${esc(b.ctaLink || "#")}">${esc(b.ctaText)}</a></div>` : ""}
        </div>`;
      target.appendChild(node);

      if (isPopup) buckets.popup.style.display = "block";
    });
  }


  /* ── FOOTER ───────────────────────────────────────── */
  const SOCIAL_SVG = {
    facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4z"/></svg>`,
    twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>`,
    website: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg>`,
  };

  function renderFooter(footer, services) {
    // socials
    const sw = $("#footerSocials");
    if (sw && footer?.socialLinks) {
      sw.innerHTML = Object.entries(footer.socialLinks)
        .filter(([, v]) => !!v)
        .map(([k, v]) =>
          `<a class="footer-social" href="${esc(v)}" target="_blank" rel="noopener" title="${k}">${SOCIAL_SVG[k] || SOCIAL_SVG.website}</a>`
        ).join("");
    }

    // services list in footer (first 6)
    const fs = $("#footerServices");
    if (fs) {
      const list = (services || []).slice(0, 6);
      if (list.length) {
        fs.innerHTML = list.map(s =>
          `<li><a href="#services">${esc(s.title)}</a></li>`
        ).join("");
      } else {
        fs.innerHTML = `<li><a href="#services">All Services</a></li>`;
      }
    }
  }


  /* ── WIRE PHONE / WHATSAPP LINKS ─────────────────── */
  function wireContactLinks(contact, footer) {
    const phone = contact?.phone || "";
    const email = contact?.email || "";
    const waUrl = footer?.socialLinks?.whatsapp || waLinkFromPhone(phone);

    const telHref = phone ? `tel:${phone}` : "#";
    const mailHref = email ? `mailto:${email}` : "#";

    // topbar
    if ($("#topbarEmailLink")) $("#topbarEmailLink").href = mailHref;
    if ($("#topbarPhoneLink")) $("#topbarPhoneLink").href = telHref;

    // header CTAs
    if ($("#headerCallBtn")) $("#headerCallBtn").href = telHref;
    if ($("#headerWhatsappBtn")) $("#headerWhatsappBtn").href = waUrl;

    // hero CTAs
    if ($("#heroCallBtn")) $("#heroCallBtn").href = telHref;
    if ($("#heroWhatsappBtn")) $("#heroWhatsappBtn").href = waUrl;

    // callback form note link
    if ($("#cbNoteCall")) $("#cbNoteCall").href = telHref;

    // final CTA
    if ($("#finalCallBtn")) $("#finalCallBtn").href = telHref;
    if ($("#finalWhatsappBtn")) $("#finalWhatsappBtn").href = waUrl;

    // footer phone
    if ($("#footerPhoneLink")) $("#footerPhoneLink").href = telHref;
  }


  /* ── CALLBACK FORM ────────────────────────────────── */
  function bindCallbackForm(siteSlug) {
    const form = $("#callbackForm");
    if (!form) return;

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const status = $("#callbackStatus");
      const btn = form.querySelector("[type=submit]");
      status.textContent = "Sending…";
      status.className = "cb-status";
      if (btn) btn.disabled = true;

      // prepend selected service into message
      const userMsg = (data.message || "").trim();
      const message = [
        data.service ? `[Service: ${data.service}]` : "",
        userMsg,
      ].filter(Boolean).join(" ").trim() || "Callback request";

      const payload = {
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        message,
      };

      try {
        const res = await fetch(`${apiBase}/public/site/${encodeURIComponent(siteSlug)}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          status.className = "cb-status success";
          status.textContent = "✓ Request received! We'll call you back within a minute.";
          form.reset();
        } else throw new Error(json.message || "Failed");
      } catch (err) {
        status.className = "cb-status error";
        status.textContent = "✗ " + (err.message || "Could not send. Please call us directly.");
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }


  /* ── FAQ ACCORDION ────────────────────────────────── */
  function initFaq() {
    $$(".faq-item").forEach(item => {
      const q = item.querySelector(".faq-q");
      if (!q) return;
      q.addEventListener("click", () => {
        const wasOpen = item.classList.contains("open");
        $$(".faq-item").forEach(x => x.classList.remove("open"));
        if (!wasOpen) item.classList.add("open");
      });
    });
    // open first by default
    const firstFaq = $(".faq-item");
    if (firstFaq) firstFaq.classList.add("open");
  }


  /* ── STICKY NAVBAR + MOBILE MENU ─────────────────── */
  function initNavbar() {
    const header = $("#mainHeader");
    const sections = $$("section[id]");

    window.addEventListener("scroll", () => {
      header?.classList.toggle("scrolled", window.scrollY > 60);
      let cur = "";
      sections.forEach(s => { if (window.scrollY >= s.offsetTop - 140) cur = s.id; });
      $$(".nav-link").forEach(l => {
        l.classList.toggle("active", l.getAttribute("href") === "#" + cur);
      });
    }, { passive: true });

    const toggle = $("#navToggle"), menu = $("#navMenu");
    toggle?.addEventListener("click", () => {
      toggle.classList.toggle("open");
      menu?.classList.toggle("open");
    });

    $$(".nav-link").forEach(l => l.addEventListener("click", () => {
      toggle?.classList.remove("open");
      menu?.classList.remove("open");
    }));
  }


  /* ── REVEAL ANIMATIONS ────────────────────────────── */
  function initReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(el => obs.observe(el));
  }


  /* ── PRELOADER ────────────────────────────────────── */
  function hidePreloader() {
    const pl = $("#preloader");
    if (pl) {
      pl.classList.add("gone");
      setTimeout(() => pl.remove(), 500);
    }
  }


  /* ── MAIN LOAD ────────────────────────────────────── */
  async function load() {
    if (!slug) {
      document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:40px"><div><h2 style="margin-bottom:8px">No site found</h2><p style="color:#6b7280">Open via subdomain or add <code>?slug=name</code> to the URL</p></div></div>`;
      hidePreloader();
      return;
    }

    try {
      const [siteRes, statsRes] = await Promise.all([
        fetch(`${apiBase}/public/site/${encodeURIComponent(slug)}`),
        fetch(`${apiBase}/stats`).catch(() => null),
      ]);

      const data = await siteRes.json();
      if (!data.success) throw new Error(data.message || "Failed to load");
      const s = data.site;

      renderSeo(s.seo);
      renderBasic(s.basicInfo);
      setBound(s);

      renderHero(s.heroSlides, s.about, s.services, s.heroSettings || {});
      renderAbout(s.about);
      renderServices(s.services, s.contact?.phone, waLinkFromPhone(s.contact?.phone));
      renderWhyChooseUs(s.services, s.about);
      renderTestimonials(s.reviews);
      renderBanners(s.banners);
      renderAreas(s.seo, s.contact?.phone);
      renderFooter(s.footer, s.services);

      wireContactLinks(s.contact, s.footer);
      bindCallbackForm(s.slug);

      // Stats from API
      if (statsRes?.ok) {
        const sd = await statsRes.json();
        if (sd.success && sd.data?.length) renderStats(sd.data);
      }

      hideDisabled(s.sections);

      // title fallback
      if (!s.seo?.title && s.basicInfo?.siteName) document.title = s.basicInfo.siteName;

      initNavbar();
      initFaq();
      initReveal();
      hidePreloader();

    } catch (err) {
      console.error(err);
      document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:40px"><div><h2 style="margin-bottom:8px">Site unavailable</h2><p style="color:#6b7280">${esc(err.message)}</p></div></div>`;
      hidePreloader();
    }
  }

  load();
})();
