import React, { useState, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { categoryAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

// =============================================================================
//  TransactionModal
//
//  SPLIT MODE (redesigned):
//    Old: each split item had its own category picker → confusing, wrong
//    New: ONE shared category at the top (e.g. SHOPPING), then each item
//         is just a name + amount (e.g. Shoes ₹500, Dress ₹300).
//         All items are saved with the same category, itemName as subCategory.
//
//  Layout of split mode:
//    [Category]   → pick once from user's categories (pills from API)
//    [Sub]        → optional subcategory (e.g. Clothes under Shopping)
//    ─────────────────────────────────────
//    Item 1:  [Shoes]          [₹500]  [×]
//    Item 2:  [Dress]          [₹300]  [×]
//    + Add item
//    ─────────────────────────────────────
//    Split total: ₹800
// =============================================================================

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
    overflow: "hidden", maxHeight: "92vh",
    display: "flex", flexDirection: "column",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "#0D1117", flexShrink: 0,
  },
  title: { fontSize: 15, fontWeight: 600, color: "#F0F4FF", margin: 0 },
  closeBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)", borderRadius: 8,
    width: 28, height: 28, cursor: "pointer", fontSize: 15,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    flexShrink: 0,
  },
  tab: (active, color) => ({
    flex: 1, padding: "11px 0", border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 500,
    background: active ? color + "15" : "transparent",
    color: active ? color : "rgba(255,255,255,0.35)",
    borderBottom: active ? "2px solid " + color : "2px solid transparent",
    transition: "all 0.15s", fontFamily: "inherit",
  }),
  body: { padding: "16px 20px", overflowY: "auto", flex: 1 },
  field: { marginBottom: 14 },
  label: {
    display: "block", fontSize: 10, fontWeight: 600,
    color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
    letterSpacing: "0.08em", marginBottom: 6,
  },
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9,
    padding: "10px 13px", color: "#F0F4FF", fontSize: 14,
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s", fontFamily: "inherit",
  },
  select: {
    width: "100%", background: "#161D2A",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9,
    padding: "10px 13px", color: "#F0F4FF", fontSize: 14,
    outline: "none", boxSizing: "border-box", cursor: "pointer",
    fontFamily: "inherit",
  },
  divGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  divBtn: (active) => ({
    padding: "9px", borderRadius: 9, cursor: "pointer",
    fontSize: 13, fontWeight: 500, fontFamily: "inherit",
    background: active ? "rgba(99,179,255,0.12)" : "rgba(255,255,255,0.04)",
    border: active ? "1px solid rgba(99,179,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
    color: active ? "#63B3FF" : "rgba(255,255,255,0.4)",
    transition: "all 0.15s",
  }),
  footer: {
    display: "flex", gap: 10, padding: "12px 20px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    background: "#0D1117", flexShrink: 0,
  },
  cancelBtn: {
    flex: 1, padding: "11px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.55)", borderRadius: 9,
    fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
  },
  submitBtn: (color, disabled) => ({
    flex: 1, padding: "11px",
    background: disabled
      ? "rgba(255,255,255,0.05)"
      : "linear-gradient(135deg, " + color + ", " + color + "BB)",
    border: "1px solid " + (disabled ? "rgba(255,255,255,0.1)" : color + "55"),
    color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
    borderRadius: 9, fontSize: 13, fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s", fontFamily: "inherit",
  }),
  warnBox: {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 8, padding: "8px 12px",
    fontSize: 12, color: "#FCA5A5", marginBottom: 10, lineHeight: 1.5,
  },
  noAccBox: {
    background: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.2)",
    borderRadius: 9, padding: "10px 13px",
    fontSize: 12, color: "#F59E0B", marginBottom: 12, lineHeight: 1.5,
  },
  pillWrap: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  pill: (active, color) => ({
    padding: "5px 13px", borderRadius: 20, fontSize: 12,
    cursor: "pointer", transition: "all 0.15s",
    background: active ? color + "22" : "rgba(255,255,255,0.05)",
    border: active ? "1px solid " + color + "44" : "1px solid rgba(255,255,255,0.1)",
    color: active ? color : "rgba(255,255,255,0.5)",
    fontFamily: "inherit",
  }),
  spinner: {
    width: 14, height: 14,
    border: "2px solid rgba(99,179,255,0.15)",
    borderTopColor: "#63B3FF", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block", verticalAlign: "middle", marginRight: 6,
  },
  // Split item row styles
  splitSection: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12, padding: "14px 16px", marginTop: 12,
  },
  splitItemRow: {
    display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
  },
  splitItemInput: {
    flex: 1, background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
    padding: "9px 11px", color: "#F0F4FF", fontSize: 13,
    outline: "none", fontFamily: "inherit",
    transition: "border-color 0.2s",
  },
  splitAmtInput: {
    width: 100, background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
    padding: "9px 11px", color: "#F0F4FF", fontSize: 13,
    outline: "none", fontFamily: "inherit", flexShrink: 0,
  },
  splitDelBtn: {
    background: "none", border: "none",
    color: "rgba(239,68,68,0.45)", cursor: "pointer",
    fontSize: 18, lineHeight: 1, padding: "0 2px",
    fontFamily: "inherit", flexShrink: 0,
    transition: "color 0.15s",
  },
  addItemBtn: {
    width: "100%", padding: "8px", borderRadius: 8, cursor: "pointer",
    background: "rgba(99,179,255,0.06)",
    border: "1px dashed rgba(99,179,255,0.2)",
    color: "#63B3FF", fontSize: 12, fontWeight: 500, marginTop: 4,
    fontFamily: "inherit",
  },
  splitTotalRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: 12, paddingTop: 10,
    borderTop: "1px solid rgba(255,255,255,0.07)",
    fontSize: 13,
  },
};

// Each split item is just a name + amount. Category is shared at the top.
const newItem = () => ({ id: Date.now() + Math.random(), itemName: "", amount: "" });

const defaultForm = {
  type: "INCOME",
  totalAmount: "",
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
  const [activeTab,      setActiveTab]      = useState("income");
  const [formData,       setFormData]       = useState(defaultForm);
  const [submitting,     setSubmitting]     = useState(false);
  const [userCategories, setUserCategories] = useState([]);
  const [catLoading,     setCatLoading]     = useState(false);

  // Split state
  const [isSplit,     setIsSplit]     = useState(false);
  // splitCategory: the ONE shared category for all split items
  const [splitCat,    setSplitCat]    = useState("");
  const [splitSub,    setSplitSub]    = useState("");
  const [splitItems,  setSplitItems]  = useState([newItem(), newItem()]);

  const isMobile    = window.innerWidth <= 768;
  const currentType = activeTab === "income" ? "INCOME" : "EXPENSE";
  const accentColor = activeTab === "income" ? "#10B981" : "#EF4444";

  // Category selected in single mode
  const selectedCat  = userCategories.find(c => c.name === formData.category);
  const availableSubs = selectedCat?.subCategories || [];

  // Category selected in split mode (for showing its subs)
  const splitCatObj   = userCategories.find(c => c.name === splitCat);
  const splitCatSubs  = splitCatObj?.subCategories || [];

  // Split totals
  const splitTotal    = splitItems.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const splitMismatch = isSplit && formData.totalAmount &&
    Math.abs(splitTotal - parseFloat(formData.totalAmount)) > 0.01;

  // Fetch categories on open / type change
  const fetchCategories = useCallback(async (type) => {
    setCatLoading(true);
    try {
      const res = await categoryAPI.getByType(type);
      setUserCategories(res.data || []);
    } catch {
      setUserCategories([]);
    } finally {
      setCatLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchCategories(currentType);
  }, [isOpen, currentType, fetchCategories]);

  // Pre-fill when editing
  useEffect(() => {
    if (!isOpen) return;
    if (editTransaction) {
      setFormData({
        type:        editTransaction.type,
        totalAmount: editTransaction.amount,
        description: editTransaction.description,
        category:    editTransaction.category || "",
        subCategory: editTransaction.subCategory || "",
        division:    editTransaction.division,
        date:        new Date(editTransaction.date),
        accountId:   editTransaction.accountId || "",
      });
      setActiveTab(editTransaction.type === "INCOME" ? "income" : "expense");
      setIsSplit(false);
      setSplitCat("");
      setSplitSub("");
      setSplitItems([newItem(), newItem()]);
    } else {
      resetForm();
    }
  }, [editTransaction, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset category when switching type tab
  useEffect(() => {
    if (!editTransaction) {
      setFormData(prev => ({ ...prev, type: currentType, category: "", subCategory: "" }));
      setSplitCat("");
      setSplitSub("");
      setSplitItems([newItem(), newItem()]);
    }
  }, [activeTab, editTransaction, currentType]);

  function resetForm() {
    setFormData({ ...defaultForm, type: currentType });
    setIsSplit(false);
    setSplitCat("");
    setSplitSub("");
    setSplitItems([newItem(), newItem()]);
  }

  const updateItem   = (id, field, val) =>
    setSplitItems(prev => prev.map(it => it.id === id ? { ...it, [field]: val } : it));
  const removeItem   = (id) =>
    setSplitItems(prev => prev.filter(it => it.id !== id));

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accountId) { alert("Please select an account"); return; }

    setSubmitting(true);
    try {
      if (isSplit) {
        // Validate
        if (!splitCat) { alert("Please select a category for the split"); setSubmitting(false); return; }
        const validItems = splitItems.filter(it => it.itemName.trim() && parseFloat(it.amount) > 0);
        if (validItems.length < 1) { alert("Add at least 1 item with a name and amount"); setSubmitting(false); return; }
        if (splitMismatch) {
          const ok = window.confirm(
            "Split total (Rs." + splitTotal.toFixed(2) + ") does not match total amount (Rs." + parseFloat(formData.totalAmount).toFixed(2) + "). Continue with split total?"
          );
          if (!ok) { setSubmitting(false); return; }
        }

        // Each item becomes one transaction:
        //   description = "Grocery [Dress]" or just "Dress"
        //   category    = SHOPPING (shared)
        //   subCategory = Dress (the item name becomes the sub)
        const base = {
          type:      formData.type,
          division:  formData.division,
          date:      formData.date,
          accountId: formData.accountId,
          category:  splitCat.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
        };
        for (const item of validItems) {
          const desc = formData.description
            ? formData.description + " [" + item.itemName + "]"
            : item.itemName;
          await onSubmit({
            ...base,
            amount:      parseFloat(item.amount),
            description: desc,
            subCategory: splitSub || item.itemName,
          });
        }
      } else {
        if (!formData.category) { alert("Please select a category"); setSubmitting(false); return; }
        await onSubmit({
          ...formData,
          amount:   parseFloat(formData.totalAmount),
          category: formData.category.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
        });
      }
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => { resetForm(); onClose(); };

  const selectedAccount = accounts.find(a => a.id === formData.accountId);
  const checkAmt = isSplit ? splitTotal : parseFloat(formData.totalAmount) || 0;
  const willExceed = formData.type === "EXPENSE" && selectedAccount && checkAmt > selectedAccount.balance;

  if (!isOpen) return null;

  return (
    <div style={S.overlay} onClick={handleClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={S.header}>
          <h2 style={S.title}>{editTransaction ? "Edit Transaction" : "Add Transaction"}</h2>
          <button style={S.closeBtn} onClick={handleClose}>x</button>
        </div>

        {/* Type tabs */}
        {!editTransaction && (
          <div style={S.tabs}>
            <button style={S.tab(activeTab === "income", "#10B981")} onClick={() => setActiveTab("income")}>
              Income
            </button>
            <button style={S.tab(activeTab === "expense", "#EF4444")} onClick={() => setActiveTab("expense")}>
              Expense
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div style={S.body}>

            {/* Account */}
            <div style={S.field}>
              <label style={S.label}>Account *</label>
              {accounts.length === 0 ? (
                <div style={S.noAccBox}>No accounts found. Create one in the sidebar first.</div>
              ) : (
                <select required style={S.select} value={formData.accountId}
                  onChange={e => setFormData({ ...formData, accountId: e.target.value })}>
                  <option value="">Select account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Balance warning */}
            {willExceed && (
              <div style={S.warnBox}>
                This exceeds your {selectedAccount.name} balance of {formatCurrency(selectedAccount.balance)}
              </div>
            )}

            {/* Amount */}
            <div style={S.field}>
              <label style={S.label}>
                {isSplit ? "Total Amount (Rs.) *" : "Amount (Rs.) *"}
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                  Rs.
                </span>
                <input
                  type="number" step="0.01" min="0.01" required
                  value={formData.totalAmount}
                  onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                  style={{ ...S.input, paddingLeft: 38 }}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description */}
            <div style={S.field}>
              <label style={S.label}>Description *</label>
              <input
                type="text" required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={S.input}
                placeholder="What was this for?"
              />
            </div>

            {/* Split toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setIsSplit(!isSplit)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                  fontSize: 12, fontWeight: 500, transition: "all 0.15s", fontFamily: "inherit",
                  background: isSplit ? accentColor + "18" : "rgba(255,255,255,0.05)",
                  border: isSplit ? "1px solid " + accentColor + "44" : "1px solid rgba(255,255,255,0.1)",
                  color: isSplit ? accentColor : "rgba(255,255,255,0.5)",
                }}
              >
                {isSplit ? "Split ON" : "Split transaction"}
              </button>
              {isSplit && (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  One category, multiple items
                </span>
              )}
            </div>

            {/* ══════════════════════════════════════════════
                SPLIT MODE
                Step 1: pick ONE category (shared for all items)
                Step 2: optional subcategory
                Step 3: add item rows (name + amount each)
            ══════════════════════════════════════════════ */}
            {isSplit ? (
              <div style={S.field}>

                {/* Step 1: shared category */}
                <label style={S.label}>Category * (shared for all items)</label>
                {catLoading ? (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>
                    <span style={S.spinner} />
                    Loading categories...
                  </div>
                ) : userCategories.length === 0 ? (
                  <div style={S.noAccBox}>
                    No categories found. Go to the Categories page to add some first.
                  </div>
                ) : (
                  <div style={S.pillWrap}>
                    {userCategories.map(cat => (
                      <button
                        key={cat.id} type="button"
                        style={S.pill(splitCat === cat.name, accentColor)}
                        onClick={() => { setSplitCat(cat.name); setSplitSub(""); }}
                      >
                        {cat.name.charAt(0) + cat.name.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 2: subcategory (optional, only if category has subs) */}
                {splitCat && splitCatSubs.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ ...S.label, marginTop: 4 }}>
                      Subcategory (optional)
                    </label>
                    <div style={S.pillWrap}>
                      {splitCatSubs.map(sub => (
                        <button
                          key={sub} type="button"
                          style={S.pill(splitSub === sub, accentColor)}
                          onClick={() => setSplitSub(prev => prev === sub ? "" : sub)}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                    {splitSub && (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                        Subcategory: <span style={{ color: accentColor }}>{splitSub}</span>
                        <button
                          type="button"
                          onClick={() => setSplitSub("")}
                          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 11, marginLeft: 6, fontFamily: "inherit" }}
                        >
                          clear
                        </button>
                      </span>
                    )}
                  </div>
                )}

                {/* Step 3: item rows */}
                {splitCat && (
                  <div style={S.splitSection}>
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Item name
                      </div>
                      <div style={{ width: 100, fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                        Amount
                      </div>
                      <div style={{ width: 24, flexShrink: 0 }} />
                    </div>

                    {splitItems.map((item, idx) => (
                      <div key={item.id} style={S.splitItemRow}>
                        <input
                          style={S.splitItemInput}
                          placeholder={"Item " + (idx + 1) + " (e.g. Shoes)"}
                          value={item.itemName}
                          onChange={e => updateItem(item.id, "itemName", e.target.value)}
                        />
                        <input
                          type="number" step="0.01" min="0"
                          style={S.splitAmtInput}
                          placeholder="0.00"
                          value={item.amount}
                          onChange={e => updateItem(item.id, "amount", e.target.value)}
                        />
                        {splitItems.length > 1 && (
                          <button
                            type="button"
                            style={S.splitDelBtn}
                            onClick={() => removeItem(item.id)}
                            onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgba(239,68,68,0.45)"}
                          >
                            x
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      style={S.addItemBtn}
                      onClick={() => setSplitItems(prev => [...prev, newItem()])}
                    >
                      + Add item
                    </button>

                    {/* Split total */}
                    <div style={S.splitTotalRow}>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>
                        {splitItems.filter(it => it.itemName && it.amount).length} items
                      </span>
                      <span style={{ fontWeight: 600, color: splitMismatch ? "#F59E0B" : "#10B981" }}>
                        {formatCurrency(splitTotal)}
                        {splitMismatch && (
                          <span style={{ fontSize: 11, marginLeft: 8, color: "#F59E0B" }}>
                            entered: {formatCurrency(parseFloat(formData.totalAmount || 0))}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Prompt to pick category first */}
                {!splitCat && !catLoading && userCategories.length > 0 && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>
                    Pick a category above to start adding items
                  </div>
                )}
              </div>

            ) : (
              /* ══════════════════════════════════════════════
                 SINGLE MODE
              ══════════════════════════════════════════════ */
              <>
                {/* Category */}
                <div style={S.field}>
                  <label style={S.label}>Category *</label>
                  {catLoading ? (
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", padding: "8px 0" }}>
                      <span style={S.spinner} /> Loading your categories...
                    </div>
                  ) : userCategories.length === 0 ? (
                    <div style={S.noAccBox}>
                      No {currentType.toLowerCase()} categories found. Go to the Categories page to add some first.
                    </div>
                  ) : (
                    <div style={S.pillWrap}>
                      {userCategories.map(cat => (
                        <button
                          key={cat.id} type="button"
                          style={S.pill(formData.category === cat.name, accentColor)}
                          onClick={() => setFormData(prev => ({ ...prev, category: cat.name, subCategory: "" }))}
                        >
                          {cat.name.charAt(0) + cat.name.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.category && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                      Selected: <span style={{ color: accentColor, fontWeight: 500 }}>
                        {formData.category.charAt(0) + formData.category.slice(1).toLowerCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Subcategory — only when selected category has subs */}
                {availableSubs.length > 0 && (
                  <div style={S.field}>
                    <label style={S.label}>Subcategory (optional)</label>
                    <div style={S.pillWrap}>
                      {availableSubs.map(sub => (
                        <button
                          key={sub} type="button"
                          style={S.pill(formData.subCategory === sub, accentColor)}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            subCategory: prev.subCategory === sub ? "" : sub,
                          }))}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                    {formData.subCategory && (
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                        Subcategory: <span style={{ color: accentColor, fontWeight: 500 }}>{formData.subCategory}</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, subCategory: "" }))}
                          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 12, marginLeft: 6, fontFamily: "inherit" }}
                        >
                          clear
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Division */}
            <div style={S.field}>
              <label style={S.label}>Division</label>
              <div style={S.divGrid}>
                {["PERSONAL", "OFFICE"].map(div => (
                  <button key={div} type="button"
                    style={S.divBtn(formData.division === div)}
                    onClick={() => setFormData({ ...formData, division: div })}>
                    {div === "PERSONAL" ? "Personal" : "Office"}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div style={S.field}>
              <label style={S.label}>Date and Time *</label>
              {isMobile ? (
                <input
                  type="datetime-local" required
                  max={new Date().toISOString().slice(0, 16)}
                  value={formData.date instanceof Date ? formData.date.toISOString().slice(0, 16) : formData.date}
                  onChange={e => setFormData({ ...formData, date: new Date(e.target.value) })}
                  style={S.input}
                />
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

          {/* Footer */}
          <div style={S.footer}>
            <button type="button" style={S.cancelBtn} onClick={handleClose}>Cancel</button>
            <button
              type="submit"
              style={S.submitBtn(accentColor, submitting || accounts.length === 0)}
              disabled={submitting || accounts.length === 0}
            >
              {submitting
                ? "Saving..."
                : isSplit
                  ? "+ Add " + splitItems.filter(it => it.itemName && it.amount).length + " items"
                  : editTransaction ? "Update" : "+ Add"}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
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