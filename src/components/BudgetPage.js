import React, { useState, useEffect, useMemo } from "react";
import { categoryAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

// ─────────────────────────────────────────────────────────────────────────────
//  HOW THIS BUDGET PAGE WORKS
//
//  Each category has its own reset setting:
//    "monthly"  → limit key includes YYYY-MM, auto-expires next month
//    "never"    → limit key has no date, persists forever until manually cleared
//
//  Spending comes from dashboardData.categorySummary (all-time totals) which
//  gets scaled by a ratio to estimate monthly/weekly spending.
//
//  Features included:
//    ✓ Per-category reset choice (Monthly auto-reset or Keep forever)
//    ✓ Warning badge at 80%, Over badge at 100%
//    ✓ Period view toggle — Monthly / Weekly / Yearly
//    ✓ Spending history sparkline (last 6 months, derived from transactions)
//    ✓ Summary bar with alert counts
//    ✓ "How it works" explainer
// ─────────────────────────────────────────────────────────────────────────────

const CAT_META = {
  FOOD:      { icon: "🍔", color: "#F97316" },
  FUEL:      { icon: "⛽", color: "#F59E0B" },
  MOVIE:     { icon: "🎬", color: "#8B5CF6" },
  LOAN:      { icon: "💳", color: "#EF4444" },
  MEDICAL:   { icon: "🏥", color: "#EC4899" },
  OTHER:     { icon: "📦", color: "#6B7280" },
  TRIP:      { icon: "✈️", color: "#14B8A6" },
  SHOPPING:  { icon: "🛍️", color: "#F43F5E" },
  EDUCATION: { icon: "📚", color: "#3B82F6" },
  UTILITIES: { icon: "💡", color: "#FBBF24" },
  RENT:      { icon: "🏠", color: "#6366F1" },
  FITNESS:   { icon: "💪", color: "#10B981" },
  TRANSPORT: { icon: "🚌", color: "#06B6D4" },
  PETS:      { icon: "🐾", color: "#A855F7" },
  BAR:       { icon: "🍺", color: "#84CC16" },
};
const COLOR_PALETTE = [
  "#F97316","#F59E0B","#8B5CF6","#EF4444","#EC4899",
  "#6B7280","#14B8A6","#F43F5E","#3B82F6","#6366F1",
  "#10B981","#06B6D4","#A855F7","#84CC16","#FB923C",
];

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Storage helpers ──────────────────────────────────────────────────────────
// Each category stores: { limit, resetType }
// resetType = "monthly" | "never"
// For "monthly", the key includes YYYY-MM so it naturally expires next month.
// For "never", the key has no date — persists across months.

function getLimitKey(catKey, resetType) {
  if (resetType === "never") return `mm_budget_never_${catKey}`;
  const now = new Date();
  return `mm_budget_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}_${catKey}`;
}

function loadCatBudget(catKey) {
  // Try to find any stored budget for this category (either reset type)
  const monthly = localStorage.getItem(getLimitKey(catKey, "monthly"));
  const never   = localStorage.getItem(getLimitKey(catKey, "never"));
  if (monthly) return { limit: parseFloat(monthly), resetType: "monthly" };
  if (never)   return { limit: parseFloat(never),   resetType: "never"   };
  return { limit: 0, resetType: "monthly" }; // default: monthly reset
}

function saveCatBudget(catKey, limit, resetType) {
  // Remove whichever key type we're NOT using (clean up old entries)
  const monthKey = getLimitKey(catKey, "monthly");
  const neverKey = getLimitKey(catKey, "never");
  if (resetType === "monthly") {
    localStorage.setItem(monthKey, String(limit));
    localStorage.removeItem(neverKey);
  } else {
    localStorage.setItem(neverKey, String(limit));
    localStorage.removeItem(monthKey);
  }
}

function clearCatBudget(catKey) {
  localStorage.removeItem(getLimitKey(catKey, "monthly"));
  localStorage.removeItem(getLimitKey(catKey, "never"));
}

// ── Sparkline SVG — last 6 months spending for one category ─────────────────
function Sparkline({ data, color, limit }) {
  if (!data || data.every(v => v === 0)) {
    return <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", paddingTop: 4 }}>No history yet</div>;
  }
  const W = 120, H = 36, pad = 4;
  const max = Math.max(...data, limit || 1, 1);
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v / max) * (H - pad * 2));
    return `${x},${y}`;
  }).join(" ");
  const limitY = limit ? H - pad - ((limit / max) * (H - pad * 2)) : null;

  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      {/* Limit line */}
      {limitY !== null && (
        <line x1={pad} y1={limitY} x2={W - pad} y2={limitY}
          stroke="rgba(245,158,11,0.4)" strokeWidth={1} strokeDasharray="3,3" />
      )}
      {/* Sparkline */}
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
      {/* Dots */}
      {data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (W - pad * 2);
        const y = H - pad - ((v / max) * (H - pad * 2));
        return <circle key={i} cx={x} cy={y} r={2.5} fill={color} opacity={v > 0 ? 1 : 0} />;
      })}
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function BudgetPage({ dashboardData, transactions = [], showToast }) {

  const [categories,  setCategories]  = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [period,      setPeriod]      = useState("monthly");

  // budgetState: { [catKey]: { limit, resetType } }
  const [budgetState, setBudgetState] = useState({});

  // per-card draft inputs: { [catKey]: { amount, resetType } }
  const [drafts, setDrafts] = useState({});

  // flash saved: { [catKey]: true }
  const [savedFlash, setSavedFlash] = useState({});

  // which card is expanded (shows sparkline + reset picker)
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchCategories(); }, []); // eslint-disable-line

  const fetchCategories = async () => {
    setLoadingCats(true);
    try {
      const res = await categoryAPI.getByType("EXPENSE");
      const cats = res.data;
      setCategories(cats);
      // Load saved budgets for each category
      const state = {};
      cats.forEach(c => { state[c.name] = loadCatBudget(c.name); });
      setBudgetState(state);
    } catch {
      if (showToast) showToast("Failed to load categories", "error");
    } finally {
      setLoadingCats(false);
    }
  };

  // ── Enrich categories ───────────────────────────────────────────────────
  const enriched = useMemo(() =>
    categories.map((cat, i) => {
      const meta = CAT_META[cat.name] || {};
      return {
        key:      cat.name,
        color:    meta.color || COLOR_PALETTE[i % COLOR_PALETTE.length],
        icon:     meta.icon  || "📁",
        isCustom: cat.custom,
      };
    }),
  [categories]);

  // ── Per-period spending (scaled from all-time categorySummary) ──────────
  const rawCatSummary = useMemo(() => {
  return dashboardData?.categorySummary || {};
}, [dashboardData]);
  const allTimeTotal   = Object.values(rawCatSummary).reduce((s, v) => s + v, 0);

  const periodExpense = useMemo(() => {
    if (period === "weekly")  return dashboardData?.weeklySummary?.expenditure  || 0;
    if (period === "yearly")  return dashboardData?.yearlySummary?.expenditure  || 0;
    return dashboardData?.monthlySummary?.expenditure || 0;
  }, [period, dashboardData]);

  const catSpending = useMemo(() => {
    if (allTimeTotal === 0) return rawCatSummary;
    const ratio = periodExpense / allTimeTotal;
    const scaled = {};
    Object.entries(rawCatSummary).forEach(([k, v]) => { scaled[k] = v * ratio; });
    return scaled;
  }, [rawCatSummary, allTimeTotal, periodExpense]);

  // Limit divisor: limits entered as monthly, scaled for other periods
  const limitDivisor = period === "weekly" ? 4 : period === "yearly" ? (1/12) : 1;

  // ── Last 6 months spending per category (from transactions array) ───────
  const sparklineData = useMemo(() => {
    const now    = new Date();
    const result = {};
    enriched.forEach(({ key }) => {
      const months = Array(6).fill(0);
      transactions.forEach(t => {
        if (t.type !== "EXPENSE" || t.category !== key) return;
        const d    = new Date(t.date);
        const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (diff >= 0 && diff < 6) months[5 - diff] += t.amount;
      });
      result[key] = months;
    });
    return result;
  }, [enriched, transactions]);

  // ── Month labels for sparkline ──────────────────────────────────────────
  const sparkMonths = useMemo(() => {
    const now = new Date();
    return Array(6).fill(0).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return MONTHS_SHORT[d.getMonth()];
    });
  }, []);

  // ── Save a budget ───────────────────────────────────────────────────────
  const saveBudget = (catKey) => {
    const draft = drafts[catKey] || {};
    const val   = parseFloat(draft.amount);
    if (isNaN(val) || val <= 0) { if (showToast) showToast("Enter a valid amount", "error"); return; }
    const resetType = draft.resetType || budgetState[catKey]?.resetType || "monthly";

    saveCatBudget(catKey, val, resetType);
    setBudgetState(prev => ({ ...prev, [catKey]: { limit: val, resetType } }));
    setDrafts(prev => ({ ...prev, [catKey]: {} }));
    setSavedFlash(prev => ({ ...prev, [catKey]: true }));
    setTimeout(() => setSavedFlash(prev => ({ ...prev, [catKey]: false })), 2000);
  };

  const clearBudget = (catKey) => {
    clearCatBudget(catKey);
    setBudgetState(prev => ({ ...prev, [catKey]: { limit: 0, resetType: "monthly" } }));
  };

  // ── Summary totals ──────────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    let totalLimit = 0, totalSpent = 0, overCount = 0, warnCount = 0;
    enriched.forEach(({ key }) => {
      const { limit: monthlyLimit } = budgetState[key] || {};
      if (!monthlyLimit) return;
      const limit = monthlyLimit / limitDivisor;
      const spent = catSpending[key] || 0;
      const pct   = spent / limit * 100;
      totalLimit += limit;
      totalSpent += spent;
      if (pct >= 100) overCount++;
      else if (pct >= 80) warnCount++;
    });
    return { totalLimit, totalSpent, overCount, warnCount };
  }, [enriched, budgetState, catSpending, limitDivisor]);

  const now        = new Date();
  const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const periodLabel = period === "weekly" ? "This week" : period === "yearly" ? `${now.getFullYear()}` : monthLabel;

  // ── Styles ──────────────────────────────────────────────────────────────
  const S = {
    page:  { padding: "16px", minHeight: "100vh", color: "#E8EDF5" },

    explainer: {
      background: "rgba(99,179,255,0.07)", border: "1px solid rgba(99,179,255,0.15)",
      borderRadius: 12, padding: "14px 18px", marginBottom: 20,
      fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.8,
    },

    periodRow: { display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap", alignItems: "center" },
    periodBtn: (active) => ({
      padding: "7px 14px", borderRadius: 20, cursor: "pointer",
      fontSize: 12, fontWeight: 500, transition: "all 0.15s",
      background: active ? "rgba(99,179,255,0.15)" : "rgba(255,255,255,0.04)",
      border: active ? "1px solid rgba(99,179,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
      color: active ? "#63B3FF" : "rgba(255,255,255,0.35)",
    }),

    summaryCard: {
      background: "#0D1117", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "16px 20px", marginBottom: 20,
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12,
    },
    summaryItem: { },
    summaryLabel: { fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 },
    summaryVal: (col) => ({ fontSize: 18, fontWeight: 600, color: col }),

    card: (borderColor) => ({
      background: "#0D1117", border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `3px solid ${borderColor}`, borderRadius: 14, padding: "18px 20px",
    }),
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    catName: { fontSize: 14, fontWeight: 500, color: "#F0F4FF", display: "flex", alignItems: "center", gap: 7 },

    badge: (state) => {
      const map = {
        over:    ["rgba(239,68,68,0.15)",  "#EF4444", "rgba(239,68,68,0.3)"],
        warn:    ["rgba(245,158,11,0.15)", "#F59E0B", "rgba(245,158,11,0.3)"],
        ok:      ["rgba(16,185,129,0.15)", "#10B981", "rgba(16,185,129,0.3)"],
        nolimit: ["rgba(255,255,255,0.05)","rgba(255,255,255,0.25)","rgba(255,255,255,0.1)"],
      };
      const [bg, col, border] = map[state] || map.nolimit;
      return { fontSize: 10, fontWeight: 500, padding: "3px 9px", borderRadius: 20, background: bg, color: col, border: `1px solid ${border}` };
    },

    track: { height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 999, margin: "8px 0", overflow: "hidden" },
    fill:  (pct, col) => ({
      height: "100%", borderRadius: 999, width: `${Math.min(pct, 100)}%`,
      background: pct >= 100 ? "#EF4444" : pct >= 80 ? "#F59E0B" : col,
      transition: "width 0.6s ease",
    }),

    detailRow: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 5, marginBottom: 12 },

    expandBtn: {
      background: "none", border: "none", color: "rgba(255,255,255,0.3)",
      cursor: "pointer", fontSize: 11, padding: "0", marginTop: 4, textDecoration: "underline",
    },

    expandSection: {
      marginTop: 14, paddingTop: 14,
      borderTop: "1px solid rgba(255,255,255,0.06)",
    },

    sectionLabel: { fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 },

    input: {
      width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8, padding: "9px 12px", color: "#E8EDF5", fontSize: 13, outline: "none",
      boxSizing: "border-box",
    },

    resetToggle: { display: "flex", gap: 6, marginTop: 8, marginBottom: 10 },
    resetBtn: (active) => ({
      flex: 1, padding: "7px", borderRadius: 8, cursor: "pointer",
      fontSize: 11, fontWeight: 500, textAlign: "center", transition: "all 0.15s",
      background: active ? "rgba(99,179,255,0.12)" : "rgba(255,255,255,0.04)",
      border: active ? "1px solid rgba(99,179,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
      color: active ? "#63B3FF" : "rgba(255,255,255,0.35)",
    }),

    saveBtn: (col, isSaved) => ({
      width: "100%", padding: "8px", borderRadius: 8, cursor: "pointer",
      fontSize: 12, fontWeight: 500, transition: "all 0.2s",
      background: isSaved ? "rgba(16,185,129,0.15)" : col + "18",
      border: `1px solid ${isSaved ? "rgba(16,185,129,0.3)" : col + "44"}`,
      color: isSaved ? "#10B981" : col,
    }),

    clearBtn: {
      width: "100%", marginTop: 6, padding: "6px", borderRadius: 8, cursor: "pointer",
      fontSize: 11, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      color: "rgba(255,255,255,0.25)",
    },

    sparkRow: { display: "flex", justifyContent: "space-between", marginBottom: 2 },
    sparkMonthLabels: { display: "flex", justifyContent: "space-between", marginTop: 3 },
  };

  if (loadingCats) return (
    <div style={S.page}>
      <div style={{ width: 28, height: 28, border: "2px solid rgba(99,179,255,0.15)", borderTopColor: "#63B3FF", borderRadius: "50%", margin: "60px auto", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#F0F4FF", margin: "0 0 4px", letterSpacing: "-0.4px" }}>Budget Goals</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>
          Set spending limits per category — each category can reset monthly or stay fixed
        </p>
      </div>

      {/* ── How it works ── */}
      <div style={S.explainer}>
        <span style={{ color: "#63B3FF", fontWeight: 500 }}>How it works: </span>
        Click any category card to set a limit. Choose <strong style={{ color: "rgba(255,255,255,0.6)" }}>Monthly reset</strong> and the limit automatically clears on the 1st of next month (great for groceries, fuel, eating out). Choose <strong style={{ color: "rgba(255,255,255,0.6)" }}>Keep forever</strong> for fixed costs like rent or loan EMIs that don't change. The progress bar fills as you spend — yellow at 80%, red when over.
      </div>

      {/* ── Period toggle ── */}
      <div style={S.periodRow}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginRight: 2 }}>View spending:</span>
        {[["monthly","This month"],["weekly","This week"],["yearly","This year"]].map(([k,l]) => (
          <button key={k} style={S.periodBtn(period === k)} onClick={() => setPeriod(k)}>{l}</button>
        ))}
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>{periodLabel}</span>
      </div>

      {/* ── Summary bar ── */}
      {summaryStats.totalLimit > 0 && (
        <div style={S.summaryCard}>
          <div style={S.summaryItem}>
            <div style={S.summaryLabel}>Budgeted</div>
            <div style={S.summaryVal("#63B3FF")}>{formatCurrency(summaryStats.totalLimit)}</div>
          </div>
          <div style={S.summaryItem}>
            <div style={S.summaryLabel}>Spent</div>
            <div style={S.summaryVal(summaryStats.totalSpent > summaryStats.totalLimit ? "#EF4444" : "#F0F4FF")}>
              {formatCurrency(summaryStats.totalSpent)}
            </div>
          </div>
          <div style={S.summaryItem}>
            <div style={S.summaryLabel}>Remaining</div>
            <div style={S.summaryVal(summaryStats.totalLimit - summaryStats.totalSpent >= 0 ? "#10B981" : "#EF4444")}>
              {formatCurrency(Math.max(summaryStats.totalLimit - summaryStats.totalSpent, 0))}
            </div>
          </div>
          <div style={S.summaryItem}>
            <div style={S.summaryLabel}>Status</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 2 }}>
              {summaryStats.overCount > 0 && (
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, width: "fit-content", background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                  {summaryStats.overCount} over budget
                </span>
              )}
              {summaryStats.warnCount > 0 && (
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, width: "fit-content", background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                  {summaryStats.warnCount} near limit
                </span>
              )}
              {summaryStats.overCount === 0 && summaryStats.warnCount === 0 && (
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, width: "fit-content", background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}>
                  All on track ✓
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── No categories ── */}
      {enriched.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.2)" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📂</div>
          <p style={{ fontWeight: 500, marginBottom: 8 }}>No expense categories yet</p>
          <p style={{ fontSize: 12 }}>Go to Categories page and add some first</p>
        </div>
      ) : (
        <div className="budget-grid">
          {enriched.map(({ key, color, icon, isCustom }) => {
            const saved     = budgetState[key] || { limit: 0, resetType: "monthly" };
            const limit     = saved.limit > 0 ? saved.limit / limitDivisor : 0;
            const spent     = catSpending[key] || 0;
            const pct       = limit > 0 ? (spent / limit) * 100 : 0;
            const remaining = limit - spent;
            const state     = !limit ? "nolimit" : pct >= 100 ? "over" : pct >= 80 ? "warn" : "ok";
            const isOpen    = expanded === key;

            const draftAmt  = drafts[key]?.amount ?? "";
            const draftReset = drafts[key]?.resetType ?? saved.resetType;

            const sparkline   = sparklineData[key] || Array(6).fill(0);
            const sparkLimit  = saved.limit || 0;

            const borderColor = state === "over" ? "#EF4444" : state === "warn" ? "#F59E0B" : color;

            return (
              <div key={key} style={S.card(borderColor)}>

                {/* ── Card top row ── */}
                <div style={S.cardTop}>
                  <div style={S.catName}>
                    <span style={{ fontSize: 17 }}>{icon}</span>
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                    {isCustom && (
                      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, background: "rgba(99,179,255,0.1)", color: "#63B3FF", border: "1px solid rgba(99,179,255,0.2)" }}>Custom</span>
                    )}
                  </div>
                  <span style={S.badge(state)}>
                    {state === "over" ? "Over budget" : state === "warn" ? "Near limit" : state === "ok" ? "On track" : "No limit"}
                  </span>
                </div>

                {/* ── Progress bar ── */}
                {limit > 0 ? (
                  <>
                    <div style={S.track}><div style={S.fill(pct, color)} /></div>
                    <div style={S.detailRow}>
                      <span>{formatCurrency(spent)} spent</span>
                      <span>{Math.round(pct)}% of {formatCurrency(limit)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: remaining >= 0 ? "#10B981" : "#EF4444", marginBottom: 8 }}>
                      {remaining >= 0
                        ? `${formatCurrency(remaining)} remaining`
                        : `${formatCurrency(Math.abs(remaining))} over`}
                    </div>
                    {/* Reset type label */}
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginBottom: 6 }}>
                      {saved.resetType === "never" ? "🔒 Fixed — never resets" : `🔄 Resets monthly · ${monthLabel}`}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginBottom: 10 }}>
                    {formatCurrency(spent)} spent · Tap below to set a limit
                  </div>
                )}

                {/* ── Expand / collapse toggle ── */}
                <button style={S.expandBtn} onClick={() => setExpanded(isOpen ? null : key)}>
                  {isOpen ? "▲ Close" : (saved.limit > 0 ? "✎ Edit limit" : "＋ Set limit")}
                </button>

                {/* ── Expanded section ── */}
                {isOpen && (
                  <div style={S.expandSection}>

                    {/* Sparkline — last 6 months */}
                    {sparkline.some(v => v > 0) && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={S.sectionLabel}>Last 6 months spending</div>
                        <div style={S.sparkRow}>
                          <Sparkline data={sparkline} color={color} limit={sparkLimit} />
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "right", paddingLeft: 8, lineHeight: 1.7 }}>
                            {sparkline.map((v, i) => (
                              <div key={i}>{sparkMonths[i]}: {formatCurrency(v)}</div>
                            ))}
                          </div>
                        </div>
                        {sparkLimit > 0 && (
                          <div style={{ fontSize: 10, color: "rgba(245,158,11,0.6)", marginTop: 4 }}>
                            — dashed line = your monthly limit
                          </div>
                        )}
                      </div>
                    )}

                    {/* Amount input */}
                    <div style={S.sectionLabel}>Monthly limit (₹)</div>
                    <input
                      type="number" min="1" step="1"
                      style={S.input}
                      placeholder={saved.limit > 0 ? `Current: ₹${saved.limit}` : "Enter amount…"}
                      value={draftAmt}
                      onChange={e => setDrafts(prev => ({ ...prev, [key]: { ...prev[key], amount: e.target.value } }))}
                      onKeyDown={e => e.key === "Enter" && saveBudget(key)}
                    />

                    {/* Reset type picker */}
                    <div style={S.sectionLabel}>Reset type</div>
                    <div style={S.resetToggle}>
                      <button
                        style={S.resetBtn(draftReset === "monthly")}
                        onClick={() => setDrafts(prev => ({ ...prev, [key]: { ...prev[key], resetType: "monthly" } }))}
                      >
                        🔄 Monthly reset<br />
                        <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>Clears on 1st of month</span>
                      </button>
                      <button
                        style={S.resetBtn(draftReset === "never")}
                        onClick={() => setDrafts(prev => ({ ...prev, [key]: { ...prev[key], resetType: "never" } }))}
                      >
                        🔒 Keep forever<br />
                        <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>Fixed cost (rent, EMI)</span>
                      </button>
                    </div>

                    {/* Save + Clear buttons */}
                    <button style={S.saveBtn(color, savedFlash[key])} onClick={() => saveBudget(key)}>
                      {savedFlash[key] ? "✓ Saved!" : saved.limit > 0 ? "Update limit" : "Set limit"}
                    </button>
                    {saved.limit > 0 && (
                      <button style={S.clearBtn} onClick={() => { clearBudget(key); setExpanded(null); }}>
                        Remove limit
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 28, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.12)", lineHeight: 1.8 }}>
        Limits saved on this device only
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}