import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";

export default function Themes() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const { data } = await api.get("/public/themes");
    setItems(data.items);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (t) => {
    try {
      await api.patch(`/admin/themes/${t._id}`, { isActive: !t.isActive });
      toast.success("Updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <h4 className="mb-3">Themes</h4>
      <div className="row">
        {items.length === 0 ? (
          <div className="empty-state">No themes. Run <code>npm run seed:admin</code></div>
        ) : items.map((t) => (
          <div key={t._id} className="col-md-6 col-lg-4 mb-3">
            <div className="card">
              {t.previewImage?.url ? (
                <img src={t.previewImage.url} alt="" className="card-img-top" style={{ height: 180, objectFit: "cover" }} />
              ) : (
                <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: 180 }}>
                  <i className="bi bi-image text-muted fs-1"></i>
                </div>
              )}
              <div className="card-body">
                <h6 className="mb-1">{t.name}</h6>
                <code className="small text-muted">{t.themeKey}</code>
                <p className="small mt-2">{t.description}</p>
                <button className={"btn btn-sm " + (t.isActive ? "btn-outline-danger" : "btn-outline-success")} onClick={() => toggle(t)}>
                  {t.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
