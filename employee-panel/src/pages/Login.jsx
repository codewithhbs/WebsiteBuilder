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
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-login-page">

      {/* BACKGROUND DESIGN */}
      <div className="bg-circle bg-circle-1"></div>
      <div className="bg-circle bg-circle-2"></div>

      <div className="container">

        <div
          className="row align-items-center justify-content-center"
          style={{ minHeight: "100vh" }}
        >

          {/* LEFT SIDE */}
          <div className="col-lg-6 d-none d-lg-block pe-5">

            <div className="left-content">  

              <div className="brand-badge">
                <i className="bi bi-globe2 me-2"></i>
                Hovermedia Gmb Website
              </div>

              <h1 className="hero-title">
                Employee Website
                <br />
                Management Portal
              </h1>

              <p className="hero-description">
                Manage client websites, services, banners,
                reviews and employee workflows from one
                modern dashboard platform built for the
                Hovermedia Gmb team.
              </p>

              <div className="feature-wrapper">

                <div className="feature-box">
                  <div className="feature-icon">
                    <i className="bi bi-window-stack"></i>
                  </div>

                  <div>
                    <h6>Website Management</h6>
                    <p>
                      Manage all client websites easily
                    </p>
                  </div>
                </div>

                <div className="feature-box">
                  <div className="feature-icon">
                    <i className="bi bi-shield-check"></i>
                  </div>

                  <div>
                    <h6>Secure Employee Access</h6>
                    <p>
                      Protected authentication system
                    </p>
                  </div>
                </div>

                <div className="feature-box">
                  <div className="feature-icon">
                    <i className="bi bi-bar-chart-line"></i>
                  </div>

                  <div>
                    <h6>Realtime Operations</h6>
                    <p>
                      Monitor services and updates live
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* LOGIN CARD */}
          <div className="col-xl-4 col-lg-5 col-md-7">

            <div className="login-card">

              {/* LOGO */}
              <div className="text-center mb-5">

                <div className="login-logo">
                  <i className="bi bi-person-workspace"></i>
                </div>

                <h2 className="login-title">
                  Employee Login
                </h2>

                <p className="login-subtitle">
                  Sign in to manage client websites
                </p>

              </div>

              {/* FORM */}
              <form onSubmit={onSubmit}>

                {/* EMAIL */}
                <div className="mb-4">

                  <label className="form-label custom-label">
                    Email Address
                  </label>

                  <div className="input-wrapper">

                    <i className="bi bi-envelope"></i>

                    <input
                      type="email"
                      className="custom-input"
                      placeholder="Enter your email"
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

                  <label className="form-label custom-label">
                    Password
                  </label>

                  <div className="input-wrapper">

                    <i className="bi bi-lock"></i>

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      className="custom-input pe-5"
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                    />

                    <button
                      type="button"
                      className="password-toggle"
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

                {/* OPTIONS */}
                <div className="d-flex justify-content-between align-items-center mb-4">

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="remember"
                    />

                    <label
                      className="form-check-label small"
                      htmlFor="remember"
                    >
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    className="forgot-btn"
                  >
                    Forgot Password?
                  </button>

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

      </div>

      {/* STYLES */}
      <style jsx>{`
        .employee-login-page {
          min-height: 100vh;
          background: #f8fafc;
          position: relative;
          overflow: hidden;
        }

        .bg-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
        }

        .bg-circle-1 {
          width: 350px;
          height: 350px;
          background: rgba(59,130,246,0.18);
          top: -120px;
          left: -100px;
        }

        .bg-circle-2 {
          width: 300px;
          height: 300px;
          background: rgba(168,85,247,0.14);
          bottom: -100px;
          right: -80px;
        }

        .left-content {
          position: relative;
          z-index: 2;
        }

        .brand-badge {
          display: inline-flex;
          align-items: center;
          padding: 10px 18px;
          border-radius: 999px;
          background: white;
          border: 1px solid #e2e8f0;
          font-size: 14px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 800;
          line-height: 1.1;
          color: #0f172a;
          margin-bottom: 24px;
        }

        .hero-description {
          font-size: 1.05rem;
          line-height: 1.8;
          color: #64748b;
          max-width: 540px;
          margin-bottom: 50px;
        }

        .feature-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .feature-box {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .feature-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #7c3aed
            );

          display: flex;
          align-items: center;
          justify-content: center;

          color: white;
          font-size: 22px;

          box-shadow:
            0 15px 30px rgba(37,99,235,0.18);
        }

        .feature-box h6 {
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }

        .feature-box p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .login-card {
          background: white;
          border-radius: 32px;
          padding: 42px;
          border: 1px solid #e2e8f0;

          box-shadow:
            0 25px 50px rgba(15,23,42,0.08);

          position: relative;
          z-index: 2;
        }

        .login-logo {
          width: 90px;
          height: 90px;
          margin: auto;
          margin-bottom: 22px;

          border-radius: 28px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #7c3aed
            );

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 36px;
          color: white;

          box-shadow:
            0 20px 40px rgba(37,99,235,0.2);
        }

        .login-title {
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .login-subtitle {
          color: #64748b;
          margin: 0;
        }

        .custom-label {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 10px;
        }

        .input-wrapper {
          position: relative;
        }

        .input-wrapper i {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          z-index: 2;
        }

        .custom-input {
          width: 100%;
          height: 58px;

          border-radius: 18px;

          border: 1px solid #dbe3ee;

          background: #f8fafc;

          padding: 0 18px 0 50px;

          color: #0f172a;

          transition: 0.3s ease;
        }

        .custom-input:focus {
          outline: none;

          border-color: #2563eb;

          background: white;

          box-shadow:
            0 0 0 4px rgba(37,99,235,0.1);
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);

          border: none;
          background: transparent;

          color: #64748b;
        }

        .forgot-btn {
          border: none;
          background: transparent;
          color: #2563eb;
          font-size: 14px;
          font-weight: 600;
        }

        .login-btn {
          width: 100%;
          height: 58px;

          border: none;
          border-radius: 18px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #7c3aed
            );

          color: white;
          font-weight: 700;
          font-size: 16px;

          transition: 0.3s ease;
        }

        .login-btn:hover {
          transform: translateY(-2px);

          box-shadow:
            0 18px 40px rgba(37,99,235,0.2);
        }

        @media (max-width: 768px) {

          .login-card {
            padding: 30px;
          }

          .hero-title {
            font-size: 2.7rem;
          }

        }
      `}</style>

    </div>
  );
}