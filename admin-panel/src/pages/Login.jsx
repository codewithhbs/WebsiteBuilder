import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await login(email, password);

      toast.success("Welcome Back 👋");

      nav("/");

    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-page">

        {/* LEFT SIDE */}
        <div className="left-side">

          <div className="brand-badge">
            Hovermedia Gmb
          </div>

          <h1>
            Employee Website
            <br />
            Management System
          </h1>

          <p>
            Manage websites, employees, services,
            banners and client operations from one
            powerful dashboard platform.
          </p>

          <div className="features">

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-window-stack"></i>
              </div>

              <div>
                <h6>Website Management</h6>
                <span>
                  Manage all client websites
                </span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-people"></i>
              </div>

              <div>
                <h6>Employee Management</h6>
                <span>
                  Manage team & employees
                </span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-bar-chart"></i>
              </div>

              <div>
                <h6>Realtime Dashboard</h6>
                <span>
                  Track all operations instantly
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="right-side">

          <div className="login-card">

            <div className="text-center mb-4">

              <div className="logo-box">
                <i className="bi bi-person-workspace"></i>
              </div>

              <h2>
                Employee Login
              </h2>

              <p>
                Login to your dashboard
              </p>

            </div>

            {/* FORM */}
            <form onSubmit={onSubmit}>

              {/* EMAIL */}
              <div className="mb-3">

                <label className="form-label">
                  Email Address
                </label>

                <div className="input-box">

                  <i className="bi bi-envelope"></i>

                  <input
                    type="email"
                    placeholder="Enter email"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                  />

                </div>

              </div>

              {/* PASSWORD */}
              <div className="mb-4">

                <label className="form-label">
                  Password
                </label>

                <div className="input-box">

                  <i className="bi bi-lock"></i>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter password"
                    required
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="show-btn"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    <i
                      className={`bi ${showPassword
                          ? "bi-eye-slash"
                          : "bi-eye"
                        }`}
                    ></i>
                  </button>

                </div>

              </div>

              {/* BUTTON */}
              <button
                type="submit"
                className="login-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <i className="bi bi-arrow-right ms-2"></i>
                  </>
                )}
              </button>

            </form>

          </div>

        </div>

      </div>

      {/* CSS */}
      <style>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Inter, sans-serif;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          background: #f8fafc;
        }

        /* LEFT */
        .left-side {
          flex: 1;
          padding: 70px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background:
            linear-gradient(
              135deg,
              #eff6ff,
              #f8fafc
            );
        }

        .brand-badge {
          width: fit-content;
          padding: 10px 18px;
          border-radius: 999px;
          background: white;
          color: #2563eb;
          font-weight: 600;
          margin-bottom: 24px;
          border: 1px solid #dbeafe;
        }

        .left-side h1 {
          font-size: 56px;
          line-height: 1.1;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 24px;
        }

        .left-side p {
          font-size: 17px;
          color: #64748b;
          max-width: 550px;
          line-height: 1.7;
          margin-bottom: 50px;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #7c3aed
            );

          color: white;
          font-size: 22px;
        }

        .feature-item h6 {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .feature-item span {
          color: #64748b;
          font-size: 14px;
        }

        /* RIGHT */
        .right-side {
          width: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: white;
          border-left: 1px solid #e2e8f0;
        }

        .login-card {
          width: 100%;
          max-width: 380px;
        }

        .logo-box {
          width: 90px;
          height: 90px;
          margin: auto auto 20px;

          border-radius: 28px;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #7c3aed
            );

          color: white;
          font-size: 36px;
        }

        .login-card h2 {
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .login-card p {
          color: #64748b;
        }

        .form-label {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 10px;
        }

        .input-box {
          position: relative;
        }

        .input-box i {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .input-box input {
          width: 100%;
          height: 58px;

          border-radius: 16px;
          border: 1px solid #dbe3ee;

          background: #f8fafc;

          padding: 0 18px 0 50px;

          transition: 0.3s ease;
        }

        .input-box input:focus {
          outline: none;
          border-color: #2563eb;

          background: white;

          box-shadow:
            0 0 0 4px rgba(37,99,235,0.1);
        }

        .show-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);

          border: none;
          background: transparent;

          color: #64748b;
        }

        .login-btn {
          width: 100%;
          height: 58px;

          border: none;
          border-radius: 16px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #7c3aed
            );

          color: white;
          font-size: 16px;
          font-weight: 700;

          transition: 0.3s ease;
        }

        .login-btn:hover {
          transform: translateY(-2px);

          box-shadow:
            0 18px 35px rgba(37,99,235,0.2);
        }

        /* MOBILE */
        @media(max-width: 991px){

          .left-side{
            display:none;
          }

          .right-side{
            width:100%;
            border-left:none;
          }

        }

      `}</style>

    </>
  );
}