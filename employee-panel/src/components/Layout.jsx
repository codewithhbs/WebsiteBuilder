import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-5 text-center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export const EmpLayout = () => {
  const { user, logout } = useAuth();
  return (
    <div className="d-flex">
      <aside className="sidebar" style={{ width: 240 }}>
        <div className="brand">
          <i className="bi bi-briefcase-fill me-2"></i>Employee Panel
        </div>
        <nav className="px-2">
          <NavLink to="/" end><i className="bi bi-speedometer2 me-2"></i>Dashboard</NavLink>
          <NavLink to="/clients"><i className="bi bi-person-vcard me-2"></i>My Clients</NavLink>
          <NavLink to="/websites"><i className="bi bi-globe2 me-2"></i>My Websites</NavLink>
        </nav>
        <div className="mt-auto px-3 pt-4">
          <div className="text-light small mb-2">
            <i className="bi bi-person-circle me-1"></i> {user?.name}
            <div className="text-muted small">{user?.role}</div>
          </div>
          <button className="btn btn-sm btn-outline-light w-100" onClick={logout}>
            <i className="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </aside>
      <main className="flex-grow-1 p-4" style={{ overflowX: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
};
