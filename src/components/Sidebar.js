import React, { useState } from "react";

const NAV = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "transactions", icon: "↕", label: "Transactions" },
  { id: "analytics", icon: "◉", label: "Analytics" },
  { id: "budget", icon: "◎", label: "Budget Goals" },
  { id: "recurring", icon: "↺", label: "Recurring" },
  { id: "categories", icon: "⊞", label: "Categories" },
  { id: "settings", icon: "⚙", label: "Settings" },
];

const ACCOUNT_ACCENTS = [
  "#63B3FF",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#6366F1",
];

// ── Confirm delete modal ───────────────────────────────────────────────────
// Shows a warning if the account has linked transactions (orphan risk).
function DeleteAccountModal({
  account,
  transactionCount,
  onConfirm,
  onCancel,
}) {
  const hasTransactions = transactionCount > 0;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 400,
        padding: "0 16px",
      }}
    >
      <div
        style={{
          background: "#0D1117",
          border: `1px solid ${hasTransactions ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.2)"}`,
          borderRadius: 14,
          padding: "28px 28px",
          width: "100%",
          maxWidth: 360,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>
          {hasTransactions ? "⚠️" : "🗑️"}
        </div>
        <h3
          style={{
            color: "#F0F4FF",
            fontWeight: 500,
            fontSize: 16,
            marginBottom: 10,
          }}
        >
          Delete "{account.name}"?
        </h3>

        {/* Warn if account has transactions */}
        {hasTransactions && (
          <div
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12,
              color: "#F59E0B",
              marginBottom: 14,
              lineHeight: 1.6,
              textAlign: "left",
            }}
          >
            ⚠ This account has <strong>{transactionCount}</strong> linked
            transaction{transactionCount !== 1 ? "s" : ""}. They will remain in
            your history but will no longer show an account name.
          </div>
        )}

        <p
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 13,
            marginBottom: 22,
            lineHeight: 1.5,
          }}
        >
          {hasTransactions
            ? "The account balance will be removed. This cannot be undone."
            : "This account has no transactions. It will be permanently removed."}
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 8,
              background: hasTransactions
                ? "rgba(245,158,11,0.15)"
                : "rgba(239,68,68,0.15)",
              border: hasTransactions
                ? "1px solid rgba(245,158,11,0.35)"
                : "1px solid rgba(239,68,68,0.3)",
              color: hasTransactions ? "#F59E0B" : "#EF4444",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "inherit",
            }}
          >
            Delete anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  activePage,
  setActivePage,
  userEmail,
  accounts = [],
  transactions = [], // FIX: needed to count linked transactions per account
  onLogout,
  onAddTransaction,
  onCreateAccount,
  onDeleteAccount,
  onTransfer,
  isOpen,
  onClose,
}) {
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "MM";
  const [hoveredDel, setHoveredDel] = useState(null);
  // FIX: which account is pending deletion (shows confirm modal)
  const [pendingDelete, setPendingDelete] = useState(null);

  const netWorth = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  const handleNav = (id) => {
    setActivePage(id);
    if (onClose) onClose();
  };

  // FIX: count how many transactions reference this account
  const countLinkedTransactions = (accountId) =>
    transactions.filter((t) => t.accountId === accountId).length;

  const handleDeleteClick = (acc) => {
    // Open confirm modal instead of deleting immediately
    setPendingDelete(acc);
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    onDeleteAccount(pendingDelete.id, pendingDelete.name);
    setPendingDelete(null);
  };

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
      zIndex: 200,
      overflowY: "auto",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    brand: {
      padding: "22px 20px 16px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      flexShrink: 0,
    },
    brandRow: { display: "flex", alignItems: "center", gap: 10 },
    brandIcon: {
      width: 34,
      height: 34,
      borderRadius: 9,
      background: "linear-gradient(135deg, #1E6FD9, #0D4FA8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      flexShrink: 0,
    },
    brandName: {
      fontSize: 14,
      fontWeight: 600,
      color: "#F0F4FF",
      letterSpacing: "-0.3px",
    },
    brandSub: { fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 1 },
    addBtnWrap: { padding: "12px 10px 6px", flexShrink: 0 },
    addBtn: {
      width: "100%",
      background: "linear-gradient(135deg, #1E6FD9 0%, #0D4FA8 100%)",
      border: "none",
      borderRadius: 9,
      padding: "10px 14px",
      color: "#fff",
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 8,
      boxShadow: "0 4px 14px rgba(30,111,217,0.3)",
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: 500,
      color: "rgba(255,255,255,0.2)",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      padding: "12px 14px 6px",
    },
    navItem: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 12px",
      borderRadius: 8,
      cursor: "pointer",
      marginBottom: 1,
      marginLeft: 8,
      marginRight: 8,
      transition: "all 0.15s",
      background: active ? "rgba(99,179,255,0.1)" : "transparent",
      border: active
        ? "1px solid rgba(99,179,255,0.18)"
        : "1px solid transparent",
      color: active ? "#63B3FF" : "rgba(255,255,255,0.42)",
      fontSize: 12,
      fontWeight: active ? 500 : 400,
    }),
    navIcon: { fontSize: 13, width: 18, textAlign: "center", flexShrink: 0 },
    accountsSection: {
      borderTop: "1px solid rgba(255,255,255,0.06)",
      paddingBottom: 4,
      flexShrink: 0,
    },
    accountsHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 14px 6px",
    },
    accountsLabel: {
      fontSize: 10,
      fontWeight: 500,
      color: "rgba(255,255,255,0.2)",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    },
    iconBtn: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "rgba(255,255,255,0.4)",
      borderRadius: 6,
      padding: "3px 7px",
      fontSize: 11,
      cursor: "pointer",
    },
    accountItem: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 14px",
      borderRadius: 6,
      marginLeft: 4,
      marginRight: 4,
    },
    accDot: (color) => ({
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: color,
      flexShrink: 0,
    }),
    accName: {
      fontSize: 12,
      color: "rgba(255,255,255,0.55)",
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    accBalance: (color) => ({ fontSize: 12, fontWeight: 500, color }),
    accDelBtn: (hov) => ({
      background: "none",
      border: "none",
      color: hov ? "#EF4444" : "rgba(255,255,255,0.15)",
      cursor: "pointer",
      fontSize: 12,
      padding: "0 2px",
      transition: "color 0.15s",
      flexShrink: 0,
    }),
    netWorthRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 14px 10px",
      borderTop: "1px solid rgba(255,255,255,0.05)",
    },
    footer: {
      padding: "12px 12px 16px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      flexShrink: 0,
    },
    userRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: "50%",
      flexShrink: 0,
      background: "linear-gradient(135deg, #1E6FD9, #0D4FA8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      fontWeight: 600,
      color: "#fff",
    },
    userEmail: {
      fontSize: 11,
      color: "rgba(255,255,255,0.35)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      flex: 1,
    },
    logoutBtn: {
      width: "100%",
      padding: "7px 10px",
      borderRadius: 7,
      background: "rgba(255,80,80,0.07)",
      border: "1px solid rgba(255,80,80,0.12)",
      color: "rgba(255,110,110,0.6)",
      fontSize: 11,
      cursor: "pointer",
      textAlign: "center",
    },
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 199,
          }}
        />
      )}

      <div
        className={`sidebar-panel ${isOpen ? "sidebar-open" : ""}`}
        style={S.sidebar}
      >
        {/* Brand */}
        <div style={S.brand}>
          <div style={S.brandRow}>
            <div style={S.brandIcon}>💰</div>
            <div>
              <div style={S.brandName}>Money Manager</div>
              <div style={S.brandSub}>Personal Finance</div>
            </div>
          </div>
        </div>

        {/* Add Transaction */}
        <div style={S.addBtnWrap}>
          <button
            style={S.addBtn}
            onClick={() => {
              onAddTransaction();
              onClose?.();
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            Add Transaction
          </button>
        </div>

        {/* Nav */}
        <div style={{ flexShrink: 0 }}>
          <div style={S.sectionLabel}>Menu</div>
          {NAV.map((item) => (
            <div
              key={item.id}
              style={S.navItem(activePage === item.id)}
              onClick={() => handleNav(item.id)}
            >
              <span style={S.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Accounts */}
        <div style={S.accountsSection}>
          <div style={S.accountsHeader}>
            <span style={S.accountsLabel}>Accounts</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button style={S.iconBtn} onClick={onTransfer} title="Transfer">
                ⇄
              </button>
              <button
                style={S.iconBtn}
                onClick={onCreateAccount}
                title="Add account"
              >
                +
              </button>
            </div>
          </div>
          {accounts.length === 0 ? (
            <div
              style={{
                padding: "8px 14px 10px",
                fontSize: 11,
                color: "rgba(255,255,255,0.2)",
              }}
            >
              No accounts yet.{" "}
              <span
                style={{ color: "#63B3FF", cursor: "pointer" }}
                onClick={onCreateAccount}
              >
                Create one
              </span>
            </div>
          ) : (
            <>
              {accounts.map((acc, i) => {
                const accent = ACCOUNT_ACCENTS[i % ACCOUNT_ACCENTS.length];
                return (
                  <div key={acc.id} style={S.accountItem}>
                    <div style={S.accDot(accent)} />
                    <span style={S.accName}>{acc.name}</span>
                    <span style={S.accBalance(accent)}>
                      ₹{(acc.balance || 0).toFixed(0)}
                    </span>
                    {/* FIX: clicking × opens confirm modal instead of deleting immediately */}
                    <button
                      style={S.accDelBtn(hoveredDel === acc.id)}
                      onMouseEnter={() => setHoveredDel(acc.id)}
                      onMouseLeave={() => setHoveredDel(null)}
                      onClick={() => handleDeleteClick(acc)}
                      title="Delete account"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <div style={S.netWorthRow}>
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.25)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  Net worth
                </span>
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}
                >
                  ₹{netWorth.toFixed(0)}
                </span>
              </div>
            </>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={S.footer}>
          <div style={S.userRow}>
            <div style={S.avatar}>{initials}</div>
            <span style={S.userEmail}>{userEmail}</span>
          </div>
          <button style={S.logoutBtn} onClick={onLogout}>
            Sign out
          </button>
        </div>
      </div>

      {/* FIX: Delete account confirmation modal */}
      {pendingDelete && (
        <DeleteAccountModal
          account={pendingDelete}
          transactionCount={countLinkedTransactions(pendingDelete.id)}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <style>{`
        @media (min-width: 769px) {
          .sidebar-panel { transform: translateX(0) !important; }
        }
        @media (max-width: 768px) {
          .sidebar-panel {
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0,0,0,0.4);
          }
          .sidebar-panel.sidebar-open { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
