import React, { useEffect, useState } from "react";

// ── Toast component ────────────────────────────────────────────────────────
// Props:
//   message  — string to display
//   type     — "success" | "error" | "info"
//   onClose  — called when toast should be dismissed
//
// Usage in App.js:
//   const [toast, setToast] = useState(null);
//   const showToast = (message, type = "success") => {
//     setToast({ message, type });
//     setTimeout(() => setToast(null), 3500);
//   };
//   {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

const CONFIG = {
  success: {
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.25)",
    icon: "✓",
  },
  error: {
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.25)",
    icon: "✕",
  },
  info: {
    color: "#63B3FF",
    bg: "rgba(99,179,255,0.12)",
    border: "rgba(99,179,255,0.25)",
    icon: "ℹ",
  },
};

export default function Toast({ message, type = "success", onClose }) {
  const cfg = CONFIG[type] || CONFIG.success;

  // ── Animate in on mount ──────────────────────────────────────────────────
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small timeout so the CSS transition plays on mount
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 18px",
        borderRadius: 12,
        background: "#0D1117",
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.border}`,
        minWidth: 260,
        maxWidth: 400,
        // Slide up + fade in animation via opacity/transform
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          flexShrink: 0,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          color: cfg.color,
        }}
      >
        {cfg.icon}
      </div>

      {/* Message */}
      <span
        style={{ fontSize: 13, color: "#E8EDF5", flex: 1, lineHeight: 1.4 }}
      >
        {message}
      </span>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.25)",
          cursor: "pointer",
          fontSize: 16,
          padding: "0 0 0 4px",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
