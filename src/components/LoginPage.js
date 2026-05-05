import React, { useState, useEffect } from "react";
import { login, register } from "../services/authService";
import { FaEye, FaEyeSlash } from "react-icons/fa";
// ── Feature highlights shown on the left panel ─────────────────────────────
const FEATURES = [
  {
    icon: "📊",
    title: "Smart Analytics",
    desc: "Visualize spending trends across 6 months",
  },
  {
    icon: "🎯",
    title: "Budget Goals",
    desc: "Set monthly limits and track progress live",
  },
  {
    icon: "↺",
    title: "Recurring Payments",
    desc: "Automate salary, rent, and EMI entries",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    desc: "JWT auth — your data is yours only",
  },
];

// ── Reusable styled input field ────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, hint }) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 7,
        }}
      >
        <label
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: focused ? "rgba(99,179,255,0.8)" : "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            transition: "color 0.2s",
          }}
        >
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
            {hint}
          </span>
        )}
      </div>

      <div style={{ position: "relative" }}>
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            background: focused
              ? "rgba(99,179,255,0.06)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${
              focused ? "rgba(99,179,255,0.4)" : "rgba(255,255,255,0.1)"
            }`,
            borderRadius: 10,
            padding: isPassword ? "12px 42px 12px 14px" : "12px 14px",
            color: "#F0F4FF",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s, background 0.2s",
            caretColor: "#63B3FF",
          }}
        />

        {/* Premium eye icon */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Password strength indicator — register mode only ───────────────────────
// score: 1 = Weak, 2 = Medium, 3 = Strong
function PasswordStrength({ password }) {
  const checks = [
    { label: "6+ characters", pass: password.length >= 6 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["#EF4444", "#F59E0B", "#10B981"];
  const strengthLabels = ["Weak", "Medium", "Strong"]; // used below in the label span

  if (!password) return null;

  return (
    <div style={{ marginTop: -10, marginBottom: 18 }}>
      {/* Strength bar + text label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 999,
                background:
                  i < score ? colors[score - 1] : "rgba(255,255,255,0.08)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>
        {/* strengthLabels IS used here — shows "Weak" / "Medium" / "Strong" */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            minWidth: 46,
            color: score > 0 ? colors[score - 1] : "rgba(255,255,255,0.2)",
          }}
        >
          {score > 0 ? strengthLabels[score - 1] : ""}
        </span>
      </div>

      {/* Individual check labels */}
      <div style={{ display: "flex", gap: 12 }}>
        {checks.map((c) => (
          <span
            key={c.label}
            style={{
              fontSize: 11,
              color: c.pass ? "#10B981" : "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "color 0.2s",
            }}
          >
            {c.pass ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function LoginPage({ onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Slide-up animation — flips to true after 50ms so CSS transition plays
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = isLogin
        ? await login(email, password)
        : await register(email, password);

      // Brief success flash before handing off to App
      setSuccess(true);
      setTimeout(() => onSuccess(data.token, data.email), 700);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin((prev) => !prev);
    setError("");
    setPassword("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080C14",
        display: "flex",
        fontFamily: "'DM Sans', 'Inter', 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ══════════════════════════════════════
          LEFT PANEL — branding + features
      ══════════════════════════════════════ */}
      <div className="login-left-panel"
        style={{
          width: 420,
          flexShrink: 0,
          background: "linear-gradient(160deg, #0D1A2E 0%, #080C14 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          padding: "60px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow blobs */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(30,111,217,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,179,255,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div>
          {/* Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 48,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #1E6FD9, #0D4FA8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                boxShadow: "0 4px 20px rgba(30,111,217,0.3)",
              }}
            >
              💰
            </div>
            <div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#F0F4FF",
                  letterSpacing: "-0.3px",
                }}
              >
                Money Manager
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.3)",
                  marginTop: 1,
                }}
              >
                Personal Finance
              </div>
            </div>
          </div>

          {/* Tagline */}
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#F0F4FF",
              lineHeight: 1.35,
              letterSpacing: "-0.5px",
              marginBottom: 14,
            }}
          >
            Take control of
            <br />
            your finances
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.7,
              marginBottom: 44,
            }}
          >
            Track income, expenses, and budgets
            <br />
            in one intelligent dashboard.
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{ display: "flex", alignItems: "flex-start", gap: 14 }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: "rgba(30,111,217,0.15)",
                    border: "1px solid rgba(30,111,217,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#E8EDF5",
                      marginBottom: 2,
                    }}
                  >
                    {title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      lineHeight: 1.5,
                    }}
                  >
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            marginTop: 48,
          }}
        >
          © 2025 Money Manager · Secure & Private
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT PANEL — auth form
      ══════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          {/* Heading */}
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#F0F4FF",
              letterSpacing: "-0.4px",
              margin: "0 0 6px",
            }}
          >
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.3)",
              marginBottom: 32,
            }}
          >
            {isLogin
              ? "Sign in to access your dashboard"
              : "Start tracking your finances today"}
          </p>

          {/* Tab switcher */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 4,
              marginBottom: 28,
            }}
          >
            {["Sign in", "Register"].map((label, i) => {
              const active = isLogin ? i === 0 : i === 1;
              return (
                <button
                  key={label}
                  onClick={switchMode}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    border: "none",
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    cursor: "pointer",
                    background: active
                      ? "linear-gradient(135deg, rgba(30,111,217,0.3), rgba(13,79,168,0.3))"
                      : "transparent",
                    color: active ? "#63B3FF" : "rgba(255,255,255,0.3)",
                    boxShadow: active
                      ? "inset 0 1px 0 rgba(99,179,255,0.1)"
                      : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Success state ── */}
          {success ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  color: "#10B981",
                }}
              >
                ✓
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, color: "#F0F4FF" }}>
                {isLogin ? "Signed in!" : "Account created!"}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                  marginTop: 6,
                }}
              >
                Loading your dashboard…
              </p>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {error && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    marginBottom: 22,
                    fontSize: 13,
                    color: "#FCA5A5",
                    lineHeight: 1.5,
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }}
                  >
                    ✕
                  </span>
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <Field
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />

                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  hint={!isLogin ? "min. 6 characters" : ""}
                />

                {/* Password strength — register mode only */}
                {!isLogin && <PasswordStrength password={password} />}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "13px",
                    background: loading
                      ? "rgba(30,111,217,0.3)"
                      : "linear-gradient(135deg, #1E6FD9 0%, #0D4FA8 100%)",
                    border: "1px solid rgba(30,111,217,0.4)",
                    borderRadius: 10,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading
                      ? "none"
                      : "0 4px 20px rgba(30,111,217,0.25)",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "spin 0.7s linear infinite",
                        }}
                      />
                      Please wait…
                    </>
                  ) : isLogin ? (
                    "Sign in →"
                  ) : (
                    "Create account →"
                  )}
                </button>

                {/* Divider */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    margin: "22px 0",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "rgba(255,255,255,0.07)",
                    }}
                  />
                  <span
                    style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}
                  >
                    OR
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "rgba(255,255,255,0.07)",
                    }}
                  />
                </div>

                {/* Switch mode link */}
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.3)",
                    margin: 0,
                  }}
                >
                  {isLogin ? "New here? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={switchMode}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#63B3FF",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      padding: 0,
                    }}
                  >
                    {isLogin ? "Create an account" : "Sign in instead"}
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Global keyframes — spin for loading button, fadeIn for success */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        input::placeholder {
          color: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}
