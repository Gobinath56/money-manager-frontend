import React from "react";

// ── Mobile top header ──────────────────────────────────────────────────────
// Shown only on mobile (< 769px).
// Contains: hamburger menu → opens sidebar drawer, page title, add button.
// Desktop header is handled inside each page component itself.

const PAGE_TITLES = {
  dashboard:    "Dashboard",
  transactions: "Transactions",
  analytics:    "Analytics",
  budget:       "Budget Goals",
  recurring:    "Recurring",
};

export default function MobileHeader({ activePage, onOpenSidebar, onAddTransaction }) {
  return (
    <>
      <div className="mobile-header">
        {/* Hamburger — opens the sidebar drawer */}
        <button
          className="mobile-header-btn"
          onClick={onOpenSidebar}
          aria-label="Open menu"
        >
          <div className="hamburger-line" />
          <div className="hamburger-line" />
          <div className="hamburger-line" />
        </button>

        {/* Page title */}
        <div className="mobile-header-title">
          <span style={{ marginRight: 6 }}>💰</span>
          {PAGE_TITLES[activePage] || "Money Manager"}
        </div>

        {/* Quick add button */}
        <button
          className="mobile-header-btn"
          onClick={onAddTransaction}
          aria-label="Add transaction"
          style={{ fontSize: 22, fontWeight: 300, color: "#63B3FF" }}
        >
          +
        </button>
      </div>

      <style>{`
        .mobile-header {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 56px;
            background: #0D1117;
            border-bottom: 1px solid rgba(255,255,255,0.07);
            padding: 0 16px;
            z-index: 150;
            font-family: 'DM Sans', 'Segoe UI', sans-serif;
          }

          .mobile-header-title {
            font-size: 15px;
            font-weight: 500;
            color: #F0F4FF;
            letter-spacing: -0.2px;
          }

          .mobile-header-btn {
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 8px;
            color: rgba(255,255,255,0.6);
          }

          .hamburger-line {
            width: 20px;
            height: 2px;
            background: rgba(255,255,255,0.6);
            border-radius: 2px;
          }
        }
      `}</style>
    </>
  );
}