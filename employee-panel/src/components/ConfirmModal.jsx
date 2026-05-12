import { useEffect } from "react";

/**
 * Reusable Bootstrap-styled confirmation modal.
 *
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *   setConfirm({ title, message, variant: "danger", confirmText: "Delete", onConfirm: () => ... });
 *   ...
 *   <ConfirmModal data={confirm} onClose={() => setConfirm(null)} />
 */
export default function ConfirmModal({ data, onClose, loading = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    if (data) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, loading, onClose]);

  if (!data) return null;

  const variant = data.variant || "primary";
  const icon = data.icon || (variant === "danger" ? "bi-exclamation-triangle-fill" : "bi-question-circle-fill");

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => !loading && onClose()}>
      <div className="modal-dialog modal-dialog-centered modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow">
          <div className="modal-body text-center p-4">
            <div className={`text-${variant} mb-3`}>
              <i className={`bi ${icon}`} style={{ fontSize: "2.5rem" }}></i>
            </div>
            <h6 className="mb-2">{data.title || "Are you sure?"}</h6>
            {data.message && <p className="text-muted small mb-0">{data.message}</p>}
          </div>
          <div className="modal-footer border-0 justify-content-center pt-0 pb-4">
            <button type="button" className="btn btn-light px-3" onClick={onClose} disabled={loading}>
              {data.cancelText || "Cancel"}
            </button>
            <button
              type="button"
              className={`btn btn-${variant} px-3`}
              onClick={data.onConfirm}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Working…</>
              ) : (
                data.confirmText || "Confirm"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}