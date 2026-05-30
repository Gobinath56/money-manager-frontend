import React, { useState, useEffect, useRef } from "react";
import { login, register } from "../services/authService";
import { authAPI } from "../services/api";
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
// Handles both text and password types
// Password type gets an eye toggle button
function Field({ label, type = "text", value, onChange, placeholder, hint }) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div style={{ marginBottom: 18 }}>
      {/* Label row — label on left, hint on right */}
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

      {/* Input wrapper — relative so eye button can be positioned inside */}
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
            border: `1px solid ${focused ? "rgba(99,179,255,0.4)" : "rgba(255,255,255,0.1)"}`,
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

        {/* Eye toggle — only shown for password fields */}
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

// ── Password strength indicator ────────────────────────────────────────────
// Shows 3 bar segments + label: Weak / Medium / Strong
// Only renders when password has content
function PasswordStrength({ password }) {
  const checks = [
    { label: "6+ characters", pass: password.length >= 6 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["#EF4444", "#F59E0B", "#10B981"];
  const strengthLabels = ["Weak", "Medium", "Strong"];

  if (!password) return null;

  return (
    <div style={{ marginTop: -10, marginBottom: 18 }}>
      {/* Strength bar */}
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

// ── 6-digit OTP input boxes ────────────────────────────────────────────────
// Each digit gets its own box
// Auto-advances to next box on input
// Backspace moves to previous box
// Supports paste — pastes all 6 digits at once
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split("");

  const handleChange = (i, val) => {
    // Only allow digits
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[i] = val.slice(-1); // take last char if multiple pasted
    onChange(newDigits.join(""));
    // Auto advance to next box
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    // On backspace in empty box, go to previous box
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    // Strip non-digits, take first 6
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    // Focus last filled box
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: "center",
        marginBottom: 20,
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: 46,
            height: 54,
            textAlign: "center",
            fontSize: 22,
            fontWeight: 600,
            color: "#F0F4FF",
            background: digits[i]
              ? "rgba(99,179,255,0.1)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${digits[i] ? "rgba(99,179,255,0.4)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 10,
            outline: "none",
            caretColor: "#63B3FF",
            transition: "all 0.15s",
          }}
        />
      ))}
    </div>
  );
}

// ── Main Login Page Component ──────────────────────────────────────────────
// Manages 4 screens via `screen` state:
//   "login"    → normal sign in form
//   "register" → create account form
//   "forgot"   → enter email to receive OTP
//   "otp"      → enter OTP + set new password
export default function LoginPage({ onSuccess }) {
  // ── Screen state ───────────────────────────────────────────────────────
  // Controls which form is shown
  const [screen, setScreen] = useState("login");

  // ── Login / Register state ─────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── UI state ───────────────────────────────────────────────────────────
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false); // for slide-up animation

  // ── Forgot / OTP / Reset state ─────────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState(""); // 6-digit string
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(""); // green message
  const [resendTimer, setResendTimer] = useState(0); // countdown seconds

  // ── Mount animation — triggers slide-up on first render ───────────────
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // ── Resend OTP countdown timer ─────────────────────────────────────────
  // Counts down from 60 to 0 after OTP is sent
  // While > 0, resend button is disabled
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  // ── Helper: clear all messages ─────────────────────────────────────────
  const clearErrors = () => {
    setError("");
    setOtpSuccess("");
  };

  // ── Handler: Login or Register ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data =
        screen === "login"
          ? await login(email, password)
          : await register(email, password);
      // Brief success flash before navigating to dashboard
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

  // ── Handler: Forgot Password — sends OTP to email ─────────────────────
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    if (!forgotEmail.trim()) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail.trim());
      // Move to OTP screen and start 60s resend countdown
      setScreen("otp");
      setResendTimer(60);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send OTP. Check your email.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: Resend OTP ────────────────────────────────────────────────
  // Only callable when resendTimer === 0
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    clearErrors();
    setLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail.trim());
      setOtp(""); // clear existing OTP input
      setResendTimer(60); // restart countdown
      setOtpSuccess("OTP resent successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Handler: Reset Password — verifies OTP + sets new password ─────────
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    // Client-side validations
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(forgotEmail.trim(), otp, newPassword);
      setOtpSuccess("Password reset successful!");
      // After 2s, go back to login and clear all state
      setTimeout(() => {
        setScreen("login");
        setForgotEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpSuccess("");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = screen === "login";

  // ── Shared reusable styles ─────────────────────────────────────────────
  const S = {
    // Primary action button — blue gradient
    submitBtn: (disabled) => ({
      width: "100%",
      padding: "13px",
      background: disabled
        ? "rgba(30,111,217,0.3)"
        : "linear-gradient(135deg, #1E6FD9 0%, #0D4FA8 100%)",
      border: "1px solid rgba(30,111,217,0.4)",
      borderRadius: 10,
      color: "#fff",
      fontSize: 14,
      fontWeight: 500,
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: disabled ? "none" : "0 4px 20px rgba(30,111,217,0.25)",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    }),
    // Back arrow button
    backBtn: {
      background: "none",
      border: "none",
      color: "#63B3FF",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 500,
      padding: 0,
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 24,
    },
    // Red error banner
    errorBox: {
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
    },
    // Green success banner
    successBox: {
      background: "rgba(16,185,129,0.08)",
      border: "1px solid rgba(16,185,129,0.2)",
      borderRadius: 10,
      padding: "12px 16px",
      marginBottom: 22,
      fontSize: 13,
      color: "#6EE7B7",
      lineHeight: 1.5,
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
    },
    // Spinner used inside buttons while loading
    spinner: {
      width: 14,
      height: 14,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      display: "inline-block",
      animation: "spin 0.7s linear infinite",
    },
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
      {/* ══════════════════════════════════════════
          LEFT PANEL — branding + feature list
          Hidden on mobile via CSS class
      ══════════════════════════════════════════ */}
      <div
        className="login-left-panel"
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
        {/* Decorative glow blobs — purely visual */}
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
          {/* Brand logo + name */}
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

      {/* ══════════════════════════════════════════
          RIGHT PANEL — auth forms
          Slides up on mount via opacity/transform
      ══════════════════════════════════════════ */}
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
          {/* ════════════════════════════════════════
              SCREEN: FORGOT PASSWORD
              User enters their registered email
              to receive a 6-digit OTP
          ════════════════════════════════════════ */}
          {screen === "forgot" && (
            <>
              <button
                style={S.backBtn}
                onClick={() => {
                  setScreen("login");
                  clearErrors();
                }}
              >
                ← Back to sign in
              </button>

              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#F0F4FF",
                  letterSpacing: "-0.4px",
                  margin: "0 0 6px",
                }}
              >
                Forgot password?
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 32,
                }}
              >
                Enter your email and we'll send a 6-digit OTP
              </p>

              {error && (
                <div style={S.errorBox}>
                  <span style={{ color: "#EF4444", flexShrink: 0 }}>✕</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleForgotSubmit}>
                <Field
                  label="Email address"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <button
                  type="submit"
                  style={S.submitBtn(loading)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span style={S.spinner} /> Sending OTP…
                    </>
                  ) : (
                    "Send OTP →"
                  )}
                </button>
              </form>
            </>
          )}

          {/* ════════════════════════════════════════
              SCREEN: OTP VERIFICATION + RESET
              User enters the 6-digit OTP received
              by email, then sets their new password
          ════════════════════════════════════════ */}
          {screen === "otp" && (
            <>
              <button
                style={S.backBtn}
                onClick={() => {
                  setScreen("forgot");
                  clearErrors();
                  setOtp("");
                }}
              >
                ← Back
              </button>

              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#F0F4FF",
                  letterSpacing: "-0.4px",
                  margin: "0 0 6px",
                }}
              >
                Enter OTP
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 8,
                }}
              >
                We sent a 6-digit code to
              </p>
              {/* Show the email the OTP was sent to */}
              <p
                style={{
                  fontSize: 13,
                  color: "#63B3FF",
                  fontWeight: 500,
                  marginBottom: 28,
                }}
              >
                {forgotEmail}
              </p>

              {/* Error / success banners */}
              {error && (
                <div style={S.errorBox}>
                  <span style={{ color: "#EF4444", flexShrink: 0 }}>✕</span>
                  {error}
                </div>
              )}
              {otpSuccess && (
                <div style={S.successBox}>
                  <span style={{ color: "#10B981", flexShrink: 0 }}>✓</span>
                  {otpSuccess}
                </div>
              )}

              <form onSubmit={handleResetSubmit}>
                {/* OTP boxes */}
                <div style={{ marginBottom: 8 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 12,
                    }}
                  >
                    6-digit OTP
                  </label>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>

                {/* Resend OTP — shows countdown or clickable link */}
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  {resendTimer > 0 ? (
                    <span
                      style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}
                    >
                      Resend OTP in{" "}
                      <span style={{ color: "#63B3FF" }}>{resendTimer}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#63B3FF",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* New password */}
                <Field
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  hint="min. 6 characters"
                />
                <PasswordStrength password={newPassword} />

                {/* Confirm new password */}
                <Field
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />

                {/* Live password match indicator */}
                {confirmPassword && (
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: -10,
                      marginBottom: 16,
                      color:
                        newPassword === confirmPassword ? "#10B981" : "#EF4444",
                    }}
                  >
                    {newPassword === confirmPassword
                      ? "✓ Passwords match"
                      : "✕ Passwords do not match"}
                  </div>
                )}

                {/* Submit — disabled until OTP is complete */}
                <button
                  type="submit"
                  style={S.submitBtn(loading || otp.length < 6)}
                  disabled={loading || otp.length < 6}
                >
                  {loading ? (
                    <>
                      <span style={S.spinner} /> Resetting…
                    </>
                  ) : (
                    "Reset Password →"
                  )}
                </button>
              </form>
            </>
          )}

          {/* ════════════════════════════════════════
              SCREEN: LOGIN / REGISTER
              Default screen shown on app open
              Tab switcher toggles between the two
          ════════════════════════════════════════ */}
          {(screen === "login" || screen === "register") && (
            <>
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

              {/* Sign in / Register tab switcher */}
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
                      onClick={() => {
                        setScreen(i === 0 ? "login" : "register");
                        setError("");
                        setPassword("");
                      }}
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

              {/* ── Success animation shown after login/register ── */}
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
                  <p
                    style={{ fontSize: 15, fontWeight: 500, color: "#F0F4FF" }}
                  >
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
                    <div style={S.errorBox}>
                      <span
                        style={{
                          color: "#EF4444",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        ✕
                      </span>
                      {error}
                    </div>
                  )}

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

                    {/* Password strength — only on register */}
                    {!isLogin && <PasswordStrength password={password} />}

                    {/* Forgot password link — only on login */}
                    {isLogin && (
                      <div
                        style={{
                          textAlign: "right",
                          marginTop: -10,
                          marginBottom: 20,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setScreen("forgot");
                            setForgotEmail(email); // pre-fill email if already typed
                            clearErrors();
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#63B3FF",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={loading}
                      style={S.submitBtn(loading)}
                    >
                      {loading ? (
                        <>
                          <span style={S.spinner} /> Please wait…
                        </>
                      ) : isLogin ? (
                        "Sign in →"
                      ) : (
                        "Create account →"
                      )}
                    </button>

                    {/* OR divider */}
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

                    {/* Switch between login and register */}
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
                        onClick={() => {
                          setScreen(isLogin ? "register" : "login");
                          setError("");
                          setPassword("");
                        }}
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
            </>
          )}
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
