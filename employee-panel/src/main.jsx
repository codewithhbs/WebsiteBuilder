import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

// ---- GMB AI Cloud single sign-on --------------------------------------------
// The GMB app opens  /<path>?sso_token=<jwt>  - store the token and clean the URL
// BEFORE the AuthProvider reads localStorage, so tenants never see the login page.
(() => {
  try {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("sso_token");
    // embed=1 -> running inside the GMB panel iframe: hide our own sidebar for this session
    if (url.searchParams.get("embed") === "1") {
      sessionStorage.setItem("emp_embed", "1");
      url.searchParams.delete("embed");
      window.history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + url.hash);
    }
    if (t) {
      localStorage.setItem("emp_token", t);
      url.searchParams.delete("sso_token");
      window.history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + url.hash);
    }
  } catch {
    /* ignore */
  }
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
