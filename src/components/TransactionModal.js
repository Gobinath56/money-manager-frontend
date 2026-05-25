import React, { useState, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { accountAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.72)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 500, backdropFilter: "blur(4px)",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "0 16px",
  },
  modal: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 18, width: "100%", maxWidth: 500,
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
    overflow: "hidden", maxHeight: "92vh", display: "flex", flexDirection: "column",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "#0D1117", flexShrink: 0,
  },
  title: { fontSize: 15, fontWeight: 600, color: "#F0F4FF", margin: 0 },
  closeBtn: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)", borderRadius: 8,
    width: 28, height: 28, cursor: "pointer", fontSize: 15,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  tabs: { display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 },
  tab: (active, color) => ({
    flex: 1, padding: "11px 0", border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 500,
    background: active ? color + "15" : "transparent",
    color: active ? color : "rgba(255,255,255,0.35)",
    borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
    transition: "all 0.15s",
  }),
  body: { padding: "16px 20px", overflowY: "auto", flex: 1 },
  field: { marginBottom: 13 },
  label: {
    display: "block", fontSize: 10, fontWeight: 600,
    color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
    letterSpacing: "0.08em", marginBottom: 6,
  },
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9,
    padding: "10px 13px", color: "#F0F4FF", fontSize: 14, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  },
  select: {
    width: "100%", background: "#161D2A",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9,
    padding: "10px 13px", color: "#F0F4FF", fontSize: 14, outline: "none",
    boxSizing: "border-box", cursor: "pointer",
  },
  divGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  divBtn: (active) => ({
    padding: "9px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 500,
    background: active ? "rgba(99,179,255,0.12)" : "rgba(255,255,255,0.04)",
    border: active ? "1px solid rgba(99,179,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
    color: active ? "#63B3FF" : "rgba(255,255,255,0.4)", transition: "all 0.15s",
  }),
  footer: {
    display: "flex", gap: 10, padding: "12px 20px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    background: "#0D1117", flexShrink: 0,
  },
  cancelBtn: {
    flex: 1, padding: "11px",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.55)", borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: "pointer",
  },
  submitBtn: (color, disabled) => ({
    flex: 1, padding: "11px",
    background: disabled ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${color}, ${color}BB)`,
    border: `1px solid ${disabled ? "rgba(255,255,255,0.1)" : color + "55"}`,
    color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
    borderRadius: 9, fontSize: 13, fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s",
  }),
  warnBox: {
    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#FCA5A5",
    marginBottom: 10, lineHeight: 1.5,
  },
  noAccBox: {
    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
    borderRadius: 9, padding: "10px 13px", fontSize: 12, color: "#F59E0B",
    marginBottom: 12, lineHeight: 1.5,
  },
  // ── Split transaction styles ──────────────────────────────────────────────
  splitCard: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: "12px 14px", marginBottom: 8,
  },
  splitRow: { display: "flex", gap: 8, alignItems: "flex-start" },
  splitInput: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, padding: "8px 10px", color: "#F0F4FF", fontSize: 13,
    outline: "none", transition: "border-color 0.2s",
  },
  splitDel: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
    color: "#EF4444", borderRadius: 7, padding: "0 10px", cursor: "pointer",
    fontSize: 16, flexShrink: 0, height: 36, display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  addSplitBtn: {
    width: "100%", padding: "8px", borderRadius: 8, cursor: "pointer",
    background: "rgba(99,179,255,0.07)", border: "1px dashed rgba(99,179,255,0.25)",
    color: "#63B3FF", fontSize: 12, fontWeight: 500, marginTop: 4,
  },
  splitTotal: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 12px", borderRadius: 8, marginTop: 6,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
    fontSize: 12,
  },
  // ── Category pill suggestions ─────────────────────────────────────────────
  pillWrap: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  pill: (active, color) => ({
    padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
    transition: "all 0.15s", background: active ? color + "22" : "rgba(255,255,255,0.05)",
    border: active ? `1px solid ${color}44` : "1px solid rgba(255,255,255,0.1)",
    color: active ? color : "rgba(255,255,255,0.5)",
  }),
  catInputRow: { display: "flex", gap: 8 },
  catInput: {
    flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9, padding: "9px 13px", color: "#F0F4FF", fontSize: 13,
    outline: "none", boxSizing: "border-box",
  },
};

// ── Suggested categories (free-form — no backend enum restriction) ──────────
const CAT_SUGGESTIONS = {
  INCOME: [
    { name: "Salary",     emoji: "💰" },
    { name: "Freelance",  emoji: "💼" },
    { name: "Investment", emoji: "📈" },
    { name: "Business",   emoji: "🏢" },
    { name: "Rental",     emoji: "🏘️" },
    { name: "Gift",       emoji: "🎁" },
    { name: "Other",      emoji: "➕" },
  ],
  EXPENSE: [
    { name: "Food",        emoji: "🍔" },
    { name: "Fuel",        emoji: "⛽" },
    { name: "Shopping",    emoji: "🛍️" },
    { name: "Transport",   emoji: "🚌" },
    { name: "Entertainment", emoji: "🎬" },
    { name: "Medical",     emoji: "🏥" },
    { name: "Education",   emoji: "📚" },
    { name: "Utilities",   emoji: "💡" },
    { name: "Rent",        emoji: "🏠" },
    { name: "Loan/EMI",    emoji: "💳" },
    { name: "Fitness",     emoji: "💪" },
    { name: "Travel",      emoji: "✈️" },
    { name: "Pets",        emoji: "🐾" },
    { name: "Bar",         emoji: "🍺" },
    { name: "Other",       emoji: "📦" },
  ],
};

// ── Default split item ─────────────────────────────────────────────────────
const newSplit = () => ({ id: Date.now() + Math.random(), category: "", amount: "" });

// ── Default form ───────────────────────────────────────────────────────────
const defaultForm = {
  type: "INCOME",
  totalAmount: "",
  description: "",
  category: "",
  division: "PERSONAL",
  date: new Date(),
  accountId: "",
  // splits: array of { id, category, amount } — used when isSplit=true
};

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  editTransaction,
  accounts = [],
}) {
  const [activeTab, setActiveTab]   = useState("income");
  const [formData, setFormData]     = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [isSplit, setIsSplit]       = useState(false);
  const [splits, setSplits]         = useState([newSplit(), newSplit()]);
  const [catInput, setCatInput]     = useState(""); // free-form category typed

  const isMobile    = window.innerWidth <= 768;
  const accentColor = activeTab === "income" ? "#10B981" : "#EF4444";
  const currentType = activeTab === "income" ? "INCOME" : "EXPENSE";
  const suggestions = CAT_SUGGESTIONS[currentType];

  // ── Split helpers ──────────────────────────────────────────────────────────
  const splitTotal = splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
  const splitMismatch = isSplit && formData.totalAmount &&
    Math.abs(splitTotal - parseFloat(formData.totalAmount)) > 0.01;

  const updateSplit = (id, field, value) =>
    setSplits(prev => prev.map(sp => sp.id === id ? { ...sp, [field]: value } : sp));

  const removeSplit = (id) =>
    setSplits(prev => prev.filter(sp => sp.id !== id));

  const addSplit = () => setSplits(prev => [...prev, newSplit()]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormData({ ...defaultForm, type: activeTab === "income" ? "INCOME" : "EXPENSE" });
    setIsSplit(false);
    setSplits([newSplit(), newSplit()]);
    setCatInput("");
  }, [activeTab]);

  // ── Pre-fill for edit ──────────────────────────────────────────────────────
  useEffect(() => {
    if (editTransaction) {
      setFormData({
        type:        editTransaction.type,
        totalAmount: editTransaction.amount,
        description: editTransaction.description,
        category:    editTransaction.category || "",
        division:    editTransaction.division,
        date:        new Date(editTransaction.date),
        accountId:   editTransaction.accountId || "",
      });
      setActiveTab(editTransaction.type === "INCOME" ? "income" : "expense");
      setCatInput(editTransaction.category || "");
      setIsSplit(false);
      setSplits([newSplit(), newSplit()]);
    } else {
      resetForm();
    }
  }, [editTransaction, isOpen, resetForm]);

  // ── Tab change resets category ─────────────────────────────────────────────
  useEffect(() => {
    if (!editTransaction) {
      setFormData(prev => ({
        ...prev,
        type: activeTab === "income" ? "INCOME" : "EXPENSE",
        category: "",
      }));
      setCatInput("");
      setSplits([newSplit(), newSplit()]);
    }
  }, [activeTab, editTransaction]);

  // ── Category selection ─────────────────────────────────────────────────────
  const selectCategory = (name) => {
    setFormData(prev => ({ ...prev, category: name }));
    setCatInput(name);
  };

  const handleCatInputChange = (val) => {
    setCatInput(val);
    setFormData(prev => ({ ...prev, category: val }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountId) { alert("Please select an account"); return; }
    if (!formData.category && !isSplit) { alert("Please enter a category"); return; }

    setSubmitting(true);
    try {
      if (isSplit) {
        // Validate splits
        const validSplits = splits.filter(sp => sp.category.trim() && parseFloat(sp.amount) > 0);
        if (validSplits.length < 2) { alert("Add at least 2 valid split items"); setSubmitting(false); return; }
        if (splitMismatch) {
          const ok = window.confirm(
            `Split total (₹${splitTotal.toFixed(2)}) doesn't match total amount (₹${parseFloat(formData.totalAmount).toFixed(2)}). Use split total?`
          );
          if (!ok) { setSubmitting(false); return; }
        }

        // Submit each split as a separate transaction
        // The description gets suffixed: "Groceries [Shopping]", "Petrol [Fuel]"
        const base = {
          type:      formData.type,
          division:  formData.division,
          date:      formData.date,
          accountId: formData.accountId,
        };

        for (const sp of validSplits) {
          const desc = formData.description
            ? `${formData.description} [${sp.category}]`
            : sp.category;
          await onSubmit({
            ...base,
            amount:      parseFloat(sp.amount),
            description: desc,
            category:    sp.category.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
            subCategory: sp.category,
          });
        }
      } else {
        // Normal single transaction
        await onSubmit({
          ...formData,
          amount:   parseFloat(formData.totalAmount),
          category: formData.category.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
          subCategory: formData.category,
        });
      }
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => { resetForm(); onClose(); };

  // ── Balance warning ────────────────────────────────────────────────────────
  const selectedAccount = accounts.find(a => a.id === formData.accountId);
  const checkAmt = isSplit ? splitTotal : parseFloat(formData.totalAmount) || 0;
  const willExceed = formData.type === "EXPENSE" && selectedAccount && checkAmt > selectedAccount.balance;

  if (!isOpen) return null;

  return (
    <div style={S.overlay} onClick={handleClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={S.header}>
          <h2 style={S.title}>{editTransaction ? "Edit Transaction" : "Add Transaction"}</h2>
          <button style={S.closeBtn} onClick={handleClose}>✕</button>
        </div>

        {/* ── Type tabs ── */}
        {!editTransaction && (
          <div style={S.tabs}>
            <button style={S.tab(activeTab === "income",  "#10B981")} onClick={() => setActiveTab("income")}>
              💰 Income
            </button>
            <button style={S.tab(activeTab === "expense", "#EF4444")} onClick={() => setActiveTab("expense")}>
              💸 Expense
            </button>
          </div>
        )}

        {/* ── Form body ── */}
        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div style={S.body}>

            {/* Account */}
            <div style={S.field}>
              <label style={S.label}>Account <span style={{ color: "#EF4444" }}>*</span></label>
              {accounts.length === 0 ? (
                <div style={S.noAccBox}>⚠ No accounts found. Create one in the sidebar first.</div>
              ) : (
                <select required style={S.select} value={formData.accountId}
                  onChange={e => setFormData({ ...formData, accountId: e.target.value })}>
                  <option value="">Select account…</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Balance warning */}
            {willExceed && (
              <div style={S.warnBox}>
                ⚠ This exceeds your {selectedAccount.name} balance of {formatCurrency(selectedAccount.balance)}
              </div>
            )}

            {/* Total amount */}
            <div style={S.field}>
              <label style={S.label}>
                {isSplit ? "Total Amount (₹)" : "Amount (₹)"}{" "}
                <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>₹</span>
                <input
                  type="number" step="0.01" min="0.01" required
                  value={formData.totalAmount}
                  onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                  style={{ ...S.input, paddingLeft: 28 }}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description */}
            <div style={S.field}>
              <label style={S.label}>Description <span style={{ color: "#EF4444" }}>*</span></label>
              <input type="text" required value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={S.input} placeholder="What was this for?" />
            </div>

            {/* ── Split toggle ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setIsSplit(!isSplit)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                  fontSize: 12, fontWeight: 500, transition: "all 0.15s",
                  background: isSplit ? `${accentColor}18` : "rgba(255,255,255,0.05)",
                  border: isSplit ? `1px solid ${accentColor}44` : "1px solid rgba(255,255,255,0.1)",
                  color: isSplit ? accentColor : "rgba(255,255,255,0.5)",
                }}
              >
                <span style={{ fontSize: 14 }}>⊕</span>
                {isSplit ? "Split ON" : "Split transaction"}
              </button>
              {isSplit && (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  Break into multiple categories
                </span>
              )}
            </div>

            {/* ════════════════════════════════════════
                SPLIT MODE — multiple category rows
            ════════════════════════════════════════ */}
            {isSplit ? (
              <div style={S.field}>
                <label style={S.label}>Split by category</label>

                {splits.map((sp, idx) => (
                  <div key={sp.id} style={S.splitCard}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                      Item {idx + 1}
                    </div>
                    <div style={S.splitRow}>
                      {/* Category input with suggestions */}
                      <div style={{ flex: 1 }}>
                        <input
                          style={{ ...S.splitInput, width: "100%", boxSizing: "border-box", marginBottom: 6 }}
                          placeholder="Category (e.g. Food, Petrol)"
                          value={sp.category}
                          onChange={e => updateSplit(sp.id, "category", e.target.value)}
                        />
                        {/* Quick suggestion pills for this split item */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {suggestions.slice(0, 8).map(s => (
                            <button
                              key={s.name} type="button"
                              style={{
                                padding: "2px 8px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                                background: sp.category === s.name ? accentColor + "22" : "rgba(255,255,255,0.04)",
                                border: sp.category === s.name ? `1px solid ${accentColor}44` : "1px solid rgba(255,255,255,0.08)",
                                color: sp.category === s.name ? accentColor : "rgba(255,255,255,0.4)",
                              }}
                              onClick={() => updateSplit(sp.id, "category", s.name)}
                            >
                              {s.emoji} {s.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount for this split */}
                      <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginLeft: 8 }}>
                        <input
                          type="number" step="0.01" min="0"
                          style={{ ...S.splitInput, width: 90 }}
                          placeholder="₹0"
                          value={sp.amount}
                          onChange={e => updateSplit(sp.id, "amount", e.target.value)}
                        />
                        {splits.length > 2 && (
                          <button type="button" style={S.splitDel} onClick={() => removeSplit(sp.id)}>×</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add split row */}
                <button type="button" style={S.addSplitBtn} onClick={addSplit}>
                  + Add another split
                </button>

                {/* Split total vs entered total */}
                <div style={S.splitTotal}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Split total</span>
                  <span style={{ fontWeight: 600, color: splitMismatch ? "#F59E0B" : "#10B981" }}>
                    {formatCurrency(splitTotal)}
                    {splitMismatch && (
                      <span style={{ fontSize: 10, marginLeft: 6, color: "#F59E0B" }}>
                        ≠ ₹{parseFloat(formData.totalAmount || 0).toFixed(2)} entered
                      </span>
                    )}
                  </span>
                </div>
              </div>

            ) : (
              /* ════════════════════════════════════════
                 SINGLE MODE — one category
              ════════════════════════════════════════ */
              <div style={S.field}>
                <label style={S.label}>Category <span style={{ color: "#EF4444" }}>*</span></label>

                {/* Suggestion pills */}
                <div style={S.pillWrap}>
                  {suggestions.map(s => (
                    <button
                      key={s.name} type="button"
                      style={S.pill(formData.category === s.name, accentColor)}
                      onClick={() => selectCategory(s.name)}
                    >
                      {s.emoji} {s.name}
                    </button>
                  ))}
                </div>

                {/* Free-form input */}
                <div style={S.catInputRow}>
                  <input
                    style={S.catInput}
                    placeholder="Or type any custom category…"
                    value={catInput}
                    onChange={e => handleCatInputChange(e.target.value)}
                  />
                </div>
                {catInput && !suggestions.find(s => s.name === catInput) && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 5 }}>
                    Custom: "{catInput}" will be saved as a new category
                  </div>
                )}
              </div>
            )}

            {/* Division */}
            <div style={S.field}>
              <label style={S.label}>Division</label>
              <div style={S.divGrid}>
                {["PERSONAL", "OFFICE"].map(div => (
                  <button key={div} type="button"
                    style={S.divBtn(formData.division === div)}
                    onClick={() => setFormData({ ...formData, division: div })}>
                    {div === "PERSONAL" ? "👤 Personal" : "🏢 Office"}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div style={S.field}>
              <label style={S.label}>Date & Time <span style={{ color: "#EF4444" }}>*</span></label>
              {isMobile ? (
                <input type="datetime-local" required
                  max={new Date().toISOString().slice(0, 16)}
                  value={formData.date instanceof Date ? formData.date.toISOString().slice(0, 16) : formData.date}
                  onChange={e => setFormData({ ...formData, date: new Date(e.target.value) })}
                  style={S.input} />
              ) : (
                <DatePicker
                  selected={formData.date}
                  onChange={date => setFormData({ ...formData, date })}
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
            <button type="button" style={S.cancelBtn} onClick={handleClose}>Cancel</button>
            <button
              type="submit"
              style={S.submitBtn(accentColor, submitting || accounts.length === 0)}
              disabled={submitting || accounts.length === 0}
            >
              {submitting
                ? "Saving…"
                : isSplit
                  ? `+ Add ${splits.filter(s => s.category && s.amount).length} transactions`
                  : editTransaction ? "✓ Update" : "+ Add"}
            </button>
          </div>
        </form>

        {/* DatePicker dark theme */}
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