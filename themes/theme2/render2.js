/* render2.js – Theme 2 hydration engine (Light Edition)
   Same API contract as before — fully backward compatible.
   Added: WhatsApp floating button.
*/
(function () {
  const params = new URLSearchParams(location.search);
  const apiBase = "https://webgmbapi.hovermedia.in/api";

  let slug = params.get("slug");
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

  /* ── DATA BINDING ──────────────────────────────── */
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

  /* ── BASIC INFO ────────────────────────────────── */
  function renderBasic(b) {
    if (!b) return;
    const lg = $("#brandLogo");
    if (b.logo?.url && lg) { lg.src = b.logo.url; lg.style.display = ""; }
    const fav = $("#favicon");
    if (b.favicon?.url && fav) fav.href = b.favicon.url;
    if (b.primaryColor) document.documentElement.style.setProperty("--primary", b.primaryColor);
    if (b.secondaryColor) document.documentElement.style.setProperty("--accent", b.secondaryColor);
    const accent = b.primaryColor || "#c9a84c";
    const rgb = hexToRgb(accent);
    if (rgb) document.documentElement.style.setProperty("--primary-rgb", `${rgb.r},${rgb.g},${rgb.b}`);
  }

  function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
  }

  /* ── HERO ──────────────────────────────────────── */
  let heroIndex = 0, heroSlideEls = [], heroTimer = null;

  function renderHero(slides) {
    const wrap = $("#heroSlides"); if (!wrap) return;
    const list = slides?.length ? slides : [{
      title: "Professional Business Solutions",
      subtitle: "We help companies grow with expert digital strategy.",
      ctaText: "Get Started", ctaLink: "#contact-section", image: null
    }];

    wrap.innerHTML = list.map((s, i) => {
      const bg = s.image?.url
        ? `background-image:url('${esc(s.image.url)}')`
        : `background: linear-gradient(135deg, #f8f7f4 0%, #faf8f3 100%)`;
      return `
        <div class="hero-slide${i === 0 ? " active" : ""}">
          <div class="hero-slide-bg" style="${bg}"></div>
          <div class="hero-content">
            <div class="hero-badge">
              <span class="hero-badge-dot"></span>
              Premium Digital Services
            </div>
            <h1 class="hero-title">${formatHeroTitle(esc(s.title || ""))}</h1>
            <p class="hero-subtitle">${esc(s.subtitle || "")}</p>
            <div class="hero-actions">
              ${s.ctaText ? `<a class="btn-hero-primary" href="${esc(s.ctaLink || "#contact-section")}">${esc(s.ctaText)}</a>` : ""}
              <a class="btn-hero-ghost" href="#about">Learn More</a>
            </div>
          </div>
        </div>`;
    }).join("");

    heroSlideEls = $$(".hero-slide");

    const totalEl = $("#heroTotalNum");
    if (totalEl) totalEl.textContent = list.length;

    const dotsWrap = $("#heroDots");
    if (dotsWrap) {
      dotsWrap.innerHTML = list.map((_, i) =>
        `<div class="hero-dot${i === 0 ? " active" : ""}" data-idx="${i}"></div>`
      ).join("");
      dotsWrap.querySelectorAll(".hero-dot").forEach(d =>
        d.addEventListener("click", () => goHero(+d.dataset.idx))
      );
    }

    $("#heroPrev")?.addEventListener("click", () => goHero(heroIndex - 1));
    $("#heroNext")?.addEventListener("click", () => goHero(heroIndex + 1));

    if (list.length > 1) {
      if (heroTimer) clearInterval(heroTimer);
      heroTimer = setInterval(() => goHero(heroIndex + 1), 5500);
    }
  }

  function formatHeroTitle(title) {
    const words = title.split(" ");
    if (words.length >= 3) {
      const mid = Math.floor(words.length / 2);
      words[mid] = `<span class="accent-word">${words[mid]}</span>`;
    }
    return words.join(" ");
  }

  function goHero(idx) {
    if (!heroSlideEls.length) return;
    heroSlideEls[heroIndex].classList.remove("active");
    $$(".hero-dot")[heroIndex]?.classList.remove("active");
    heroIndex = ((idx % heroSlideEls.length) + heroSlideEls.length) % heroSlideEls.length;
    heroSlideEls[heroIndex].classList.add("active");
    $$(".hero-dot")[heroIndex]?.classList.add("active");
    const cur = $("#heroCurrentNum");
    if (cur) cur.textContent = heroIndex + 1;
  }

  /* ── ABOUT ─────────────────────────────────────── */
  function renderAbout(about) {
    if (!about) return;
    const img = $("#aboutImage"), ph = $("#aboutImagePlaceholder");
    if (about.image?.url && img) {
      img.src = about.image.url; img.style.display = "";
      if (ph) ph.style.display = "none";
    }

    const hl = $("#highlightsList"); if (!hl) return;
    const items = about.highlights || [];
    hl.innerHTML = items.map(h => `<div class="highlight-item">${esc(h)}</div>`).join("");

    const cnt = $("#projectCount");
    if (cnt) {
      const match = items.find(i => i.toLowerCase().includes("project"));
      if (match) cnt.textContent = match;
    }

    const yrsEl = $("#expYears");
    if (yrsEl && about.yearsExperience) yrsEl.textContent = about.yearsExperience;
  }

  /* ── SERVICES ───────────────────────────────────── */
  function renderServices(services) {
    const wrap = $("#servicesList"); if (!wrap) return;
    if (!services?.length) {
      wrap.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.6);padding:40px;grid-column:1/-1">No services yet</div>';
      return;
    }
    wrap.innerHTML = services.map((s, i) => {
      const delay = (i % 3) * 100;
      if (s.image?.url) {
        return `
          <div class="service-card" data-aos="fade-up" data-aos-delay="${delay}">
            <div class="service-card-img">
              <img src="${esc(s.image.url)}" alt="${esc(s.title)}" loading="lazy">
              <div class="service-card-img-overlay">
                ${s.price ? `<span class="service-img-price">${esc(s.price)}</span>` : ""}
              </div>
            </div>
            <div class="service-card-body">
              <div class="service-icon-wrap">${svgForIcon(s.icon)}</div>
              <h3>${esc(s.title)}</h3>
              <p>${esc(s.description || "")}</p>
              ${s.price ? `<span class="service-price">${esc(s.price)}</span>` : ""}
            </div>
          </div>`;
      }
      return `
        <div class="service-card-plain" data-aos="fade-up" data-aos-delay="${delay}">
          <div class="service-icon-wrap">${svgForIcon(s.icon)}</div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description || "")}</p>
          ${s.price ? `<span class="service-price">${esc(s.price)}</span>` : ""}
        </div>`;
    }).join("");
  }

  /* ── WHY CHOOSE US ──────────────────────────────── */
  function renderWhyChooseUs(services) {
    const tabs = $("#whyTabs"); if (!tabs) return;
    if (!services?.length) { tabs.closest("section").style.display = "none"; return; }

    function activate(i) {
      const s = services[i];
      $$(".why-tab").forEach((b, j) => b.classList.toggle("active", j === i));
      const img = $("#whyImg"), title = $("#whyTitle"), desc = $("#whyDesc"), num = $(".why-num");
      if (img) {
        if (s.image?.url) { img.src = s.image.url; img.style.display = "block"; }
        else img.style.display = "none";
      }
      if (title) title.textContent = s.title;
      if (desc) desc.textContent = s.description || "";
      if (num) num.textContent = String(i + 1).padStart(2, "0");
    }

    tabs.innerHTML = services.slice(0, 5).map((s, i) => `
      <button class="why-tab${i === 0 ? " active" : ""}" data-idx="${i}">
        <div class="why-tab-icon">${svgForIcon(s.icon)}</div>
        <span class="why-tab-title">${esc(s.title)}</span>
      </button>`).join("");

    tabs.querySelectorAll(".why-tab").forEach(btn =>
      btn.addEventListener("click", () => activate(+btn.dataset.idx))
    );
    activate(0);
  }

  /* ── REVIEWS ────────────────────────────────────── */
  let revIndex = 0, revPerPage = 2;

  function renderReviews(reviews) {
    const track = $("#reviewsTrack"); if (!track) return;
    if (!reviews?.length) { track.closest("section").style.display = "none"; return; }

    track.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-quote">"</div>
        <div class="review-stars">${"★".repeat(r.rating || 5)}${"☆".repeat(5 - (r.rating || 5))}</div>
        <p class="review-text">${esc(r.text || "")}</p>
        <div class="review-author">
          ${r.avatar?.url
            ? `<img class="review-avatar" src="${esc(r.avatar.url)}" alt="${esc(r.name)}" loading="lazy">`
            : `<div class="review-avatar-placeholder">👤</div>`}
          <div>
            <div class="review-name">${esc(r.name)}</div>
            <div class="review-designation">${esc(r.designation || "")}</div>
          </div>
        </div>
      </div>`).join("");

    const total = reviews.length;
    const dotsWrap = $("#revDots");

    function updateDots() {
      if (!dotsWrap) return;
      const pages = Math.max(1, Math.ceil(total / revPerPage));
      dotsWrap.innerHTML = Array.from({ length: pages }, (_, i) =>
        `<div class="rev-dot${i === revIndex ? " active" : ""}" data-idx="${i}"></div>`
      ).join("");
      dotsWrap.querySelectorAll(".rev-dot").forEach(d =>
        d.addEventListener("click", () => goRev(+d.dataset.idx))
      );
    }

    function goRev(idx) {
      revPerPage = window.innerWidth < 768 ? 1 : 2;
      const max = Math.max(0, Math.ceil(total / revPerPage) - 1);
      revIndex = Math.max(0, Math.min(idx, max));
      const cardW = track.querySelector(".review-card")?.offsetWidth || 0;
      const gap = 24;
      track.style.transform = `translateX(-${revIndex * (cardW + gap) * revPerPage}px)`;
      updateDots();
    }

    $("#revPrev")?.addEventListener("click", () => goRev(revIndex - 1));
    $("#revNext")?.addEventListener("click", () => goRev(revIndex + 1));
    updateDots();
    window.addEventListener("resize", () => {
      const newPer = window.innerWidth < 768 ? 1 : 2;
      if (newPer !== revPerPage) { revIndex = 0; goRev(0); }
      else goRev(revIndex);
    });
  }

  /* ── BANNERS ────────────────────────────────────── */
  function renderBanners(banners) {
    const buckets = {
      top: $("#bannersTop"),
      middle: $("#bannersMiddle"),
      bottom: $("#bannersBottom"),
      popup: $("#popupBanner"),
    };
    Object.values(buckets).forEach(el => el && (el.innerHTML = ""));
    (banners || []).forEach(b => {
      if (!b.isActive && b.isActive !== undefined) return;
      const target = buckets[b.position] || buckets.middle;
      if (!target) return;
      const isPopup = b.position === "popup";
      const node = document.createElement("div");
      node.className = "banner-block";
      const bgStyle = b.image?.url
        ? `style="position:absolute;inset:0;background-image:url('${esc(b.image.url)}');background-size:cover;background-position:center;opacity:0.20;z-index:0;"`
        : "";
      const bgDiv = b.image?.url ? `<div ${bgStyle}></div>` : "";
      node.innerHTML = `
        ${bgDiv}
        ${isPopup ? `<button class="banner-close" onclick="this.closest('#popupBanner').style.display='none'">×</button>` : ""}
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

  /* ── CONTACT MAP ────────────────────────────────── */
  function renderContact(contact) {
    const wrap = $("#mapWrap"), frame = $("#mapFrame");
    if (contact?.mapEmbedUrl && wrap && frame) { frame.src = contact.mapEmbedUrl; wrap.style.display = ""; }
  }

  /* ── WHATSAPP FLOATING BUTTON ───────────────────── */
  function renderWhatsApp(site) {
    // Look in several places the admin might store the number
    const basicInfo = site?.basicInfo || {};
    const contact = site?.contact || {};
    let number =
      basicInfo.whatsapp ||
      basicInfo.whatsappNumber ||
      contact.whatsapp ||
      contact.whatsappNumber ||
      contact.phone ||
      "";

    if (!number) return; // nothing to show

    // Clean number: keep digits only (whatsapp wa.me requires no + or spaces)
    const clean = String(number).replace(/[^\d]/g, "");
    if (!clean) return;

    const siteName = basicInfo.siteName || "your team";
    const defaultMsg = encodeURIComponent(`Hello ${siteName}, I'd like to know more about your services.`);
    const href = `https://wa.me/${clean}?text=${defaultMsg}`;

    // Avoid duplicates if already rendered
    document.querySelector(".whatsapp-float")?.remove();

    const a = document.createElement("a");
    a.className = "whatsapp-float";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", "Chat on WhatsApp");
    a.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
      <span class="wa-tooltip">Chat with us on WhatsApp</span>
    `;
    document.body.appendChild(a);
  }

  /* ── FOOTER ─────────────────────────────────────── */
  const SOCIAL = {
    facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`,
    website: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`
  };

  function renderFooter(footer) {
    const cols = $("#footerColumns");
    if (cols && footer?.columns?.length) {
      cols.innerHTML = footer.columns.map(c => `
        <div>
          <div class="footer-col-title">${esc(c.title || "")}</div>
          <ul class="footer-links-list">
            ${(c.links || []).map(l => `<li><a href="${esc(l.url || "#")}">${esc(l.label || "")}</a></li>`).join("")}
          </ul>
        </div>`).join("");
    }

    const renderSocial = (wrap, links) => {
      if (!wrap || !links) return;
      wrap.innerHTML = Object.entries(links)
        .filter(([, v]) => !!v)
        .map(([k, v]) => `<a class="social-link" href="${esc(v)}" target="_blank" rel="noopener" title="${k}">${SOCIAL[k] || "🌐"}</a>`)
        .join("");
    };

    renderSocial($("#socialLinks"), footer?.socialLinks);
    renderSocial($("#topSocialLinks"), footer?.socialLinks);
  }

  /* ── ICON HELPERS ───────────────────────────────── */
  const ICON_SVGS = {
    "bi-globe": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    "bi-search": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    "bi-megaphone": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>`,
    "bi-lightbulb": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`,
    "bi-graph-up-arrow": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    "bi-currency-dollar": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    "default": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  };

  function svgForIcon(icon) {
    const key = (icon || "").replace("bi ", "").trim();
    return ICON_SVGS[key] || ICON_SVGS.default;
  }

  /* ── CONTACT MODAL ──────────────────────────────── */
  function initModal() {
    const modal = $("#contactModal");
    const close = $("#modalClose");
    if (!modal) return;

    function openModal() {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    $$("[id^='openContactModal'], #aboutCta").forEach(btn => {
      if (btn) btn.addEventListener("click", e => { e.preventDefault(); openModal(); });
    });

    close?.addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
  }

  /* ── CONTACT FORM ───────────────────────────────── */
  function bindContactForm(siteSlug) {
    const form = $("#contactForm"); if (!form) return;
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(form));
      const status = $("#formStatus");
      const btn = form.querySelector("[type=submit]");
      if (status) { status.textContent = "Sending…"; status.className = "form-status"; }
      if (btn) btn.disabled = true;
      try {
        const res = await fetch(`${apiBase}/public/site/${encodeURIComponent(siteSlug)}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          if (status) { status.className = "form-status success"; status.textContent = "✓ Message sent! We'll be in touch soon."; }
          form.reset();
        } else throw new Error(data.message || "Failed");
      } catch (err) {
        if (status) { status.className = "form-status error"; status.textContent = "✗ " + err.message; }
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  /* ── NAVBAR ─────────────────────────────────────── */
  function initNavbar() {
    const header = $("#mainHeader");
    const sections = $$("section[id], div[id='top']");

    window.addEventListener("scroll", () => {
      header?.classList.toggle("scrolled", window.scrollY > 60);
      let cur = "";
      sections.forEach(s => { if (window.scrollY >= s.offsetTop - 80) cur = s.id; });
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

  /* ── COUNTER ANIMATION ───────────────────────────── */
  function animateCounters() {
    $$(".ticker-num").forEach(el => {
      if (el.dataset.animated) return;
      el.dataset.animated = "1";
      const target = +el.dataset.target;
      const dur = 2000, step = dur / 60;
      let cur = 0;
      const inc = target / (dur / step);
      const timer = setInterval(() => {
        cur += inc;
        if (cur >= target) { cur = target; clearInterval(timer); }
        el.textContent = Math.floor(cur);
      }, step);
    });
  }

  function initCounters() {
    const strip = $(".stats-strip");
    if (!strip) { setTimeout(animateCounters, 600); return; }
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { animateCounters(); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(strip);
  }

  /* ── PRELOADER ───────────────────────────────────── */
  function hidePreloader() {
    const pl = $("#preloader");
    if (pl) { pl.classList.add("gone"); setTimeout(() => pl.remove(), 600); }
  }

  /* ── ERROR / NO-SLUG SCREEN (light theme) ──────── */
  function errorScreen(title, msg) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Outfit',sans-serif;text-align:center;padding:40px;background:#faf8f3;color:#14171f">
        <div>
          <h2 style="margin:0 0 10px;font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:500">${esc(title)}</h2>
          <p style="color:#6b7280;margin:0;font-size:15px">${esc(msg)}</p>
        </div>
      </div>`;
  }

  /* ── MAIN LOAD ───────────────────────────────────── */
  async function load() {
    if (!slug) {
      console.log("slug", slug);
      errorScreen("No site found", "Open via subdomain or add ?slug=name to URL");
      hidePreloader();
      return;
    }

    try {
      const res = await fetch(`${apiBase}/public/site/${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load");
      const s = data.site;
      console.log("data slug", data);

      renderBasic(s.basicInfo);
      setBound(s);
      renderHero(s.heroSlides);
      renderAbout(s.about);
      renderServices(s.services);
      renderWhyChooseUs(s.services);
      renderReviews(s.reviews);
      renderBanners(s.banners);
      renderContact(s.contact);
      renderFooter(s.footer);
      renderWhatsApp(s);
      hideDisabled(s.sections);
      bindContactForm(s.slug);

      if (s.seo?.title) document.title = s.seo.title;
      else if (s.basicInfo?.siteName) document.title = s.basicInfo.siteName;

      hidePreloader();
      initNavbar();
      initModal();
      initCounters();

      if (window.AOS) {
        AOS.init({
          duration: 700,
          easing: "ease-out-cubic",
          once: true,
          offset: 60,
        });
      }
    } catch (err) {
      console.error(err);
      errorScreen("Site unavailable", err.message);
      hidePreloader();
    }
  }

  load();
})();