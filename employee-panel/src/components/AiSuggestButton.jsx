import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";

/**
 * AI suggestion button - fills a field with auto-generated content.
 *
 * Backend expected: POST /employee/ai/suggest  body: { kind, context }
 *   -> { suggestion: "..." }
 *
 * Props:
 *   kind     -> string identifier ("review", "service-description", "about-long", "seo-description", etc.)
 *   context  -> object sent to backend for grounding (siteName, serviceTitle, etc.)
 *   onApply  -> (text) => void, called with the suggestion
 *   label    -> button label (default "Auto-suggest")
 *   size     -> "sm" | "" (default "sm")
 */
export default function AiSuggestButton({ kind, context = {}, onApply, label = "Auto-suggest", size = "sm" }) {
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/employee/ai/suggest", { kind, context });
      if (data?.suggestion) {
        onApply(data.suggestion);
        toast.success("Suggestion applied — edit as needed");
      } else {
        toast.error("No suggestion returned");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "AI suggest failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-outline-primary ${size ? `btn-${size}` : ""}`}
      onClick={run}
      disabled={loading}
      title="Generate content with AI"
    >
      {loading ? (
        <><span className="spinner-border spinner-border-sm me-1"></span>Thinking…</>
      ) : (
        <><i className="bi bi-stars me-1"></i>{label}</>
      )}
    </button>
  );
}