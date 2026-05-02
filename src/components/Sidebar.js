import React from "react";

const NAV = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "transactions", icon: "↕", label: "Transactions" },
  { id: "analytics", icon: "◉", label: "Analytics" },
  { id: "budget", icon: "◎", label: "Budget Goals" },
  { id: "recurring", icon: "↺", label: "Recurring" },
];

const S = {
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: 240,
    height: "100vh",
    background: "#0D1117",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  brand: {
    padding: "28px 24px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "linear-gradient(135deg, #1E6FD9, #0D4FA8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    marginBottom: 10,
    boxShadow: "0 4px 14px rgba(30,111,217,0.3)",
  },
  brandName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#F0F4FF",
    letterSpacing: "-0.3px",
    margin: 0,
  },
  brandSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.28)",
    marginTop: 2,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  addBtnWrap: { padding: "14px 12px 8px" },
  addBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #1E6FD9 0%, #0D4FA8 100%)",
    border: "none",
    borderRadius: 10,
    padding: "11px 14px",
    color: "#fff",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 4px 14px rgba(30,111,217,0.3)",
    transition: "opacity 0.15s",
    letterSpacing: "-0.1px",
  },
  nav: {
    flex: 1,
    padding: "8px 10px",
    overflowY: "auto",
  },
  navSectionLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: "rgba(255,255,255,0.2)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: "10px 10px 6px",
  },
  navItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 9,
    cursor: "pointer",
    marginBottom: 2,
    transition: "all 0.15s",
    background: active ? "rgba(99,179,255,0.1)" : "transparent",
    border: active
      ? "1px solid rgba(99,179,255,0.18)"
      : "1px solid transparent",
    color: active ? "#63B3FF" : "rgba(255,255,255,0.42)",
    fontSize: 13,
    fontWeight: active ? 500 : 400,
  }),
  navIcon: {
    fontSize: 14,
    width: 20,
    textAlign: "center",
    flexShrink: 0,
  },
  footer: {
    padding: "14px 14px 18px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    flexShrink: 0,
    background: "linear-gradient(135deg, #1E6FD9, #0D4FA8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
  },
  userEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.38)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  logoutBtn: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    background: "rgba(255,80,80,0.07)",
    border: "1px solid rgba(255,80,80,0.14)",
    color: "rgba(255,110,110,0.65)",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "center",
  },
};

export default function Sidebar({
  activePage,
  setActivePage,
  userEmail,
  onLogout,
  onAddTransaction,
}) {
  // Show first 2 letters of email as avatar initials
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "MM";

  return (
    <div style={S.sidebar}>
      {/* ── Brand ── */}
      <div style={S.brand}>
        <div style={S.brandIcon}>💰</div>
        <p style={S.brandName}>Money Manager</p>
        <p style={S.brandSub}>Personal Finance</p>
      </div>

      {/* ── Add Transaction CTA ── */}
      <div style={S.addBtnWrap}>
        <button style={S.addBtn} onClick={onAddTransaction}>
          <span style={{ fontSize: 18, lineHeight: 1, marginTop: -1 }}>+</span>
          Add Transaction
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav style={S.nav}>
        <div style={S.navSectionLabel}>Menu</div>
        {NAV.map((item) => (
          <div
            key={item.id}
            style={S.navItem(activePage === item.id)}
            onClick={() => setActivePage(item.id)}
          >
            <span style={S.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* ── User footer ── */}
      <div style={S.footer}>
        <div style={S.userRow}>
          <div style={S.avatar}>{initials}</div>
          <span style={S.userEmail} title={userEmail}>
            {userEmail}
          </span>
        </div>
        <button style={S.logoutBtn} onClick={onLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
