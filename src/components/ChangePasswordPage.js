import React, { useState } from "react";
import { authAPI } from "../services/api";

function Field({ label, value, onChange, placeholder, hint }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 7,
        }}
      >
        <label
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            transition: "color 0.2s",
            color: focused ? "rgba(99,179,255,0.8)" : "rgba(255,255,255,0.35)",
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
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: focused
              ? "rgba(99,179,255,0.06)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${focused ? "rgba(99,179,255,0.4)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 10,
            padding: "12px 42px 12px 14px",
            color: "#F0F4FF",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s, background 0.2s",
            caretColor: "#63B3FF",
          }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.4)",
            fontSize: 13,
          }}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    { label: "6+ chars", pass: password.length >= 6 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["#EF4444", "#F59E0B", "#10B981"];
  const labels = ["Weak", "Medium", "Strong"];
  if (!password) return null;

  return (
    <div style={{ marginTop: -10, marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 6,
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
          {score > 0 ? labels[score - 1] : ""}
        </span>
      </div>
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
            }}
          >
            {c.pass ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ChangePasswordPage({ showToast }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Enter your current password");
      return;
    }
    if (!newPassword) {
      setError("Enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from current");
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      showToast("Password changed successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "36px 40px",
        minHeight: "100vh",
        color: "#E8EDF5",
        fontFamily: "'DM Sans', sans-serif",
        maxWidth: 560,
      }}
    >
      {/* Header */}
      <h1
        style={{
          fontSize: 26,
          fontWeight: 600,
          color: "#F0F4FF",
          margin: "0 0 4px",
          letterSpacing: "-0.5px",
        }}
      >
        Settings
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.35)",
          marginBottom: 32,
        }}
      >
        Manage your account security
      </p>

      {/* Card */}
      <div
        style={{
          background: "#0D1117",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "28px 32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            paddingBottom: 20,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(30,111,217,0.15)",
              border: "1px solid rgba(30,111,217,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🔒
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#F0F4FF" }}>
              Change Password
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                marginTop: 2,
              }}
            >
              Update your account password
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "#FCA5A5",
              lineHeight: 1.5,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <span style={{ color: "#EF4444", flexShrink: 0 }}>✕</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
          <Field
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            hint="min. 6 characters"
          />
          <PasswordStrength password={newPassword} />

          <Field
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />

          {/* Match indicator */}
          {confirmPassword && (
            <div
              style={{
                fontSize: 11,
                marginTop: -10,
                marginBottom: 20,
                color: newPassword === confirmPassword ? "#10B981" : "#EF4444",
              }}
            >
              {newPassword === confirmPassword
                ? "✓ Passwords match"
                : "✕ Passwords do not match"}
            </div>
          )}

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
              boxShadow: loading ? "none" : "0 4px 20px rgba(30,111,217,0.25)",
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
                />{" "}
                Updating…
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
