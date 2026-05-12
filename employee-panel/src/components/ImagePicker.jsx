import { useRef, useState } from "react";

export default function ImagePicker({ label, currentUrl, onChange, name = "image" }) {
  const ref = useRef();
  const [preview, setPreview] = useState(null);

  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  return (
    <div className="mb-3">
      {label && <label className="form-label small">{label}</label>}
      <div className="d-flex align-items-center gap-3">
        {(preview || currentUrl) && (
          <img src={preview || currentUrl} alt="" className="preview-img" />
        )}
        <input ref={ref} type="file" accept="image/*" className="form-control form-control-sm" onChange={pick} name={name} />
      </div>
    </div>
  );
}
