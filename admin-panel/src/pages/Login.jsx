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
    <div
      className="position-relative overflow-hidden"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #111827 45%, #1e293b 100%)",
      }}
    >

      {/* BACKGROUND GLOW */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          background:
            "rgba(59,130,246,0.25)",
          filter: "blur(120px)",
          borderRadius: "50%",
          top: -100,
          left: -100,
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          background:
            "rgba(168,85,247,0.18)",
          filter: "blur(120px)",
          borderRadius: "50%",
          bottom: -100,
          right: -100,
        }}
      />

      {/* MAIN */}
      <div className="container position-relative">
        <div
          className="row justify-content-center align-items-center"
          style={{ minHeight: "100vh" }}
        >

          {/* LEFT SIDE */}
          <div className="col-lg-6 d-none d-lg-block pe-5">

            <div className="text-white">

              <div
                className="d-inline-flex align-items-center justify-content-center mb-4"
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 20,
                  background:
                    "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                  boxShadow:
                    "0 20px 50px rgba(59,130,246,0.35)",
                }}
              >
                <i className="bi bi-shield-lock fs-2"></i>
              </div>

              <h1
                className="fw-bold mb-3"
                style={{
                  fontSize: "4rem",
                  lineHeight: 1.1,
                }}
              >
                Manage Your
                <br />
                SaaS Platform
              </h1>

              <p
                className="text-light opacity-75 mb-5"
                style={{
                  fontSize: "1.1rem",
                  maxWidth: 500,
                }}
              >
                Powerful admin dashboard to manage websites,
                services, reviews, banners, analytics and users
                in one place.
              </p>

              {/* FEATURES */}
              <div className="d-flex flex-column gap-4">

                <div className="d-flex align-items-center gap-3">
                  <div className="feature-icon">
                    <i className="bi bi-lightning-charge"></i>
                  </div>

                  <div>
                    <h6 className="text-white mb-1">
                      Super Fast Dashboard
                    </h6>

                    <small className="text-light opacity-75">
                      Optimized admin experience
                    </small>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="feature-icon">
                    <i className="bi bi-shield-check"></i>
                  </div>

                  <div>
                    <h6 className="text-white mb-1">
                      Secure Authentication
                    </h6>

                    <small className="text-light opacity-75">
                      Enterprise level security
                    </small>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="feature-icon">
                    <i className="bi bi-bar-chart"></i>
                  </div>

                  <div>
                    <h6 className="text-white mb-1">
                      Real-time Management
                    </h6>

                    <small className="text-light opacity-75">
                      Manage everything instantly
                    </small>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* LOGIN CARD */}
          <div className="col-lg-5 col-md-8">

            <div
              className="card border-0 shadow-lg overflow-hidden"
              style={{
                borderRadius: 28,
                background:
                  "rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                border:
                  "1px solid rgba(255,255,255,0.1)",
              }}
            >

              <div className="card-body p-5">

                {/* HEADER */}
                <div className="text-center mb-5">

                  <div
                    className="mx-auto mb-4 d-flex align-items-center justify-content-center"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 24,
                      background:
                        "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                      boxShadow:
                        "0 20px 40px rgba(59,130,246,0.3)",
                    }}
                  >
                    <i className="bi bi-person-lock text-white fs-2"></i>
                  </div>

                  <h2 className="fw-bold text-white mb-2">
                    Welcome Back
                  </h2>

                  <p className="text-light opacity-75 mb-0">
                    Sign in to continue to your dashboard
                  </p>

                </div>

                {/* FORM */}
                <form onSubmit={onSubmit}>

                  {/* EMAIL */}
                  <div className="mb-4">

                    <label className="form-label text-light small fw-semibold mb-2">
                      Email Address
                    </label>

                    <div className="position-relative">

                      <i
                        className="bi bi-envelope position-absolute"
                        style={{
                          left: 18,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                        }}
                      ></i>

                      <input
                        type="email"
                        className="form-control login-input"
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

                    <label className="form-label text-light small fw-semibold mb-2">
                      Password
                    </label>

                    <div className="position-relative">

                      <i
                        className="bi bi-lock position-absolute"
                        style={{
                          left: 18,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                        }}
                      ></i>

                      <input
                        type={
                          showPassword ? "text" : "password"
                        }
                        className="form-control login-input"
                        placeholder="Enter your password"
                        required
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                      />

                      <button
                        type="button"
                        className="btn position-absolute border-0"
                        style={{
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                        }}
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                      >
                        <i
                          className={`bi ${
                            showPassword
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
                        type="checkbox"
                        className="form-check-input"
                        id="remember"
                      />

                      <label
                        htmlFor="remember"
                        className="form-check-label text-light small"
                      >
                        Remember me
                      </label>
                    </div>

                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none small"
                      style={{ color: "#60a5fa" }}
                    >
                      Forgot Password?
                    </button>

                  </div>

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn w-100 login-btn"
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
      </div>

      {/* STYLES */}
      <style jsx>{`
        .login-input {
          height: 58px;
          border-radius: 16px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding-left: 50px;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .login-input::placeholder {
          color: #94a3b8;
        }

        .login-input:focus {
          background: rgba(255,255,255,0.12);
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.15);
          color: white;
        }

        .login-btn {
          height: 58px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(
            135deg,
            #3b82f6,
            #8b5cf6
          );
          color: white;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow:
            0 20px 40px rgba(59,130,246,0.3);
          color: white;
        }

        .feature-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          backdrop-filter: blur(10px);
        }

        @media (max-width: 768px) {
          .card-body {
            padding: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}