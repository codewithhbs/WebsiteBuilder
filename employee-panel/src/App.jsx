import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, EmpLayout } from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Websites from "./pages/Websites";
import WebsiteEditor from "./pages/WebsiteEditor";
import NewWebsite from "./pages/NewWebsite";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><EmpLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="websites" element={<Websites />} />
        <Route path="websites/new" element={<NewWebsite />} />
        <Route path="websites/:id" element={<WebsiteEditor />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
