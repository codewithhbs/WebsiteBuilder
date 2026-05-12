import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, AdminLayout } from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Clients from "./pages/Clients";
import Websites from "./pages/Websites";
import WebsiteDetail from "./pages/WebsiteDetail";
import Themes from "./pages/Themes";
import Audit from "./pages/Audit";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="clients" element={<Clients />} />
        <Route path="websites" element={<Websites />} />
        <Route path="websites/:id" element={<WebsiteDetail />} />
        <Route path="themes" element={<Themes />} />
        <Route path="audit" element={<Audit />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
