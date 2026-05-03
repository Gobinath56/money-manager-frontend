import React, { useState, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ── Constants ──────────────────────────────────────────────────────────────
const INCOME_CATEGORIES = ["SALARY", "FREELANCE", "INVESTMENT", "OTHER"];
const EXPENSE_CATEGORIES = [
  "FUEL",
  "MOVIE",
  "FOOD",
  "LOAN",
  "MEDICAL",
  "OTHER",
];

// ── Inline styles — dark premium theme ────────────────────────────────────
const S = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 500,
    backdropFilter: "blur(3px)",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  modal: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 18,
    width: "100%",
    maxWidth: 480,
    margin: "0 16px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  title: {
    fontSize: 17,
    fontWeight: 500,
    color: "#F0F4FF",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)",
    borderRadius: 8,
    width: 30,
    height: 30,
    cursor: "pointer",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  tab: (active, color) => ({
    flex: 1,
    padding: "13px 0",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    background: active ? color + "18" : "transparent",
    color: active ? color : "rgba(255,255,255,0.35)",
    borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
    transition: "all 0.15s",
  }),
  body: { padding: "20px 24px" },
  fieldWrap: { marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 7,
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9,
    padding: "10px 13px",
    color: "#F0F4FF",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  select: {
    width: "100%",
    background: "#161D2A",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9,
    padding: "10px 13px",
    color: "#F0F4FF",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  divisionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  divBtn: (active) => ({
    padding: "10px",
    borderRadius: 9,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    background: active ? "rgba(99,179,255,0.12)" : "rgba(255,255,255,0.04)",
    border: active
      ? "1px solid rgba(99,179,255,0.3)"
      : "1px solid rgba(255,255,255,0.1)",
    color: active ? "#63B3FF" : "rgba(255,255,255,0.4)",
    transition: "all 0.15s",
  }),
  footer: {
    display: "flex",
    gap: 10,
    padding: "16px 24px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
  },
  cancelBtn: {
    flex: 1,
    padding: "11px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.55)",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  submitBtn: (color) => ({
    flex: 1,
    padding: "11px",
    background: `linear-gradient(135deg, ${color}, ${color}CC)`,
    border: `1px solid ${color}66`,
    color: "#fff",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    boxShadow: `0 4px 16px ${color}33`,
  }),
  noAccountWarn: {
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: 9,
    padding: "10px 13px",
    fontSize: 12,
    color: "#F59E0B",
    marginBottom: 16,
    lineHeight: 1.5,
  },
};

// ── Default form state ─────────────────────────────────────────────────────
const defaultForm = {
  type: "INCOME",
  amount: "",
  description: "",
  category: "",
  division: "PERSONAL",
  date: new Date(),
  accountId: "",
};

// ── Component ──────────────────────────────────────────────────────────────
export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  editTransaction,
  accounts = [], // ← list of Account objects from backend
}) {
  const [activeTab, setActiveTab] = useState("income");
  const [formData, setFormData] = useState(defaultForm);

  // ── resetForm — wrapped in useCallback so it can be used in useEffect ───
  // useCallback memoizes the function — recreated only when activeTab changes
  const resetForm = useCallback(() => {
    setFormData({
      ...defaultForm,
      type: activeTab === "income" ? "INCOME" : "EXPENSE",
    });
  }, [activeTab]);

  // ── Pre-fill form when editing an existing transaction ───────────────────
  useEffect(() => {
    if (editTransaction) {
      setFormData({
        type: editTransaction.type,
        amount: editTransaction.amount,
        description: editTransaction.description,
        category: editTransaction.category,
        division: editTransaction.division,
        date: new Date(editTransaction.date),
        accountId: editTransaction.accountId || "",
      });
      setActiveTab(editTransaction.type === "INCOME" ? "income" : "expense");
    } else {
      resetForm();
    }
  }, [editTransaction, isOpen, resetForm]);

  // ── When tab switches, update type and clear category ───────────────────
  useEffect(() => {
    if (!editTransaction) {
      setFormData((prev) => ({
        ...prev,
        type: activeTab === "income" ? "INCOME" : "EXPENSE",
        category: "",
      }));
    }
  }, [activeTab, editTransaction]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.accountId) {
      alert("Please select an account");
      return;
    }
    onSubmit({
      ...formData,
      // Ensure amount is a number, not a string from the input
      amount: parseFloat(formData.amount),
    });
    resetForm();
  };

  const categories =
    activeTab === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const accentColor = activeTab === "income" ? "#10B981" : "#EF4444";

  if (!isOpen) return null;

  return (
    <div style={S.overlay} onClick={handleClose}>
      {/* Stop click propagation so clicking inside modal doesn't close it */}
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div style={S.header}>
          <h2 style={S.title}>
            {editTransaction ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button style={S.closeBtn} onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* ── Type tabs — hidden when editing (type is fixed) ── */}
        {!editTransaction && (
          <div style={S.tabs}>
            <button
              style={S.tab(activeTab === "income", "#10B981")}
              onClick={() => setActiveTab("income")}
            >
              💰 Income
            </button>
            <button
              style={S.tab(activeTab === "expense", "#EF4444")}
              onClick={() => setActiveTab("expense")}
            >
              💸 Expense
            </button>
          </div>
        )}

        {/* ── Form body ── */}
        <form onSubmit={handleSubmit}>
          <div style={S.body}>
            {/* ── Account selector ── */}
            {/* This is the key new field — links transaction to an account */}
            <div style={S.fieldWrap}>
              <label style={S.label}>
                Account <span style={{ color: "#EF4444" }}>*</span>
              </label>
              {accounts.length === 0 ? (
                // Warn if user hasn't created any accounts yet
                <div style={S.noAccountWarn}>
                  ⚠ No accounts found. Create an account first using the
                  Accounts button in the sidebar.
                </div>
              ) : (
                <select
                  required
                  style={S.select}
                  value={formData.accountId}
                  onChange={(e) =>
                    setFormData({ ...formData, accountId: e.target.value })
                  }
                >
                  <option value="">Select account…</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — ₹{acc.balance?.toFixed(2)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* ── Amount ── */}
            <div style={S.fieldWrap}>
              <label style={S.label}>
                Amount (₹) <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 14,
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  style={{ ...S.input, paddingLeft: 28 }}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* ── Description ── */}
            <div style={S.fieldWrap}>
              <label style={S.label}>
                Description <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                style={S.input}
                placeholder="What was this for?"
              />
            </div>

            {/* ── Category ── */}
            <div style={S.fieldWrap}>
              <label style={S.label}>
                Category <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                required
                style={S.select}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* ── Division ── */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Division</label>
              <div style={S.divisionGrid}>
                {["PERSONAL", "OFFICE"].map((div) => (
                  <button
                    key={div}
                    type="button"
                    style={S.divBtn(formData.division === div)}
                    onClick={() => setFormData({ ...formData, division: div })}
                  >
                    {div === "PERSONAL" ? "👤 Personal" : "🏢 Office"}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Date & Time ── */}
            <div style={S.fieldWrap}>
              <label style={S.label}>
                Date & Time <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <DatePicker
                selected={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                showTimeSelect
                dateFormat="dd MMM yyyy, h:mm aa"
                maxDate={new Date()}
                wrapperClassName="date-picker-wrapper"
                customInput={<input style={S.input} readOnly />}
              />
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={S.footer}>
            <button type="button" style={S.cancelBtn} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" style={S.submitBtn(accentColor)}>
              {editTransaction ? "✓ Update" : "+ Add"}
            </button>
          </div>
        </form>
      </div>

      {/* DatePicker global style override for dark theme */}
      <style>{`
        .react-datepicker { background: #161D2A !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #E8EDF5 !important; }
        .react-datepicker__header { background: #0D1117 !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
        .react-datepicker__current-month, .react-datepicker__day-name, .react-datepicker-time__header { color: #E8EDF5 !important; }
        .react-datepicker__day { color: #E8EDF5 !important; }
        .react-datepicker__day:hover { background: rgba(99,179,255,0.15) !important; border-radius: 6px !important; }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected { background: #1E6FD9 !important; border-radius: 6px !important; }
        .react-datepicker__day--disabled { color: rgba(255,255,255,0.2) !important; }
        .react-datepicker__time-container { border-left: 1px solid rgba(255,255,255,0.08) !important; }
        .react-datepicker__time { background: #161D2A !important; }
        .react-datepicker__time-list-item { color: #E8EDF5 !important; }
        .react-datepicker__time-list-item:hover { background: rgba(99,179,255,0.15) !important; }
        .react-datepicker__time-list-item--selected { background: #1E6FD9 !important; }
        .react-datepicker__navigation-icon::before { border-color: rgba(255,255,255,0.5) !important; }
        .date-picker-wrapper { width: 100%; }
      `}</style>
    </div>
  );
}
