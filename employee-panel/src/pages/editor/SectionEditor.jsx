import { useEffect, useState } from "react";
import api from "../../api/client";
import toast from "react-hot-toast";

/* ═══════════════════════════════════════════════════════════════
   SECTION TYPE REGISTRY
   ═══════════════════════════════════════════════════════════════ */
export const SECTION_TYPES = [
  { key: "hero",         label: "Hero Banner",       icon: "bi-window-fullscreen",  desc: "Top banner with title + CTA" },
  { key: "about",        label: "About / Text + Image", icon: "bi-image-alt",       desc: "Story block with image and highlights" },
  { key: "features",     label: "Features Grid",     icon: "bi-grid-3x3-gap",       desc: "Icon-based feature cards (2–6 columns)" },
  { key: "services",     label: "Services",          icon: "bi-briefcase",          desc: "Service cards with Call / WhatsApp CTAs" },
  { key: "cta",          label: "Call to Action",    icon: "bi-megaphone",          desc: "Full-width action banner" },
  { key: "testimonials", label: "Testimonials",      icon: "bi-star",               desc: "Customer reviews grid" },
  { key: "faq",          label: "FAQ Accordion",     icon: "bi-question-circle",    desc: "Expandable question list" },
  { key: "gallery",      label: "Image Gallery",     icon: "bi-images",             desc: "Grid of photos" },
  { key: "team",         label: "Team Members",      icon: "bi-people",             desc: "Meet-the-team cards" },
  { key: "pricing",      label: "Pricing Plans",     icon: "bi-currency-rupee",     desc: "Pricing tiers (mark one featured)" },
  { key: "stats",        label: "Stats / Numbers",   icon: "bi-bar-chart",          desc: "Big-number highlights" },
  { key: "text",         label: "Text Block",        icon: "bi-paragraph",          desc: "Simple heading + paragraph" },
  { key: "banner",       label: "Small Banner",      icon: "bi-bookmark-star",      desc: "Inline promo strip" },
  { key: "contact",      label: "Contact + Form",    icon: "bi-envelope",           desc: "Contact info and optional form" },
  { key: "blogList",     label: "Blog Posts",        icon: "bi-journals",           desc: "Grid of blog cards" },
  { key: "videoEmbed",   label: "Video Embed",       icon: "bi-play-circle",        desc: "YouTube / Vimeo embed" },
  { key: "mapEmbed",     label: "Map Embed",         icon: "bi-geo-alt",            desc: "Google Maps embed" },
  { key: "logoCloud",    label: "Logo Cloud",        icon: "bi-building",           desc: "Client / partner logos" },
  { key: "richText",     label: "Rich HTML",         icon: "bi-code-slash",         desc: "Raw HTML block (advanced)" },
  { key: "steps",        label: "How It Works",      icon: "bi-list-ol",            desc: "Numbered process timeline" },
  { key: "marquee",      label: "Scrolling Strip",   icon: "bi-arrow-left-right",   desc: "Auto-scrolling highlights ticker" },
  { key: "areas",        label: "Service Areas",     icon: "bi-geo",                desc: "Area chips, tap-to-call linked" },
  { key: "callback",     label: "Callback Form",     icon: "bi-telephone-inbound",  desc: "Lead-capture callback request card" },
];

export const ICON_CHOICES = [
  "shield", "clock", "heart", "star", "check", "phone", "mail",
  "pin", "user", "users", "rocket", "zap", "award", "settings", "plus", "whatsapp",
];

// Default `data` shape for each section type — used when adding a new section
export const SECTION_DEFAULTS = {
  hero: {
    variant: "centered",
    eyebrow: "",
    title: "Your headline here",
    subtitle: "A short supporting line that describes what you do.",
    ctaText: "Get Started",
    ctaLink: "/contact",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    image: null,
  },
  about: {
    variant: "image-right",
    eyebrow: "",
    heading: "About Us",
    body: "Tell your story here.",
    image: null,
    highlights: [],
  },
  features: {
    eyebrow: "",
    heading: "Why Choose Us",
    subheading: "",
    columns: 3,
    items: [
      { icon: "shield", title: "Trusted", description: "Reliable and consistent." },
      { icon: "clock",  title: "Fast",    description: "Quick turnaround." },
      { icon: "heart",  title: "Care",    description: "Customer-first approach." },
    ],
  },
  services: {
    eyebrow: "",
    heading: "Our Services",
    subheading: "",
    items: [],
  },
  cta: {
    background: "primary",
    eyebrow: "",
    heading: "Ready to get started?",
    subheading: "Talk to our team today.",
    ctaText: "Contact Us",
    ctaLink: "/contact",
    secondaryCtaText: "",
    secondaryCtaLink: "",
    image: null,
  },
  testimonials: {
    eyebrow: "",
    heading: "What Our Clients Say",
    items: [],
  },
  faq: {
    eyebrow: "",
    heading: "Frequently Asked Questions",
    items: [{ question: "Sample question?", answer: "Sample answer." }],
  },
  gallery: {
    eyebrow: "",
    heading: "Gallery",
    items: [],
  },
  team: {
    eyebrow: "",
    heading: "Meet the Team",
    items: [],
  },
  pricing: {
    eyebrow: "",
    heading: "Pricing",
    subheading: "",
    plans: [
      { name: "Basic",    price: "₹999",  period: "/month", features: ["Feature one", "Feature two"], ctaText: "Get Started", ctaLink: "/contact", highlighted: false, badge: "" },
      { name: "Pro",      price: "₹2999", period: "/month", features: ["Everything in Basic", "More features", "Priority support"], ctaText: "Get Started", ctaLink: "/contact", highlighted: true, badge: "Popular" },
    ],
  },
  stats: {
    items: [
      { number: "1000+", label: "Happy Clients" },
      { number: "10+",   label: "Years Experience" },
      { number: "24/7",  label: "Support" },
      { number: "100%",  label: "Satisfaction" },
    ],
  },
  text: { alignment: "left", eyebrow: "", heading: "", body: "" },
  banner: {
    title: "Special offer",
    subtitle: "Limited-time discount for new customers.",
    ctaText: "Claim Now",
    ctaLink: "/contact",
    image: null,
  },
  contact: {
    eyebrow: "",
    heading: "Get in Touch",
    body: "We'd love to hear from you.",
    showForm: true,
    formHeading: "Send Us a Message",
  },
  blogList: {
    eyebrow: "",
    heading: "Latest Posts",
    items: [],
  },
  videoEmbed: { heading: "", url: "" },
  mapEmbed:   { heading: "", url: "" },
  logoCloud:  { heading: "Trusted by", items: [] },
  richText:   { html: "<p>Type your HTML here.</p>" },
  steps: {
    eyebrow: "How It Works",
    heading: "Simple, transparent process",
    subheading: "",
    items: [
      { icon: "phone",    title: "Reach Out",       description: "Call us or fill the quick form — we respond fast." },
      { icon: "users",    title: "Consultation",     description: "We understand your needs and share a clear plan." },
      { icon: "rocket",   title: "We Deliver",       description: "Expert execution with updates at every step." },
      { icon: "heart",    title: "Ongoing Support",  description: "We stay available long after the job is done." },
    ],
  },
  marquee: {
    background: "dark",
    items: ["Trusted Since 2013", "500+ Happy Clients", "Award-Winning Service", "Free Consultation"],
  },
  areas: {
    eyebrow: "Coverage",
    heading: "Areas we serve",
    subheading: "",
    items: ["Delhi NCR", "Gurgaon", "Noida", "Faridabad", "Ghaziabad"],
    note: "Don't see your area? Call us — we may still be able to help.",
  },
  callback: {
    eyebrow: "Quick Response",
    heading: "Request a Callback",
    body: "Leave your details and our team will call you back within 15 minutes during business hours.",
    serviceLabel: "What do you need?",
    servicePlaceholder: "Briefly describe your requirement",
    buttonText: "Request Callback",
  },
};


/* ═══════════════════════════════════════════════════════════════
   SHARED HELPERS
   ═══════════════════════════════════════════════════════════════ */

// upload a single image file to Cloudinary via backend, return {url, publicId}
async function uploadImageFile(file, folder = "sections") {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("folder", `website-builder/${folder}`);
  const { data } = await api.post("/employee/uploads/image", fd);
  return data.image;
}

// ImageField — click to upload, previews chosen image
function ImageField({ label, value, onChange, folder = "sections" }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const img = await uploadImageFile(file, folder);
      onChange(img);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  return (
    <div className="mb-3">
      {label && <label className="form-label small fw-semibold">{label}</label>}
      <div className="d-flex align-items-center gap-3">
        {value?.url ? (
          <img
            src={value.url}
            alt=""
            className="rounded border"
            style={{ width: 80, height: 60, objectFit: "cover" }}
          />
        ) : (
          <div
            className="d-flex align-items-center justify-content-center bg-light border rounded text-muted"
            style={{ width: 80, height: 60 }}
          >
            <i className="bi bi-image"></i>
          </div>
        )}
        <div className="flex-grow-1">
          <input
            type="file"
            accept="image/*"
            className="form-control form-control-sm"
            onChange={pick}
            disabled={busy}
          />
          {busy && <div className="small text-primary mt-1"><span className="spinner-border spinner-border-sm me-1"></span>Uploading…</div>}
          {value?.url && !busy && (
            <button type="button" className="btn btn-link btn-sm p-0 text-danger mt-1" onClick={() => onChange(null)}>
              Remove image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// IconPicker — grid of allowed icons
function IconPicker({ value, onChange }) {
  return (
    <div>
      <label className="form-label small fw-semibold">Icon</label>
      <div className="d-flex flex-wrap gap-2">
        {ICON_CHOICES.map((icn) => (
          <button
            key={icn}
            type="button"
            className={"btn btn-sm " + (value === icn ? "btn-primary" : "btn-outline-secondary")}
            onClick={() => onChange(icn)}
            title={icn}
            style={{ minWidth: 70 }}
          >
            {icn}
          </button>
        ))}
      </div>
    </div>
  );
}

// ItemsEditor — generic array manager with add / remove / reorder + render prop
function ItemsEditor({ items, onChange, blankItem, renderItem, addLabel = "Add Item", itemLabel = "Item" }) {
  const list = Array.isArray(items) ? items : [];
  const add    = () => onChange([...list, { ...blankItem }]);
  const remove = (i) => onChange(list.filter((_, ix) => ix !== i));
  const move   = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const patch  = (i, updates) => {
    const next = [...list];
    next[i] = { ...next[i], ...updates };
    onChange(next);
  };
  return (
    <div>
      {list.length === 0 && (
        <div className="text-center py-3 bg-light rounded mb-2 small text-muted">
          No {itemLabel.toLowerCase()}s yet.
        </div>
      )}
      {list.map((it, i) => (
        <div key={i} className="border rounded p-3 mb-2 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small fw-bold text-muted">{itemLabel} #{i + 1}</span>
            <div className="btn-group">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => move(i, -1)} disabled={i === 0}>
                <i className="bi bi-arrow-up"></i>
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => move(i, 1)} disabled={i === list.length - 1}>
                <i className="bi bi-arrow-down"></i>
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(i)}>
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
          {renderItem(it, (upd) => patch(i, upd), i)}
        </div>
      ))}
      <button type="button" className="btn btn-sm btn-outline-primary" onClick={add}>
        <i className="bi bi-plus-lg me-1"></i>{addLabel}
      </button>
    </div>
  );
}

// StringListEditor — simple array of strings (used for highlights, features[])
function StringListEditor({ items, onChange, placeholder = "Type and press Enter" }) {
  const [txt, setTxt] = useState("");
  const list = Array.isArray(items) ? items : [];
  const add = () => {
    const v = txt.trim();
    if (!v) return;
    onChange([...list, v]);
    setTxt("");
  };
  return (
    <div>
      <div className="d-flex gap-2 mb-2">
        <input
          className="form-control form-control-sm"
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={add}>
          <i className="bi bi-plus-lg"></i>
        </button>
      </div>
      <div className="d-flex flex-wrap gap-1">
        {list.map((s, i) => (
          <span key={i} className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
            {s}
            <button
              type="button"
              className="btn-close btn-close-sm"
              style={{ fontSize: 8 }}
              onClick={() => onChange(list.filter((_, ix) => ix !== i))}
            ></button>
          </span>
        ))}
      </div>
    </div>
  );
}

// small labelled input helpers
const F = {
  Text: ({ label, value, onChange, placeholder, type = "text" }) => (
    <div className="mb-3">
      <label className="form-label small fw-semibold">{label}</label>
      <input type={type} className="form-control" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  ),
  Area: ({ label, value, onChange, rows = 3, placeholder }) => (
    <div className="mb-3">
      <label className="form-label small fw-semibold">{label}</label>
      <textarea className="form-control" rows={rows} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}></textarea>
    </div>
  ),
  Num: ({ label, value, onChange, min, max }) => (
    <div className="mb-3">
      <label className="form-label small fw-semibold">{label}</label>
      <input type="number" className="form-control" value={value ?? 0} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  ),
  Select: ({ label, value, onChange, options }) => (
    <div className="mb-3">
      <label className="form-label small fw-semibold">{label}</label>
      <select className="form-select" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  ),
  Check: ({ label, value, onChange }) => (
    <div className="form-check form-switch mb-2">
      <input className="form-check-input" type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} id={label} />
      <label className="form-check-label small" htmlFor={label}>{label}</label>
    </div>
  ),
  Toggle: ({ label, value, onChange }) => (
    <div className="form-check form-switch mb-2">
      <input className="form-check-input" type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} id={label} />
      <label className="form-check-label small" htmlFor={label}>{label}</label>
    </div>
  ),
  Range: ({ label, value, onChange, min = 0, max = 100, step = 1 }) => (
    <div className="mb-3">
      <label className="form-label small fw-semibold">{label}</label>
      <input type="range" className="form-range" min={min} max={max} step={step} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  ),
};


/* ═══════════════════════════════════════════════════════════════
   INDIVIDUAL SECTION FORMS
   Each takes { data, setData } and renders type-specific fields.
   Data shape matches themes/multi-shared/render-multi.js contract.
   ═══════════════════════════════════════════════════════════════ */

function HeroForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  const v = data.variant || "centered";
  const usesOverlay = v === "imageBg" || v === "slider" || (v === "centered" && data.useImageBackground);

  return (
    <>
      <F.Select label="Hero Style" value={v} onChange={(val) => patch({ variant: val })}
        options={[
          { value: "centered", label: "Centered — text in the middle" },
          { value: "split",    label: "Split — text left, image right" },
          { value: "imageBg",  label: "Image Background — full photo behind text" },
          { value: "slider",   label: "Slider — multiple rotating background images" },
          { value: "gradient", label: "Gradient — theme color gradient background" },
          { value: "minimal",  label: "Minimal — just heading (sub-pages)" },
        ]} />

      <F.Text label="Eyebrow (small tagline above title)" value={data.eyebrow} onChange={(val) => patch({ eyebrow: val })} placeholder="Welcome" />
      <F.Text label="Title" value={data.title} onChange={(val) => patch({ title: val })} placeholder="Your main headline" />
      <F.Area label="Subtitle" value={data.subtitle} onChange={(val) => patch({ subtitle: val })} rows={2} placeholder="Short supporting text" />

      {v !== "minimal" && (
        <div className="row g-2">
          <div className="col-md-6"><F.Text label="Primary CTA Text"   value={data.ctaText}          onChange={(val) => patch({ ctaText: val })}          placeholder="Get Started" /></div>
          <div className="col-md-6"><F.Text label="Primary CTA Link"   value={data.ctaLink}          onChange={(val) => patch({ ctaLink: val })}          placeholder="/contact" /></div>
          <div className="col-md-6"><F.Text label="Secondary CTA Text" value={data.secondaryCtaText} onChange={(val) => patch({ secondaryCtaText: val })} placeholder="Learn More" /></div>
          <div className="col-md-6"><F.Text label="Secondary CTA Link" value={data.secondaryCtaLink} onChange={(val) => patch({ secondaryCtaLink: val })} placeholder="/about" /></div>
        </div>
      )}

      {/* Single image for centered / split / imageBg */}
      {(v === "centered" || v === "split" || v === "imageBg") && (
        <ImageField label={v === "imageBg" ? "Background Image" : "Hero Image (optional)"} value={data.image} onChange={(img) => patch({ image: img })} folder="hero" />
      )}

      {/* centered can optionally use its image as a full background */}
      {v === "centered" && data.image?.url && (
        <F.Toggle label="Use image as full background (with overlay)" value={!!data.useImageBackground} onChange={(val) => patch({ useImageBackground: val })} />
      )}

      {/* Slider images */}
      {v === "slider" && (
        <>
          <label className="form-label small fw-semibold mt-2">Slider Images (rotate automatically)</label>
          <ItemsEditor
            items={data.slides}
            onChange={(slides) => patch({ slides })}
            blankItem={{ url: "" }}
            addLabel="Add Slide Image"
            itemLabel="Slide"
            renderItem={(it, upd) => (
              <ImageField label="Image" value={it.url ? { url: it.url } : null} onChange={(img) => upd({ url: img?.url || "" })} folder="hero" />
            )}
          />
          <F.Text label="Slide interval (ms)" value={data.slideInterval} onChange={(val) => patch({ slideInterval: Number(val) || 5000 })} placeholder="5000" />
        </>
      )}

      {/* Overlay controls — shown whenever an image sits behind text */}
      {usesOverlay && (
        <div className="border rounded-3 p-3 mt-3" style={{ background: "#f8fafc" }}>
          <div className="small fw-bold text-uppercase text-muted mb-2">
            <i className="bi bi-layers-half me-1"></i>Overlay (for text readability)
          </div>
          <div className="row g-2">
            <div className="col-md-6">
              <F.Select label="Overlay Color" value={data.overlayColor || "primary"} onChange={(val) => patch({ overlayColor: val })}
                options={[
                  { value: "primary", label: "Theme color (recommended)" },
                  { value: "dark",    label: "Dark / black" },
                ]} />
            </div>
            <div className="col-md-6">
              <F.Select label="Overlay Style" value={data.overlayStyle || "gradient"} onChange={(val) => patch({ overlayStyle: val })}
                options={[
                  { value: "gradient", label: "Gradient (diagonal fade)" },
                  { value: "solid",    label: "Solid tint" },
                  { value: "none",     label: "No overlay" },
                ]} />
            </div>
          </div>
          <F.Range label={`Overlay Darkness — ${typeof data.overlayOpacity === "number" ? data.overlayOpacity : 60}%`}
            min={0} max={100} step={5}
            value={typeof data.overlayOpacity === "number" ? data.overlayOpacity : 60}
            onChange={(val) => patch({ overlayOpacity: Number(val) })} />
          <div className="small text-muted">Overlay ka color theme ke primary color se automatically match hota hai. Darkness badhao agar text image pe clearly na dikhe.</div>
        </div>
      )}
    </>
  );
}

function AboutForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Select label="Layout" value={data.variant} onChange={(v) => patch({ variant: v })}
        options={[
          { value: "image-right", label: "Image on right" },
          { value: "image-left",  label: "Image on left"  },
        ]} />
      <F.Text label="Eyebrow" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} placeholder="About Us" />
      <F.Text label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} placeholder="Who we are" />
      <F.Area label="Body" value={data.body} onChange={(v) => patch({ body: v })} rows={4} placeholder="Tell your story…" />
      <ImageField label="About Image" value={data.image} onChange={(img) => patch({ image: img })} folder="about" />
      <label className="form-label small fw-semibold">Highlights (bullet checklist)</label>
      <StringListEditor items={data.highlights} onChange={(v) => patch({ highlights: v })} placeholder="Type a highlight and press Enter" />
    </>
  );
}

function FeaturesForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow"    value={data.eyebrow}    onChange={(v) => patch({ eyebrow: v })}    placeholder="Why Choose Us" />
      <F.Text label="Heading"    value={data.heading}    onChange={(v) => patch({ heading: v })}    placeholder="What makes us different" />
      <F.Text label="Subheading" value={data.subheading} onChange={(v) => patch({ subheading: v })} placeholder="Short line under heading (optional)" />
      <F.Num  label="Columns (2–6)" value={data.columns} onChange={(v) => patch({ columns: Math.max(2, Math.min(6, v)) })} min={2} max={6} />
      <label className="form-label small fw-semibold mt-2">Feature Items</label>
      <ItemsEditor
        items={data.items}
        onChange={(items) => patch({ items })}
        blankItem={{ icon: "check", title: "", description: "" }}
        addLabel="Add Feature"
        itemLabel="Feature"
        renderItem={(it, upd) => (
          <>
            <IconPicker value={it.icon} onChange={(icn) => upd({ icon: icn })} />
            <div className="row g-2 mt-2">
              <div className="col-md-6"><F.Text label="Title"       value={it.title}       onChange={(v) => upd({ title: v })}       placeholder="Feature name" /></div>
              <div className="col-md-6"><F.Text label="Description" value={it.description} onChange={(v) => upd({ description: v })} placeholder="Short description" /></div>
            </div>
          </>
        )}
      />
    </>
  );
}

function ServicesForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow"    value={data.eyebrow}    onChange={(v) => patch({ eyebrow: v })}    placeholder="What We Offer" />
      <F.Text label="Heading"    value={data.heading}    onChange={(v) => patch({ heading: v })}    placeholder="Our Services" />
      <F.Text label="Subheading" value={data.subheading} onChange={(v) => patch({ subheading: v })} />
      <div className="small text-muted mb-2">Each card auto-shows Call &amp; WhatsApp buttons pulled from the site contact info.</div>
      <ItemsEditor
        items={data.items}
        onChange={(items) => patch({ items })}
        blankItem={{ title: "", description: "", icon: "settings", image: null, price: "", link: "" }}
        addLabel="Add Service"
        itemLabel="Service"
        renderItem={(it, upd) => (
          <>
            <div className="row g-2">
              <div className="col-md-6"><F.Text label="Title"       value={it.title}       onChange={(v) => upd({ title: v })}       placeholder="Service name" /></div>
              <div className="col-md-6"><F.Text label="Price (optional)" value={it.price}   onChange={(v) => upd({ price: v })}       placeholder="₹999 / hr" /></div>
            </div>
            <F.Area label="Description" value={it.description} onChange={(v) => upd({ description: v })} rows={2} />
            <div className="row g-2">
              <div className="col-md-6"><F.Text label="Custom Link (optional, overrides Call CTA)" value={it.link} onChange={(v) => upd({ link: v })} placeholder="/services/detail" /></div>
              <div className="col-md-6">
                <IconPicker value={it.icon} onChange={(icn) => upd({ icon: icn })} />
              </div>
            </div>
            <ImageField label="Service Image (optional — icon shown otherwise)" value={it.image} onChange={(img) => upd({ image: img })} folder="services" />
          </>
        )}
      />
    </>
  );
}

function CtaForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Select label="Background" value={data.background} onChange={(v) => patch({ background: v })}
        options={[
          { value: "primary", label: "Primary brand color gradient" },
          { value: "dark",    label: "Dark gradient" },
        ]} />
      <F.Text label="Eyebrow"    value={data.eyebrow}    onChange={(v) => patch({ eyebrow: v })} />
      <F.Text label="Heading"    value={data.heading}    onChange={(v) => patch({ heading: v })} placeholder="Ready to get started?" />
      <F.Area label="Subheading" value={data.subheading} onChange={(v) => patch({ subheading: v })} rows={2} />
      <div className="row g-2">
        <div className="col-md-6"><F.Text label="Primary CTA Text"   value={data.ctaText}          onChange={(v) => patch({ ctaText: v })} /></div>
        <div className="col-md-6"><F.Text label="Primary CTA Link"   value={data.ctaLink}          onChange={(v) => patch({ ctaLink: v })} /></div>
        <div className="col-md-6"><F.Text label="Secondary CTA Text" value={data.secondaryCtaText} onChange={(v) => patch({ secondaryCtaText: v })} /></div>
        <div className="col-md-6"><F.Text label="Secondary CTA Link" value={data.secondaryCtaLink} onChange={(v) => patch({ secondaryCtaLink: v })} /></div>
      </div>
      <ImageField label="Background Image (optional)" value={data.image} onChange={(img) => patch({ image: img })} folder="cta" />
    </>
  );
}

function TestimonialsForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
      <F.Text label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} placeholder="What our clients say" />
      <ItemsEditor
        items={data.items}
        onChange={(items) => patch({ items })}
        blankItem={{ name: "", designation: "", rating: 5, text: "", avatar: null }}
        addLabel="Add Testimonial"
        itemLabel="Testimonial"
        renderItem={(it, upd) => (
          <>
            <div className="row g-2">
              <div className="col-md-6"><F.Text label="Name"        value={it.name}        onChange={(v) => upd({ name: v })} /></div>
              <div className="col-md-6"><F.Text label="Designation" value={it.designation} onChange={(v) => upd({ designation: v })} placeholder="CEO, Company" /></div>
              <div className="col-md-6"><F.Num  label="Rating (1–5)" value={it.rating}     onChange={(v) => upd({ rating: Math.max(1, Math.min(5, v)) })} min={1} max={5} /></div>
            </div>
            <F.Area label="Quote / Review Text" value={it.text} onChange={(v) => upd({ text: v })} rows={3} />
            <ImageField label="Avatar (optional — initial shown otherwise)" value={it.avatar} onChange={(img) => upd({ avatar: img })} folder="avatars" />
          </>
        )}
      />
    </>
  );
}

function FaqForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
      <F.Text label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} placeholder="Frequently Asked Questions" />
      <ItemsEditor
        items={data.items}
        onChange={(items) => patch({ items })}
        blankItem={{ question: "", answer: "" }}
        addLabel="Add Question"
        itemLabel="FAQ"
        renderItem={(it, upd) => (
          <>
            <F.Text label="Question" value={it.question} onChange={(v) => upd({ question: v })} />
            <F.Area label="Answer"   value={it.answer}   onChange={(v) => upd({ answer: v })} rows={3} />
          </>
        )}
      />
    </>
  );
}

function GalleryForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
      <F.Text label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} placeholder="Gallery" />
      <ItemsEditor
        items={data.items}
        onChange={(items) => patch({ items })}
        blankItem={{ url: "", caption: "" }}
        addLabel="Add Image"
        itemLabel="Image"
        renderItem={(it, upd) => (
          <>
            <ImageField
              label="Image"
              value={it.url ? { url: it.url } : null}
              onChange={(img) => upd({ url: img?.url || "" })}
              folder="gallery"
            />
            <F.Text label="Caption (optional)" value={it.caption} onChange={(v) => upd({ caption: v })} />
          </>
        )}
      />
    </>
  );
}

function TeamForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
      <F.Text label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} placeholder="Meet Our Team" />
      <ItemsEditor
        items={data.items}
        onChange={(items) => patch({ items })}
        blankItem={{ name: "", role: "", photo: null, bio: "" }}
        addLabel="Add Team Member"
        itemLabel="Team Member"
        renderItem={(it, upd) => (
          <>
            <div className="row g-2">
              <div className="col-md-6"><F.Text label="Name" value={it.name} onChange={(v) => upd({ name: v })} /></div>
              <div className="col-md-6"><F.Text label="Role" value={it.role} onChange={(v) => upd({ role: v })} placeholder="Founder & CEO" /></div>
            </div>
            <F.Area label="Short bio (optional)" value={it.bio} onChange={(v) => upd({ bio: v })} rows={2} />
            <ImageField label="Photo" value={it.photo} onChange={(img) => upd({ photo: img })} folder="team" />
          </>
        )}
      />
    </>
  );
}

function PricingForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow"    value={data.eyebrow}    onChange={(v) => patch({ eyebrow: v })} />
      <F.Text label="Heading"    value={data.heading}    onChange={(v) => patch({ heading: v })} placeholder="Pricing" />
      <F.Text label="Subheading" value={data.subheading} onChange={(v) => patch({ subheading: v })} />
      <ItemsEditor
        items={data.plans}
        onChange={(plans) => patch({ plans })}
        blankItem={{ name: "", price: "", period: "", features: [], ctaText: "Get Started", ctaLink: "/contact", highlighted: false, badge: "" }}
        addLabel="Add Plan"
        itemLabel="Plan"
        renderItem={(it, upd) => (
          <>
            <div className="row g-2">
              <div className="col-md-4"><F.Text label="Plan Name" value={it.name}   onChange={(v) => upd({ name: v })} placeholder="Basic" /></div>
              <div className="col-md-4"><F.Text label="Price"     value={it.price}  onChange={(v) => upd({ price: v })} placeholder="₹999" /></div>
              <div className="col-md-4"><F.Text label="Period"    value={it.period} onChange={(v) => upd({ period: v })} placeholder="/month" /></div>
            </div>
            <label className="form-label small fw-semibold">Feature list</label>
            <StringListEditor items={it.features} onChange={(v) => upd({ features: v })} placeholder="Type a feature and press Enter" />
            <div className="row g-2 mt-2">
              <div className="col-md-6"><F.Text label="CTA Text"      value={it.ctaText}  onChange={(v) => upd({ ctaText: v })} /></div>
              <div className="col-md-6"><F.Text label="CTA Link"      value={it.ctaLink}  onChange={(v) => upd({ ctaLink: v })} /></div>
              <div className="col-md-6"><F.Text label="Badge (optional, e.g. Popular)" value={it.badge} onChange={(v) => upd({ badge: v })} /></div>
              <div className="col-md-6 d-flex align-items-end">
                <F.Check label="Featured / highlighted" value={it.highlighted} onChange={(v) => upd({ highlighted: v })} />
              </div>
            </div>
          </>
        )}
      />
    </>
  );
}

function StatsForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <ItemsEditor
      items={data.items}
      onChange={(items) => patch({ items })}
      blankItem={{ number: "", label: "" }}
      addLabel="Add Stat"
      itemLabel="Stat"
      renderItem={(it, upd) => (
        <div className="row g-2">
          <div className="col-md-4"><F.Text label="Number" value={it.number} onChange={(v) => upd({ number: v })} placeholder="1000+" /></div>
          <div className="col-md-8"><F.Text label="Label"  value={it.label}  onChange={(v) => upd({ label: v })}  placeholder="Happy Clients" /></div>
        </div>
      )}
    />
  );
}

function TextForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Select label="Alignment" value={data.alignment} onChange={(v) => patch({ alignment: v })}
        options={[
          { value: "left",   label: "Left"   },
          { value: "center", label: "Center" },
          { value: "right",  label: "Right"  },
        ]} />
      <F.Text label="Eyebrow" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
      <F.Text label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} />
      <F.Area label="Body"    value={data.body}    onChange={(v) => patch({ body: v })}    rows={6} />
    </>
  );
}

function BannerForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Title"    value={data.title}    onChange={(v) => patch({ title: v })} />
      <F.Text label="Subtitle" value={data.subtitle} onChange={(v) => patch({ subtitle: v })} />
      <div className="row g-2">
        <div className="col-md-6"><F.Text label="CTA Text" value={data.ctaText} onChange={(v) => patch({ ctaText: v })} /></div>
        <div className="col-md-6"><F.Text label="CTA Link" value={data.ctaLink} onChange={(v) => patch({ ctaLink: v })} /></div>
      </div>
      <ImageField label="Background Image (optional)" value={data.image} onChange={(img) => patch({ image: img })} folder="banner" />
    </>
  );
}

function ContactForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
      <F.Text label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} placeholder="Get In Touch" />
      <F.Area label="Body"    value={data.body}    onChange={(v) => patch({ body: v })} rows={3} />
      <F.Check label="Show contact form" value={data.showForm} onChange={(v) => patch({ showForm: v })} />
      {data.showForm && <F.Text label="Form Heading" value={data.formHeading} onChange={(v) => patch({ formHeading: v })} placeholder="Send Us a Message" />}
      <div className="alert alert-info small">Contact info (address, phone, email, map) is pulled from the site's Contact tab automatically.</div>
    </>
  );
}

function BlogListForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} />
      <F.Text label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} placeholder="Latest Posts" />
      <ItemsEditor
        items={data.items}
        onChange={(items) => patch({ items })}
        blankItem={{ title: "", excerpt: "", image: null, link: "", date: "" }}
        addLabel="Add Post"
        itemLabel="Post"
        renderItem={(it, upd) => (
          <>
            <div className="row g-2">
              <div className="col-md-8"><F.Text label="Title" value={it.title} onChange={(v) => upd({ title: v })} /></div>
              <div className="col-md-4"><F.Text label="Date"  value={it.date}  onChange={(v) => upd({ date: v })}  placeholder="Aug 15, 2026" /></div>
            </div>
            <F.Area label="Excerpt" value={it.excerpt} onChange={(v) => upd({ excerpt: v })} rows={2} />
            <F.Text label="Link"    value={it.link}    onChange={(v) => upd({ link: v })} placeholder="https://example.com/post" />
            <ImageField label="Cover Image" value={it.image} onChange={(img) => upd({ image: img })} folder="blog" />
          </>
        )}
      />
    </>
  );
}

function VideoEmbedForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Heading (optional)" value={data.heading} onChange={(v) => patch({ heading: v })} />
      <F.Text label="Video Embed URL"    value={data.url}     onChange={(v) => patch({ url: v })} placeholder="https://www.youtube.com/embed/XXXX" />
      <div className="alert alert-info small">Use the "embed" URL from YouTube / Vimeo. For YouTube it looks like <code>youtube.com/embed/VIDEO_ID</code>.</div>
    </>
  );
}

function MapEmbedForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Heading (optional)" value={data.heading} onChange={(v) => patch({ heading: v })} />
      <F.Text label="Google Maps Embed URL" value={data.url} onChange={(v) => patch({ url: v })} placeholder="https://www.google.com/maps/embed?pb=..." />
      <div className="alert alert-info small">In Google Maps → Share → Embed a map → copy the <code>src</code> URL from the iframe.</div>
    </>
  );
}

function LogoCloudForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} placeholder="Trusted by" />
      <ItemsEditor
        items={data.items}
        onChange={(items) => patch({ items })}
        blankItem={{ url: "", alt: "" }}
        addLabel="Add Logo"
        itemLabel="Logo"
        renderItem={(it, upd) => (
          <>
            <ImageField label="Logo" value={it.url ? { url: it.url } : null} onChange={(img) => upd({ url: img?.url || "" })} folder="logos" />
            <F.Text label="Alt / company name" value={it.alt} onChange={(v) => upd({ alt: v })} />
          </>
        )}
      />
    </>
  );
}

function RichTextForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Area label="Raw HTML" value={data.html} onChange={(v) => patch({ html: v })} rows={10} placeholder="<h2>Custom section</h2><p>...</p>" />
      <div className="alert alert-warning small"><strong>Advanced:</strong> Rendered as-is. Only use if you know HTML.</div>
    </>
  );
}


/* ═══════════════════════════════════════════════════════════════
   FORM ROUTER — dispatch by section type
   ═══════════════════════════════════════════════════════════════ */
function StepsForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow"    value={data.eyebrow}    onChange={(v) => patch({ eyebrow: v })}    placeholder="How It Works" />
      <F.Text label="Heading"    value={data.heading}    onChange={(v) => patch({ heading: v })}    placeholder="Simple, transparent process" />
      <F.Text label="Subheading" value={data.subheading} onChange={(v) => patch({ subheading: v })} />
      <label className="form-label small fw-semibold mt-2">Steps (numbered automatically)</label>
      <ItemsEditor
        items={data.items}
        onChange={(items) => patch({ items })}
        blankItem={{ icon: "check", title: "", description: "" }}
        addLabel="Add Step"
        itemLabel="Step"
        renderItem={(it, upd) => (
          <>
            <IconPicker value={it.icon} onChange={(icn) => upd({ icon: icn })} />
            <div className="row g-2 mt-2">
              <div className="col-md-6"><F.Text label="Title"       value={it.title}       onChange={(v) => upd({ title: v })}       placeholder="Reach Out" /></div>
              <div className="col-md-6"><F.Text label="Description" value={it.description} onChange={(v) => upd({ description: v })} placeholder="Short description" /></div>
            </div>
          </>
        )}
      />
    </>
  );
}

function MarqueeForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Select label="Background" value={data.background} onChange={(v) => patch({ background: v })}
        options={[
          { value: "dark",    label: "Dark strip" },
          { value: "primary", label: "Primary brand color strip" },
        ]} />
      <label className="form-label small fw-semibold">Scrolling items</label>
      <StringListEditor items={data.items} onChange={(v) => patch({ items: v })} placeholder="Type a highlight and press Enter" />
      <div className="alert alert-info small mt-3">These items scroll infinitely from right to left. Keep each item short — 2 to 5 words works best.</div>
    </>
  );
}

function AreasForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow"    value={data.eyebrow}    onChange={(v) => patch({ eyebrow: v })}    placeholder="Coverage" />
      <F.Text label="Heading"    value={data.heading}    onChange={(v) => patch({ heading: v })}    placeholder="Areas we serve" />
      <F.Text label="Subheading" value={data.subheading} onChange={(v) => patch({ subheading: v })} />
      <label className="form-label small fw-semibold">Area names</label>
      <StringListEditor items={data.items} onChange={(v) => patch({ items: v })} placeholder="Type an area and press Enter" />
      <F.Text label="Bottom note (optional)" value={data.note} onChange={(v) => patch({ note: v })} placeholder="Don't see your area? Call us." />
      <div className="alert alert-info small">Each chip automatically becomes tap-to-call using the site's contact phone.</div>
    </>
  );
}

function CallbackForm({ data, setData }) {
  const patch = (u) => setData({ ...data, ...u });
  return (
    <>
      <F.Text label="Eyebrow" value={data.eyebrow} onChange={(v) => patch({ eyebrow: v })} placeholder="Quick Response" />
      <F.Text label="Heading" value={data.heading} onChange={(v) => patch({ heading: v })} placeholder="Request a Callback" />
      <F.Area label="Body text" value={data.body} onChange={(v) => patch({ body: v })} rows={3} />
      <div className="row g-2">
        <div className="col-md-6"><F.Text label="Message field label"       value={data.serviceLabel}       onChange={(v) => patch({ serviceLabel: v })}       placeholder="What do you need?" /></div>
        <div className="col-md-6"><F.Text label="Message field placeholder" value={data.servicePlaceholder} onChange={(v) => patch({ servicePlaceholder: v })} placeholder="Briefly describe your requirement" /></div>
      </div>
      <F.Text label="Submit button text" value={data.buttonText} onChange={(v) => patch({ buttonText: v })} placeholder="Request Callback" />
      <div className="alert alert-info small">Submissions land in the same Submissions tab as the contact form. The phone button on the left side pulls the site's contact phone automatically.</div>
    </>
  );
}


const FORMS = {
  hero: HeroForm, about: AboutForm, features: FeaturesForm, services: ServicesForm,
  cta: CtaForm, testimonials: TestimonialsForm, faq: FaqForm, gallery: GalleryForm,
  team: TeamForm, pricing: PricingForm, stats: StatsForm, text: TextForm,
  banner: BannerForm, contact: ContactForm, blogList: BlogListForm,
  videoEmbed: VideoEmbedForm, mapEmbed: MapEmbedForm, logoCloud: LogoCloudForm,
  richText: RichTextForm,
  steps: StepsForm,
  marquee: MarqueeForm,
  areas: AreasForm,
  callback: CallbackForm,
};


/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — modal that hosts the right form
   ═══════════════════════════════════════════════════════════════ */
export default function SectionEditor({ pageId, section, onClose, onSaved }) {
  const [data, setData]     = useState(section?.data || {});
  const [isActive, setIsActive] = useState(section?.isActive !== false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setData(section?.data || {});
    setIsActive(section?.isActive !== false);
  }, [section]);

  const meta = SECTION_TYPES.find((t) => t.key === section?.type);
  const FormComp = FORMS[section?.type];

  const save = async () => {
    setSaving(true);
    try {
      if (section._id) {
        await api.patch(`/employee/pages/${pageId}/sections/${section._id}`, { data, isActive });
      } else {
        await api.post(`/employee/pages/${pageId}/sections`, {
          type: section.type,
          data,
          isActive,
          displayOrder: section.displayOrder ?? 0,
        });
      }
      toast.success("Section saved");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (!section) return null;

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)", overflowY: "auto" }} onClick={() => !saving && onClose()}>
      <div className="modal-dialog modal-dialog-scrollable modal-lg my-4" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <i className={`bi ${meta?.icon || "bi-square"} text-primary`}></i>
              <span>{section._id ? "Edit" : "New"} · {meta?.label || section.type}</span>
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={saving}></button>
          </div>
          <div className="modal-body">
            {meta?.desc && <div className="small text-muted mb-3">{meta.desc}</div>}
            {FormComp
              ? <FormComp data={data} setData={setData} />
              : <div className="alert alert-danger">Unknown section type: {section.type}</div>
            }
            <hr />
            <F.Check label="Show this section on the live site" value={isActive} onChange={setIsActive} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</> : <><i className="bi bi-check-lg me-1"></i>Save Section</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
