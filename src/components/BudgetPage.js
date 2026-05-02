import React, { useState } from "react";
import { formatCurrency } from "../utils/helpers";

// Budget limits are stored in localStorage — no backend needed.
// Key: "mm_budgets"
// Value: JSON object { FOOD: 5000, FUEL: 2000, ... }
const STORAGE_KEY = "mm_budgets";

const CATEGORIES = [
  { key: "FOOD", color: "#F97316", icon: "🍔" },
  { key: "FUEL", color: "#F59E0B", icon: "⛽" },
  { key: "MOVIE", color: "#8B5CF6", icon: "🎬" },
  { key: "LOAN", color: "#EF4444", icon: "💳" },
  { key: "MEDICAL", color: "#EC4899", icon: "🏥" },
  { key: "OTHER", color: "#6B7280", icon: "📦" },
];

const S = {
  page: { padding: "36px 40px", minHeight: "100vh", color: "#E8EDF5" },
  title: {
    fontSize: 26,
    fontWeight: 600,
    color: "#F0F4FF",
    margin: "0 0 4px",
    letterSpacing: "-0.5px",
  },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 32 },
  summaryCard: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "20px 28px",
    marginBottom: 24,
    display: "flex",
    gap: 40,
    flexWrap: "wrap",
  },
  summaryLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.28)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 6,
  },
  summaryVal: (col) => ({ fontSize: 22, fontWeight: 600, color: col }),
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "22px 24px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  catName: {
    fontSize: 15,
    fontWeight: 500,
    color: "#F0F4FF",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: (pct) => ({
    fontSize: 11,
    fontWeight: 500,
    padding: "3px 10px",
    borderRadius: 20,
    background:
      pct >= 100
        ? "rgba(239,68,68,0.15)"
        : pct >= 80
          ? "rgba(245,158,11,0.15)"
          : "rgba(16,185,129,0.15)",
    color: pct >= 100 ? "#EF4444" : pct >= 80 ? "#F59E0B" : "#10B981",
    border: `1px solid ${pct >= 100 ? "rgba(239,68,68,0.3)" : pct >= 80 ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`,
  }),
  track: {
    height: 6,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    marginBottom: 10,
    overflow: "hidden",
  },
  fill: (pct, color) => ({
    height: "100%",
    borderRadius: 999,
    width: `${Math.min(pct, 100)}%`,
    background: pct >= 100 ? "#EF4444" : pct >= 80 ? "#F59E0B" : color,
    transition: "width 0.6s ease",
  }),
  amountRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "rgba(255,255,255,0.38)",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "9px 12px",
    color: "#E8EDF5",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  saveBtn: (color, saved) => ({
    marginTop: 8,
    width: "100%",
    background: saved ? "rgba(16,185,129,0.15)" : color + "18",
    border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : color + "44"}`,
    color: saved ? "#10B981" : color,
    borderRadius: 8,
    padding: "8px",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  }),
};

export default function BudgetPage({ dashboardData }) {
  // Load saved budgets from localStorage on mount
  const [budgets, setBudgets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  });
  // Tracks the input value for each category before saving
  const [drafts, setDrafts] = useState({});
  // { [cat]: true } for 2s after saving — shows "Saved!" feedback
  const [saved, setSaved] = useState({});

  const catSpending = dashboardData?.categorySummary || {};

  const saveBudget = (cat) => {
    const val = parseFloat(drafts[cat]);
    if (isNaN(val) || val <= 0) return;
    const updated = { ...budgets, [cat]: val };
    setBudgets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaved((s) => ({ ...s, [cat]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [cat]: false })), 2000);
  };

  // ── Summary totals ──────────────────────────────────────────────────────────
  const totalBudgeted = Object.values(budgets).reduce((a, b) => a + b, 0);
  const totalSpent = CATEGORIES.reduce(
    (sum, c) => sum + (catSpending[c.key] || 0),
    0,
  );
  const overBudgetCount = CATEGORIES.filter(
    (c) => budgets[c.key] && (catSpending[c.key] || 0) > budgets[c.key],
  ).length;

  return (
    <div style={S.page}>
      <h1 style={S.title}>Budget Goals</h1>
      <p style={S.sub}>
        Set monthly spending limits per category and track progress
      </p>

      {/* ── Summary bar — only shown after at least one budget is set ── */}
      {totalBudgeted > 0 && (
        <div style={S.summaryCard}>
          <div>
            <div style={S.summaryLabel}>Total budgeted</div>
            <div style={S.summaryVal("#63B3FF")}>
              {formatCurrency(totalBudgeted)}
            </div>
          </div>
          <div>
            <div style={S.summaryLabel}>Total spent</div>
            <div
              style={S.summaryVal(
                totalSpent > totalBudgeted ? "#EF4444" : "#10B981",
              )}
            >
              {formatCurrency(totalSpent)}
            </div>
          </div>
          <div>
            <div style={S.summaryLabel}>Remaining</div>
            <div
              style={S.summaryVal(
                totalBudgeted - totalSpent >= 0 ? "#10B981" : "#EF4444",
              )}
            >
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

      {/* ── Category cards ── */}
      <div style={S.grid}>
        {CATEGORIES.map(({ key, color, icon }) => {
          const spent = catSpending[key] || 0;
          const limit = budgets[key] || 0;
          const pct = limit > 0 ? (spent / limit) * 100 : 0;
          const remaining = limit - spent;

          return (
            <div key={key} style={S.card}>
              {/* Card header */}
              <div style={S.cardTop}>
                <div style={S.catName}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  {key}
                </div>
                {limit > 0 && (
                  <span style={S.statusBadge(pct)}>
                    {pct >= 100 ? "Over" : pct >= 80 ? "Warning" : "On track"}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {limit > 0 ? (
                <>
                  <div style={S.track}>
                    <div style={S.fill(pct, color)} />
                  </div>
                  <div style={S.amountRow}>
                    <span>{formatCurrency(spent)} spent</span>
                    <span>
                      {pct.toFixed(0)}% of {formatCurrency(limit)}
                    </span>
                  </div>
                  {remaining >= 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#10B981",
                        marginBottom: 12,
                      }}
                    >
                      ✓ {formatCurrency(remaining)} remaining
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#EF4444",
                        marginBottom: 12,
                      }}
                    >
                      ✕ {formatCurrency(Math.abs(remaining))} over budget
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.2)",
                    marginBottom: 14,
                  }}
                >
                  {formatCurrency(spent)} spent · No limit set yet
                </div>
              )}

              {/* Set / update limit input */}
              <div style={S.inputLabel}>Monthly limit (₹)</div>
              <input
                type="number"
                style={S.input}
                placeholder={limit > 0 ? String(limit) : "Enter amount…"}
                value={drafts[key] || ""}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [key]: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && saveBudget(key)}
                min="0"
              />
              <button
                style={S.saveBtn(color, saved[key])}
                onClick={() => saveBudget(key)}
              >
                {saved[key]
                  ? "✓ Saved!"
                  : limit > 0
                    ? "Update limit"
                    : "Set limit"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
