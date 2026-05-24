import React, { useState, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { categoryAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

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
    padding: "0 16px",
  },
  modal: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 18,
    width: "100%",
    maxWidth: 480,
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
    overflow: "hidden",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    position: "sticky",
    top: 0,
    background: "#0D1117",
    zIndex: 10,
  },
  title: { fontSize: 16, fontWeight: 500, color: "#F0F4FF", margin: 0 },
  closeBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)",
    borderRadius: 8,
    width: 28,
    height: 28,
    cursor: "pointer",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: { display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  tab: (active, color) => ({
    flex: 1,
    padding: "12px 0",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    background: active ? color + "18" : "transparent",
    color: active ? color : "rgba(255,255,255,0.35)",
    borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
    transition: "all 0.15s",
  }),
  body: { padding: "18px 22px" },
  field: { marginBottom: 14 },
  label: {
    display: "block",
    fontSize: 10,
    fontWeight: 500,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 6,
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
  divGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
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
  warnBox: {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 12,
    color: "#FCA5A5",
    marginBottom: 12,
    lineHeight: 1.5,
  },
  noAccountBox: {
    background: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.2)",
    borderRadius: 9,
    padding: "10px 13px",
    fontSize: 12,
    color: "#F59E0B",
    marginBottom: 14,
    lineHeight: 1.5,
  },
  footer: {
    display: "flex",
    gap: 10,
    padding: "14px 22px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    position: "sticky",
    bottom: 0,
    background: "#0D1117",
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
  submitBtn: (color, disabled) => ({
    flex: 1,
    padding: "11px",
    background: disabled
      ? "rgba(255,255,255,0.05)"
      : `linear-gradient(135deg, ${color}, ${color}CC)`,
    border: `1px solid ${disabled ? "rgba(255,255,255,0.1)" : color + "66"}`,
    color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
  }),
};

const defaultForm = {
  type: "INCOME",
  amount: "",
  description: "",
  category: "",
  subCategory: "",
  division: "PERSONAL",
  date: new Date(),
  accountId: "",
};

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  editTransaction,
  accounts = [],
}) {
  const [activeTab, setActiveTab] = useState("income");
  const [formData, setFormData] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  // Categories loaded from backend
  const [allCategories, setAllCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  // Subcategories for the currently selected category
  const [subCategories, setSubCategories] = useState([]);

  const isMobile = window.innerWidth <= 768;
  const accentColor = activeTab === "income" ? "#10B981" : "#EF4444";

  // ── Load categories when modal opens ────────────────────────────────────
  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const res = await categoryAPI.getAll();
      setAllCategories(res.data);
    } catch {
      // Fallback: if categories API fails, use hardcoded defaults
      setAllCategories([]);
    } finally {
      setCatLoading(false);
    }
  };

  // ── Reset / pre-fill form ─────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormData({
      ...defaultForm,
      type: activeTab === "income" ? "INCOME" : "EXPENSE",
    });
    setSubCategories([]);
  }, [activeTab]);

  // REPLACE WITH THIS:
  useEffect(() => {
    // loadSubs defined INSIDE the effect so it doesn't need
    // to be in the dependency array — this is the correct pattern
    const loadSubs = (categoryName, type) => {
      const cat = allCategories.find(
        (c) => c.name === categoryName && c.type === type,
      );
      setSubCategories(cat?.subCategories || []);
    };

    if (editTransaction) {
      setFormData({
        type: editTransaction.type,
        amount: editTransaction.amount,
        description: editTransaction.description,
        category: editTransaction.category,
        subCategory: editTransaction.subCategory || "",
        division: editTransaction.division,
        date: new Date(editTransaction.date),
        accountId: editTransaction.accountId || "",
      });
      setActiveTab(editTransaction.type === "INCOME" ? "income" : "expense");

      if (editTransaction.category) {
        loadSubs(editTransaction.category, editTransaction.type);
      }
    } else {
      resetForm();
    }
  }, [editTransaction, isOpen, resetForm, allCategories]);
  // ↑ allCategories added here — warning is now gone
  // When tab switches, reset type and category
  useEffect(() => {
    if (!editTransaction) {
      setFormData((prev) => ({
        ...prev,
        type: activeTab === "income" ? "INCOME" : "EXPENSE",
        category: "",
        subCategory: "",
      }));
      setSubCategories([]);
    }
  }, [activeTab, editTransaction]);

  // ── Load subcategories when category is selected ─────────────────────────
  const loadSubsForCategory = (categoryName, type) => {
    const currentType = type || formData.type;
    const cat = allCategories.find(
      (c) => c.name === categoryName && c.type === currentType,
    );
    setSubCategories(cat?.subCategories || []);
  };

  const handleCategoryChange = (categoryName) => {
    setFormData({ ...formData, category: categoryName, subCategory: "" });
    loadSubsForCategory(categoryName, formData.type);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountId) {
      alert("Please select an account");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ── Balance warning ───────────────────────────────────────────────────────
  const selectedAccount = accounts.find((a) => a.id === formData.accountId);
  const willExceedBalance =
    formData.type === "EXPENSE" &&
    selectedAccount &&
    parseFloat(formData.amount) > selectedAccount.balance;

  // ── Categories for current type ───────────────────────────────────────────
  const typeCategories = allCategories.filter((c) => c.type === formData.type);

  // Fallback hardcoded categories if API returned nothing
  const FALLBACK = {
    INCOME: ["SALARY", "FREELANCE", "INVESTMENT", "OTHER"],
    EXPENSE: [
      "FOOD",
      "FUEL",
      "TRIP",
      "MEDICAL",
      "MOVIE",
      "LOAN",
      "SHOPPING",
      "OTHER",
    ],
  };

  if (!isOpen) return null;

  return (
    <div style={S.overlay} onClick={handleClose}>
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

        {/* ── Type tabs ── */}
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

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          <div style={S.body}>
            {/* Account selector */}
            <div style={S.field}>
              <label style={S.label}>
                Account <span style={{ color: "#EF4444" }}>*</span>
              </label>
              {accounts.length === 0 ? (
                <div style={S.noAccountBox}>
                  ⚠ No accounts found. Create an account first using the +
                  button in the sidebar.
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
                      {acc.name} — {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Balance warning */}
            {willExceedBalance && (
              <div style={S.warnBox}>
                ⚠ This exceeds your {selectedAccount.name} balance of{" "}
                {formatCurrency(selectedAccount.balance)}
              </div>
            )}

            {/* Amount */}
            <div style={S.field}>
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

            {/* Description */}
            <div style={S.field}>
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

            {/* ── Category — dynamic from backend ── */}
            <div style={S.field}>
              <label style={S.label}>
                Category <span style={{ color: "#EF4444" }}>*</span>
                {catLoading && (
                  <span
                    style={{ color: "rgba(255,255,255,0.2)", marginLeft: 6 }}
                  >
                    loading…
                  </span>
                )}
              </label>
              <select
                required
                style={S.select}
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Select category…</option>
                {typeCategories.length > 0
                  ? typeCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name.charAt(0) + cat.name.slice(1).toLowerCase()}
                        {cat.custom ? " ★" : ""}
                      </option>
                    ))
                  : FALLBACK[formData.type].map((name) => (
                      <option key={name} value={name}>
                        {name.charAt(0) + name.slice(1).toLowerCase()}
                      </option>
                    ))}
              </select>
              {/* ★ = custom category indicator */}
              {typeCategories.some((c) => c.custom) && (
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                    marginTop: 4,
                  }}
                >
                  ★ = your custom category
                </div>
              )}
            </div>

            {/* ── Subcategory — shown when selected category has subcategories ── */}
            {subCategories.length > 0 && (
              <div style={S.field}>
                <label style={S.label}>Subcategory (optional)</label>
                {/* Quick pill selection */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  {subCategories.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          subCategory: formData.subCategory === sub ? "" : sub,
                        })
                      }
                      style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        background:
                          formData.subCategory === sub
                            ? accentColor + "22"
                            : "rgba(255,255,255,0.05)",
                        border:
                          formData.subCategory === sub
                            ? `1px solid ${accentColor}44`
                            : "1px solid rgba(255,255,255,0.1)",
                        color:
                          formData.subCategory === sub
                            ? accentColor
                            : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
                {/* Also allow typing a custom subcategory not in the list */}
                <input
                  type="text"
                  style={{ ...S.input, fontSize: 12 }}
                  placeholder="Or type a custom subcategory…"
                  value={formData.subCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, subCategory: e.target.value })
                  }
                />
              </div>
            )}

            {/* Division */}
            <div style={S.field}>
              <label style={S.label}>Division</label>
              <div style={S.divGrid}>
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

            {/* Date — native on mobile, DatePicker on desktop */}
            <div style={S.field}>
              <label style={S.label}>
                Date & Time <span style={{ color: "#EF4444" }}>*</span>
              </label>
              {isMobile ? (
                <input
                  type="datetime-local"
                  required
                  max={new Date().toISOString().slice(0, 16)}
                  value={
                    formData.date instanceof Date
                      ? formData.date.toISOString().slice(0, 16)
                      : formData.date
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, date: new Date(e.target.value) })
                  }
                  style={S.input}
                />
              ) : (
                <DatePicker
                  selected={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                  showTimeSelect
                  dateFormat="dd MMM yyyy, h:mm aa"
                  maxDate={new Date()}
                  wrapperClassName="date-picker-wrapper"
                  customInput={<input style={S.input} readOnly />}
                />
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={S.footer}>
            <button type="button" style={S.cancelBtn} onClick={handleClose}>
              Cancel
            </button>
            <button
              type="submit"
              style={S.submitBtn(
                accentColor,
                submitting || accounts.length === 0,
              )}
              disabled={submitting || accounts.length === 0}
            >
              {submitting ? "Saving…" : editTransaction ? "✓ Update" : "+ Add"}
            </button>
          </div>
        </form>

        {/* DatePicker dark theme override */}
        <style>{`
          .react-datepicker { background: #161D2A !important; border: 1px solid rgba(255,255,255,0.1) !important; }
          .react-datepicker__header { background: #0D1117 !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
          .react-datepicker__current-month, .react-datepicker__day-name, .react-datepicker-time__header { color: #E8EDF5 !important; }
          .react-datepicker__day { color: #E8EDF5 !important; }
          .react-datepicker__day:hover { background: rgba(99,179,255,0.15) !important; border-radius: 6px !important; }
          .react-datepicker__day--selected { background: #1E6FD9 !important; border-radius: 6px !important; }
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
    </div>
  );
}
