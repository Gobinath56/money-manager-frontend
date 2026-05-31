import React, { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  InstallPrompt
//  Shows a bottom banner when the browser fires the `beforeinstallprompt`
//  event — meaning the PWA criteria are met and the app is installable.
//
//  Place this file at: src/components/InstallPrompt.js
//  Usage in App.js: <InstallPrompt />  (add near bottom of return, above Toast)
// ─────────────────────────────────────────────────────────────────────────────

const DISMISSED_KEY = "coinwise_install_dismissed";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Don't show if user already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Don't show if already running as installed PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    const handler = (e) => {
      e.preventDefault(); // stop Chrome's default mini-infobar
      setDeferredPrompt(e);
      // Small delay so it doesn't pop up immediately on page load
      setTimeout(() => {
        setVisible(true);
        setTimeout(() => setMounted(true), 50); // trigger CSS transition
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    } else {
      setInstalling(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setMounted(false);
    setTimeout(() => setVisible(false), 300);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80, // above BottomNav on mobile
        left: "50%",
        transform: `translateX(-50%) translateY(${mounted ? "0" : "20px"})`,
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.3s ease, transform 0.3s ease",
        width: "calc(100% - 32px)",
        maxWidth: 480,
        zIndex: 300,
        background: "#0D1117",
        border: "1px solid rgba(30,111,217,0.35)",
        borderRadius: 16,
        padding: "16px 18px",
        boxShadow:
          "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(30,111,217,0.15)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      {/* Icon */}
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
          flexShrink: 0,
          boxShadow: "0 4px 14px rgba(30,111,217,0.35)",
        }}
      >
        💰
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#F0F4FF",
            marginBottom: 2,
          }}
        >
          Install CoinWise
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.5,
          }}
        >
          Add to home screen for the best experience
        </div>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        disabled={installing}
        style={{
          padding: "8px 16px",
          background: installing
            ? "rgba(30,111,217,0.3)"
            : "linear-gradient(135deg, #1E6FD9, #0D4FA8)",
          border: "1px solid rgba(30,111,217,0.4)",
          borderRadius: 9,
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          cursor: installing ? "not-allowed" : "pointer",
          flexShrink: 0,
          fontFamily: "inherit",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {installing ? "Opening…" : "Install"}
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.25)",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: "0 2px",
          flexShrink: 0,
          fontFamily: "inherit",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "rgba(255,255,255,0.6)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "rgba(255,255,255,0.25)")
        }
        aria-label="Dismiss install prompt"
      >
        ×
      </button>
    </div>
  );
}
