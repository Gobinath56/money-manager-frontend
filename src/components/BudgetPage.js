import React, { useState, useEffect, useMemo } from "react";
import { categoryAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

// ── Budget limits stored in localStorage ──────────────────────────────────
// Key: "mm_budgets"  Value: { FOOD: 5000, FUEL: 2000, ... }
const STORAGE_KEY = "mm_budgets";

// ── Fallback colour palette for categories that have no fixed colour ───────
// Cycles through this list when a category isn't in the hardcoded map.
const COLOR_PALETTE = [
  "#F97316", "#F59E0B", "#8B5CF6", "#EF4444", "#EC4899",
  "#6B7280", "#10B981", "#3B82F6", "#6366F1", "#14B8A6",
  "#F43F5E", "#84CC16", "#F59E0B", "#A855F7", "#06B6D4",
];

// ── Known icon + colour map for built-in categories ───────────────────────
const CAT_META = {
  FOOD:       { icon: "🍔", color: "#F97316" },
  FUEL:       { icon: "⛽", color: "#F59E0B" },
  MOVIE:      { icon: "🎬", color: "#8B5CF6" },
  LOAN:       { icon: "💳", color: "#EF4444" },
  MEDICAL:    { icon: "🏥", color: "#EC4899" },
  OTHER:      { icon: "📦", color: "#6B7280" },
  TRIP:       { icon: "✈️", color: "#14B8A6" },
  SHOPPING:   { icon: "🛍️", color: "#F43F5E" },
  EDUCATION:  { icon: "📚", color: "#3B82F6" },
  UTILITIES:  { icon: "💡", color: "#F59E0B" },
  RENT:       { icon: "🏠", color: "#6366F1" },
  FITNESS:    { icon: "💪", color: "#10B981" },
  TRANSPORT:  { icon: "🚌", color: "#06B6D4" },
  PETS:       { icon: "🐾", color: "#A855F7" },
  BAR:        { icon: "🍺", color: "#84CC16" },
};

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  page:  { padding: "36px 40px", minHeight: "100vh", color: "#E8EDF5" },
  title: { fontSize: 26, fontWeight: 600, color: "#F0F4FF", margin: "0 0 4px", letterSpacing: "-0.5px" },
  sub:   { fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 32 },

  summaryCard: {
    background: "#0D1117", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "20px 28px", marginBottom: 24,
    display: "flex", gap: 40, flexWrap: "wrap",
  },
  summaryLabel: { fontSize: 10, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 },
  summaryVal: (col) => ({ fontSize: 22, fontWeight: 600, color: col }),

  card: {
    background: "#0D1117", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "22px 24px",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  catName: { fontSize: 15, fontWeight: 500, color: "#F0F4FF", display: "flex", alignItems: "center", gap: 8 },

  statusBadge: (pct) => ({
    fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
    background: pct >= 100 ? "rgba(239,68,68,0.15)" : pct >= 80 ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
    color:      pct >= 100 ? "#EF4444"               : pct >= 80 ? "#F59E0B"               : "#10B981",
    border: `1px solid ${pct >= 100 ? "rgba(239,68,68,0.3)" : pct >= 80 ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`,
  }),

  track: { height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999, marginBottom: 10, overflow: "hidden" },
  fill:  (pct, color) => ({
    height: "100%", borderRadius: 999,
    width: `${Math.min(pct, 100)}%`,
    background: pct >= 100 ? "#EF4444" : pct >= 80 ? "#F59E0B" : color,
    transition: "width 0.6s ease",
  }),

  amountRow:  { display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.38)", marginBottom: 12 },
  inputLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 },
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, padding: "9px 12px", color: "#E8EDF5", fontSize: 13, outline: "none",
    boxSizing: "border-box",
  },
  saveBtn: (color, saved) => ({
    marginTop: 8, width: "100%",
    background: saved ? "rgba(16,185,129,0.15)" : color + "18",
    border:     `1px solid ${saved ? "rgba(16,185,129,0.3)" : color + "44"}`,
    color:      saved ? "#10B981" : color,
    borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 500,
    cursor: "pointer", transition: "all 0.2s",
  }),

  // ── loading / empty states ──
  spinner: {
    width: 28, height: 28,
    border: "2px solid rgba(99,179,255,0.15)", borderTopColor: "#63B3FF",
    borderRadius: "50%", margin: "60px auto",
    animation: "spin 0.8s linear infinite",
  },
  empty: {
    textAlign: "center", padding: "60px 20px",
    color: "rgba(255,255,255,0.2)", fontSize: 14,
  },
};

export default function BudgetPage({ dashboardData, showToast }) {

  // ── categories fetched from backend ──────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // ── budget limits from localStorage ──────────────────────────────────────
  const [budgets, setBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  });

  // ── per-card draft input value before saving ──────────────────────────────
  const [drafts, setDrafts] = useState({});

  // ── { [catKey]: true } for 2s after saving — shows "Saved!" ──────────────
  const [saved, setSaved] = useState({});

  // ── fetch EXPENSE categories from API on mount ────────────────────────────
  useEffect(() => {
    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCategories = async () => {
    setLoadingCats(true);
    try {
      // getByType returns only EXPENSE categories — budget tracking is expense-only
      const res = await categoryAPI.getByType("EXPENSE");
      setCategories(res.data);
    } catch (err) {
      // fallback: if API fails show nothing rather than crash
      if (showToast) showToast("Failed to load categories", "error");
      setCategories([]);
    } finally {
      setLoadingCats(false);
    }
  };

  // ── build enriched category list with colour + icon ───────────────────────
  // Merges API data with the local meta map, falls back to palette for unknowns
  const enrichedCategories = useMemo(() => {
    return categories.map((cat, i) => {
      const meta = CAT_META[cat.name] || {};
      return {
        key:   cat.name,
        color: meta.color || COLOR_PALETTE[i % COLOR_PALETTE.length],
        icon:  meta.icon  || "📁",
        isCustom: cat.custom,
      };
    });
  }, [categories]);

  // ── current spending per category from dashboardData ─────────────────────
  const catSpending = dashboardData?.categorySummary || {};

  // ── save a budget limit ───────────────────────────────────────────────────
  const saveBudget = (catKey) => {
    const val = parseFloat(drafts[catKey]);
    if (isNaN(val) || val <= 0) return;
    const updated = { ...budgets, [catKey]: val };
    setBudgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaved(s => ({ ...s, [catKey]: true }));
    setTimeout(() => setSaved(s => ({ ...s, [catKey]: false })), 2000);
  };

  // ── summary totals ─────────────────────────────────────────────────────────
  const totalBudgeted = Object.values(budgets).reduce((a, b) => a + b, 0);
  const totalSpent    = enrichedCategories.reduce((sum, c) => sum + (catSpending[c.key] || 0), 0);
  const overBudgetCount = enrichedCategories.filter(
    c => budgets[c.key] && (catSpending[c.key] || 0) > budgets[c.key]
  ).length;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <h1 style={S.title}>Budget Goals</h1>
      <p style={S.sub}>Set monthly spending limits per category and track progress</p>

      {/* ── Summary bar — only shown after at least one budget is set ── */}
      {totalBudgeted > 0 && (
        <div style={S.summaryCard}>
          <div>
            <div style={S.summaryLabel}>Total budgeted</div>
            <div style={S.summaryVal("#63B3FF")}>{formatCurrency(totalBudgeted)}</div>
          </div>
          <div>
            <div style={S.summaryLabel}>Total spent</div>
            <div style={S.summaryVal(totalSpent > totalBudgeted ? "#EF4444" : "#10B981")}>
              {formatCurrency(totalSpent)}
            </div>
          </div>
          <div>
            <div style={S.summaryLabel}>Remaining</div>
            <div style={S.summaryVal(totalBudgeted - totalSpent >= 0 ? "#10B981" : "#EF4444")}>
              {formatCurrency(Math.max(totalBudgeted - totalSpent, 0))}
            </div>
          </div>
          {overBudgetCount > 0 && (
            <div>
              <div style={S.summaryLabel}>Over budget</div>
              <div style={S.summaryVal("#EF4444")}>
                {overBudgetCount} categor{overBudgetCount === 1 ? "y" : "ies"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Loading state ── */}
      {loadingCats ? (
        <>
          <div style={S.spinner} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      ) : enrichedCategories.length === 0 ? (
        /* ── Empty state — no expense categories yet ── */
        <div style={S.empty}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📂</div>
          <p style={{ fontWeight: 500, marginBottom: 8 }}>No expense categories yet</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            Go to the Categories page and add some expense categories first
          </p>
        </div>
      ) : (
        /* ── Category cards grid ── */
        <div className="budget-grid">
          {enrichedCategories.map(({ key, color, icon, isCustom }) => {
            const spent     = catSpending[key] || 0;
            const limit     = budgets[key]     || 0;
            const pct       = limit > 0 ? (spent / limit) * 100 : 0;
            const remaining = limit - spent;

            return (
              <div key={key} style={S.card}>

                {/* ── Card header ── */}
                <div style={S.cardTop}>
                  <div style={S.catName}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                    {isCustom && (
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "rgba(99,179,255,0.12)", color: "#63B3FF", border: "1px solid rgba(99,179,255,0.2)" }}>
                        Custom
                      </span>
                    )}
                  </div>
                  {limit > 0 && (
                    <span style={S.statusBadge(pct)}>
                      {pct >= 100 ? "Over" : pct >= 80 ? "Warning" : "On track"}
                    </span>
                  )}
                </div>

                {/* ── Progress bar ── */}
                {limit > 0 ? (
                  <>
                    <div style={S.track}>
                      <div style={S.fill(pct, color)} />
                    </div>
                    <div style={S.amountRow}>
                      <span>{formatCurrency(spent)} spent</span>
                      <span>{pct.toFixed(0)}% of {formatCurrency(limit)}</span>
                    </div>
                    {remaining >= 0 ? (
                      <div style={{ fontSize: 12, color: "#10B981", marginBottom: 12 }}>
                        ✓ {formatCurrency(remaining)} remaining
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 12 }}>
                        ✕ {formatCurrency(Math.abs(remaining))} over budget
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginBottom: 14 }}>
                    {formatCurrency(spent)} spent · No limit set yet
                  </div>
                )}

                {/* ── Set / update limit input ── */}
                <div style={S.inputLabel}>Monthly limit (₹)</div>
                <input
                  type="number"
                  style={S.input}
                  placeholder={limit > 0 ? String(limit) : "Enter amount…"}
                  value={drafts[key] || ""}
                  onChange={e => setDrafts(d => ({ ...d, [key]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && saveBudget(key)}
                  min="0"
                />
                <button style={S.saveBtn(color, saved[key])} onClick={() => saveBudget(key)}>
                  {saved[key] ? "✓ Saved!" : limit > 0 ? "Update limit" : "Set limit"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}