import React, { useState, useEffect, useMemo, useCallback } from "react";
import { categoryAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

// ─────────────────────────────────────────────────────────────────────────────
//  BudgetPage
//
//  How budgets work:
//    - Limits are stored in localStorage, keyed by category name + period key.
//    - "Monthly reset"  → key includes YYYY-MM  → expires automatically next month.
//    - "Fixed"          → key has no date       → persists until manually cleared.
//    - Spending is read from dashboardData.categorySummary (all-time) and scaled
//      to the selected period using the period summary totals.
// ─────────────────────────────────────────────────────────────────────────────

const CAT_ICONS = {
  FOOD: "🍔", FUEL: "⛽", TRIP: "✈️", MEDICAL: "🏥", MOVIE: "🎬",
  LOAN: "💳", SHOPPING: "🛍️", UTILITIES: "💡", RENT: "🏠",
  FITNESS: "💪", EDUCATION: "📚", OTHER: "📦", SALARY: "💰",
  FREELANCE: "💼", INVESTMENT: "📈", BUSINESS: "🏢", RENTAL: "🏘️",
};

const CAT_COLORS = [
  "#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6",
  "#EC4899","#14B8A6","#F97316","#6366F1","#84CC16",
];

// ── localStorage helpers ──────────────────────────────────────────────────
function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function storageKey(catName, fixed) {
  return fixed
    ? `mm_budget_fixed_${catName}`
    : `mm_budget_${monthKey()}_${catName}`;
}
function loadBudget(catName) {
  const fixed   = localStorage.getItem(storageKey(catName, true));
  const monthly = localStorage.getItem(storageKey(catName, false));
  if (fixed)   return { limit: parseFloat(fixed),   fixed: true  };
  if (monthly) return { limit: parseFloat(monthly), fixed: false };
  return { limit: 0, fixed: false };
}
function saveBudget(catName, limit, fixed) {
  localStorage.removeItem(storageKey(catName, true));
  localStorage.removeItem(storageKey(catName, false));
  if (limit > 0) localStorage.setItem(storageKey(catName, fixed), String(limit));
}

// ── Progress bar ──────────────────────────────────────────────────────────
function ProgressBar({ pct, color }) {
  const clamped = Math.min(pct, 100);
  const fill = pct >= 100 ? "#EF4444" : pct >= 80 ? "#F59E0B" : color;
  return (
    <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${clamped}%`,
        background: fill, borderRadius: 999,
        transition: "width 0.5s ease",
      }} />
    </div>
  );
}

// ── Single budget card ────────────────────────────────────────────────────
function BudgetCard({ cat, color, icon, spending, onSave, onClear }) {
  const [open,      setOpen]      = useState(false);
  const [inputVal,  setInputVal]  = useState("");
  const [isFixed,   setIsFixed]   = useState(false);
  const [saved,     setSaved]     = useState(false);

  const { limit, fixed } = loadBudget(cat);
  const spend = spending || 0;
  const pct   = limit > 0 ? Math.round((spend / limit) * 100) : 0;
  const rem   = limit - spend;

  const status = !limit ? "none"
    : pct >= 100 ? "over"
    : pct >= 80  ? "warn"
    : "ok";

  const statusLabel = { none: "No limit", over: "Over limit", warn: "Near limit", ok: "On track" }[status];
  const statusColor = { none: "rgba(255,255,255,0.2)", over: "#EF4444", warn: "#F59E0B", ok: "#10B981" }[status];
  const statusBg    = { none: "rgba(255,255,255,0.04)", over: "rgba(239,68,68,0.1)", warn: "rgba(245,158,11,0.1)", ok: "rgba(16,185,129,0.1)" }[status];

  function handleOpen() {
    setOpen(!open);
    setInputVal(limit > 0 ? String(limit) : "");
    setIsFixed(fixed);
  }

  function handleSave() {
    const val = parseFloat(inputVal);
    if (!val || val <= 0) return;
    saveBudget(cat, val, isFixed);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); onSave(); }, 800);
  }

  function handleClear() {
    saveBudget(cat, 0, false);
    setOpen(false);
    onClear();
  }

  return (
    <div style={{
      background: "#0D1117",
      border: `1px solid ${open ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
      borderLeft: `3px solid ${status === "none" ? color : statusColor}`,
      borderRadius: 14,
      padding: "16px 18px",
      transition: "border-color 0.15s",
    }}>
      {/* ── Top row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#F0F4FF" }}>
            {cat.charAt(0) + cat.slice(1).toLowerCase()}
          </div>
          {fixed && limit > 0 && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>Fixed — never resets</div>
          )}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 500,
          padding: "3px 10px", borderRadius: 20,
          background: statusBg, color: statusColor,
        }}>
          {statusLabel}
        </span>
      </div>

      {/* ── Progress ── */}
      {limit > 0 ? (
        <>
          <ProgressBar pct={pct} color={color} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            <span>{formatCurrency(spend)} spent</span>
            <span style={{ color: rem >= 0 ? "#10B981" : "#EF4444", fontWeight: 500 }}>
              {rem >= 0 ? `${formatCurrency(rem)} left` : `${formatCurrency(Math.abs(rem))} over`}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
            {pct}% of {formatCurrency(limit)}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 4 }}>
          {formatCurrency(spend)} spent · no limit set
        </div>
      )}

      {/* ── Edit toggle ── */}
      <button
        onClick={handleOpen}
        style={{
          marginTop: 12, background: "none", border: "none",
          color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer",
          padding: 0, textDecoration: "underline", fontFamily: "inherit",
        }}
      >
        {open ? "▲ Close" : limit > 0 ? "✎ Edit limit" : "+ Set limit"}
      </button>

      {/* ── Expanded editor ── */}
      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)" }}>

          {/* Amount input */}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            Monthly limit (₹)
          </div>
          <input
            type="number" min="1" value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            placeholder={limit > 0 ? `Current: ₹${limit}` : "e.g. 5000"}
            style={{
              width: "100%", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
              padding: "9px 12px", color: "#E8EDF5", fontSize: 13,
              outline: "none", boxSizing: "border-box", marginBottom: 10,
              fontFamily: "inherit",
            }}
          />

          {/* Reset type */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[
              { val: false, label: "🔄 Monthly reset", sub: "Clears on 1st of month" },
              { val: true,  label: "🔒 Fixed",          sub: "Rent, EMI — never resets" },
            ].map(opt => (
              <button
                key={String(opt.val)}
                onClick={() => setIsFixed(opt.val)}
                style={{
                  flex: 1, padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                  background: isFixed === opt.val ? "rgba(99,179,255,0.1)" : "rgba(255,255,255,0.04)",
                  border: isFixed === opt.val ? "1px solid rgba(99,179,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  color: isFixed === opt.val ? "#63B3FF" : "rgba(255,255,255,0.35)",
                  textAlign: "left", fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 500 }}>{opt.label}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{opt.sub}</div>
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1, padding: "9px", borderRadius: 8, cursor: "pointer",
                background: saved ? "rgba(16,185,129,0.15)" : `${color}18`,
                border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : color + "44"}`,
                color: saved ? "#10B981" : color,
                fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              {saved ? "✓ Saved!" : limit > 0 ? "Update" : "Set limit"}
            </button>
            {limit > 0 && (
              <button
                onClick={handleClear}
                style={{
                  padding: "9px 14px", borderRadius: 8, cursor: "pointer",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.3)", fontSize: 13, fontFamily: "inherit",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function BudgetPage({ dashboardData, transactions = [], showToast }) {
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [period,      setPeriod]      = useState("monthly");
  const [tick,        setTick]        = useState(0); // force re-render after save

  // ── fetchCategories stable reference so useEffect dep is satisfied ────────
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getByType("EXPENSE");
      setCategories(res.data);
    } catch {
      if (showToast) showToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Spending per category, scaled to period ─────────────────────────────
  // Wrapped in useMemo so the object reference is stable across renders,
  // preventing catSpending's dependency array from firing on every render.
  const catSummary = useMemo(
    () => dashboardData?.categorySummary || {},
    [dashboardData]
  );
  const allTimeTotal = useMemo(
    () => Object.values(catSummary).reduce((s, v) => s + v, 0),
    [catSummary]
  );

  const periodSpend = useMemo(() => {
    const raw = period === "weekly" ? dashboardData?.weeklySummary?.expenditure
              : period === "yearly" ? dashboardData?.yearlySummary?.expenditure
              : dashboardData?.monthlySummary?.expenditure;
    return raw || 0;
  }, [period, dashboardData]);

  const catSpending = useMemo(() => {
    if (allTimeTotal === 0) return catSummary;
    const ratio = periodSpend / allTimeTotal;
    const out = {};
    Object.entries(catSummary).forEach(([k, v]) => { out[k] = v * ratio; });
    return out;
  }, [catSummary, allTimeTotal, periodSpend]);

  // ── Summary across budgeted categories ─────────────────────────────────
  const summary = useMemo(() => {
    const periodDiv = period === "weekly" ? 4 : period === "yearly" ? 1 / 12 : 1;
    let budgeted = 0, spent = 0, over = 0, warn = 0;
    categories.forEach(cat => {
      const { limit } = loadBudget(cat.name);
      if (!limit) return;
      const scaledLimit = limit / periodDiv;
      const s = catSpending[cat.name] || 0;
      const pct = (s / scaledLimit) * 100;
      budgeted += scaledLimit;
      spent    += s;
      if (pct >= 100) over++;
      else if (pct >= 80) warn++;
    });
    return { budgeted, spent, remaining: Math.max(0, budgeted - spent), over, warn };
  }, [categories, catSpending, period, tick]); // eslint-disable-line

  const periodLabel = period === "weekly" ? "This week" : period === "yearly" ? "This year" : "This month";
  const periodDiv   = period === "weekly" ? 4 : period === "yearly" ? 1 / 12 : 1;

  const hasBudgets = categories.some(cat => loadBudget(cat.name).limit > 0);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: 28, height: 28, border: "2px solid rgba(99,179,255,0.15)", borderTopColor: "#63B3FF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="budget-page-wrap">

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#F0F4FF", margin: "0 0 4px", letterSpacing: "-0.4px" }}>
          Budget Goals
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Set spending limits per category. Click any card to set or edit its limit.
        </p>
      </div>

      {/* ── Period selector ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginRight: 4 }}>Viewing:</span>
        {[["monthly","This month"],["weekly","This week"],["yearly","This year"]].map(([k,l]) => (
          <button
            key={k}
            onClick={() => setPeriod(k)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
              background: period === k ? "rgba(99,179,255,0.15)" : "rgba(255,255,255,0.04)",
              border: period === k ? "1px solid rgba(99,179,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
              color: period === k ? "#63B3FF" : "rgba(255,255,255,0.4)",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Summary strip (only when budgets exist) ── */}
      {hasBudgets && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 10, marginBottom: 24,
        }}>
          {[
            { label: "Budgeted",  value: formatCurrency(summary.budgeted),   color: "#63B3FF" },
            { label: "Spent",     value: formatCurrency(summary.spent),       color: summary.spent > summary.budgeted ? "#EF4444" : "#F0F4FF" },
            { label: "Remaining", value: formatCurrency(summary.remaining),   color: "#10B981" },
            {
              label: "Status",
              value: summary.over > 0 ? `${summary.over} over` : summary.warn > 0 ? `${summary.warn} near` : "All OK ✓",
              color: summary.over > 0 ? "#EF4444" : summary.warn > 0 ? "#F59E0B" : "#10B981",
            },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "#0D1117", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                {label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color }}>{value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{periodLabel}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── No categories state ── */}
      {categories.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "#0D1117", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, color: "rgba(255,255,255,0.2)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📂</div>
          <p style={{ fontWeight: 500, marginBottom: 8, color: "rgba(255,255,255,0.4)" }}>No expense categories yet</p>
          <p style={{ fontSize: 13 }}>Go to the Categories page and add some first.</p>
        </div>
      ) : (
        <div className="budget-cards-grid">
          {categories.map((cat, i) => {
            const scaledSpend = (catSpending[cat.name] || 0) / periodDiv;
            const color = CAT_COLORS[i % CAT_COLORS.length];
            const icon  = CAT_ICONS[cat.name] || "📁";
            return (
              <BudgetCard
                key={cat.id}
                cat={cat.name}
                color={color}
                icon={icon}
                spending={scaledSpend}
                onSave={() => setTick(t => t + 1)}
                onClear={() => setTick(t => t + 1)}
              />
            );
          })}
        </div>
      )}

      {/* ── Footer note ── */}
      <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.12)" }}>
        Budget limits are saved on this device only and do not sync across devices.
      </div>

      <style>{`
        .budget-page-wrap {
          padding: 16px;
          min-height: 100vh;
          color: #E8EDF5;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
        }
        .budget-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 500px) {
          .budget-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .budget-page-wrap { padding: 36px 40px; }
          .budget-cards-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}