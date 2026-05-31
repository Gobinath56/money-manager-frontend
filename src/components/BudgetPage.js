import React, { useState, useEffect, useMemo, useCallback } from "react";
import { categoryAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

// ─────────────────────────────────────────────────────────────────────────────
//  BudgetPage  —  rewritten
//
//  Bug fixes vs previous version:
//    1. BudgetCard no longer calls loadBudget() on every render.
//       limit/fixed now live in useState with lazy initialisers.
//    2. key={`${cat.id}-${tick}`} forces a full remount after every
//       save/clear, so stale closure values can never survive.
//    3. handleSave / handleClear update local state immediately so the
//       progress bar refreshes within the same render cycle.
//    4. handleOpen no longer re-reads localStorage — state is already fresh.
//    5. summary useMemo still depends on tick (for the parent strip).
// ─────────────────────────────────────────────────────────────────────────────

const CAT_ICONS = {
  FOOD: "🍔",
  FUEL: "⛽",
  TRIP: "✈️",
  MEDICAL: "🏥",
  MOVIE: "🎬",
  LOAN: "💳",
  SHOPPING: "🛍️",
  UTILITIES: "💡",
  RENT: "🏠",
  FITNESS: "💪",
  EDUCATION: "📚",
  OTHER: "📦",
  SALARY: "💰",
  FREELANCE: "💼",
  INVESTMENT: "📈",
  BUSINESS: "🏢",
  RENTAL: "🏘️",
};

const CAT_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
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
  const fixed = localStorage.getItem(storageKey(catName, true));
  const monthly = localStorage.getItem(storageKey(catName, false));
  if (fixed) return { limit: parseFloat(fixed), fixed: true };
  if (monthly) return { limit: parseFloat(monthly), fixed: false };
  return { limit: 0, fixed: false };
}
function saveBudget(catName, limit, fixed) {
  localStorage.removeItem(storageKey(catName, true));
  localStorage.removeItem(storageKey(catName, false));
  if (limit > 0)
    localStorage.setItem(storageKey(catName, fixed), String(limit));
}

// ── Animated progress bar ────────────────────────────────────────────────
function ProgressBar({ pct, color }) {
  const clamped = Math.min(pct, 100);
  const fill = pct >= 100 ? "#EF4444" : pct >= 80 ? "#F59E0B" : color;
  return (
    <div
      style={{
        height: 6,
        background: "rgba(255,255,255,0.07)",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${clamped}%`,
          background: fill,
          borderRadius: 999,
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: pct > 0 ? `0 0 8px ${fill}55` : "none",
        }}
      />
    </div>
  );
}

// ── Single budget card ────────────────────────────────────────────────────
//
//  KEY CHANGE: limit and fixed are initialised from localStorage ONCE on
//  mount (lazy useState), not re-read on every render. The parent passes
//  key={`${cat.id}-${tick}`} so this component fully remounts after every
//  save/clear — the initialiser always sees fresh data.
//
function BudgetCard({ cat, color, icon, spending, onSave, onClear }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Read localStorage once on mount ──────────────────────────────────
  const [limit, setLimit] = useState(() => loadBudget(cat).limit);
  const [fixed, setFixed] = useState(() => loadBudget(cat).fixed);

  // Editor fields seed from live state values
  const [inputVal, setInputVal] = useState(() => {
    const b = loadBudget(cat);
    return b.limit > 0 ? String(b.limit) : "";
  });
  const [isFixed, setIsFixed] = useState(() => loadBudget(cat).fixed);

  const spend = spending || 0;
  const pct = limit > 0 ? Math.round((spend / limit) * 100) : 0;
  const rem = limit - spend;

  const status = !limit
    ? "none"
    : pct >= 100
      ? "over"
      : pct >= 80
        ? "warn"
        : "ok";

  const statusLabel = {
    none: "No limit",
    over: "Over limit",
    warn: "Near limit",
    ok: "On track",
  }[status];
  const statusColor = {
    none: "rgba(255,255,255,0.2)",
    over: "#EF4444",
    warn: "#F59E0B",
    ok: "#10B981",
  }[status];
  const statusBg = {
    none: "rgba(255,255,255,0.04)",
    over: "rgba(239,68,68,0.1)",
    warn: "rgba(245,158,11,0.1)",
    ok: "rgba(16,185,129,0.1)",
  }[status];

  // Toggle editor — seed inputVal from current state (not localStorage)
  function handleOpen() {
    if (!open) {
      setInputVal(limit > 0 ? String(limit) : "");
      setIsFixed(fixed);
    }
    setOpen((o) => !o);
  }

  // Save — update local state immediately so progress bar refreshes now,
  // then notify parent to bump tick (which remounts this card for a clean slate)
  function handleSave() {
    const val = parseFloat(inputVal);
    if (!val || val <= 0) return;
    saveBudget(cat, val, isFixed);
    setLimit(val);
    setFixed(isFixed);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      onSave();
    }, 800);
  }

  // Clear — update local state immediately, then notify parent
  function handleClear() {
    saveBudget(cat, 0, false);
    setLimit(0);
    setFixed(false);
    setOpen(false);
    onClear();
  }

  const displayName = cat.charAt(0) + cat.slice(1).toLowerCase();

  return (
    <div
      style={{
        background: "#0D1117",
        border: `1px solid ${open ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
        borderLeft: `3px solid ${status === "none" ? color : statusColor}`,
        borderRadius: 14,
        padding: "18px 20px",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: open ? "0 0 0 1px rgba(255,255,255,0.04)" : "none",
      }}
    >
      {/* ── Top row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: color + "18",
            border: `1px solid ${color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#F0F4FF" }}>
            {displayName}
          </div>
          {fixed && limit > 0 && (
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.25)",
                marginTop: 1,
              }}
            >
              Fixed — never resets
            </div>
          )}
        </div>

        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: 20,
            background: statusBg,
            color: statusColor,
            border: `1px solid ${statusColor}33`,
            flexShrink: 0,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* ── Progress section ── */}
      {limit > 0 ? (
        <>
          <ProgressBar pct={pct} color={color} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <span>{formatCurrency(spend)} spent</span>
            <span
              style={{
                color: rem >= 0 ? "#10B981" : "#EF4444",
                fontWeight: 500,
              }}
            >
              {rem >= 0
                ? `${formatCurrency(rem)} left`
                : `${formatCurrency(Math.abs(rem))} over`}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 5,
            }}
          >
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>
              {pct}% of {formatCurrency(limit)}
            </span>
            {/* Mini segmented progress indicator */}
            <div style={{ display: "flex", gap: 2 }}>
              {[25, 50, 75, 100].map((mark) => (
                <div
                  key={mark}
                  style={{
                    width: 16,
                    height: 3,
                    borderRadius: 2,
                    background: pct >= mark ? color : "rgba(255,255,255,0.08)",
                    transition: "background 0.4s",
                    opacity: pct >= 100 && mark === 100 ? 1 : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.25)",
            marginBottom: 2,
          }}
        >
          {formatCurrency(spend)} spent · no limit set
        </div>
      )}

      {/* ── Edit toggle link ── */}
      <button
        onClick={handleOpen}
        style={{
          marginTop: 13,
          background: "none",
          border: "none",
          color: open ? "rgba(255,255,255,0.4)" : color + "99",
          fontSize: 11,
          cursor: "pointer",
          padding: 0,
          fontFamily: "inherit",
          letterSpacing: "0.02em",
          transition: "color 0.15s",
        }}
      >
        {open ? "▲ close" : limit > 0 ? "✎ edit limit" : "+ set limit"}
      </button>

      {/* ── Expanded editor ── */}
      {open && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            animation: "slideDown 0.18s ease",
          }}
        >
          {/* Amount input */}
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 7,
            }}
          >
            {isFixed ? "Fixed limit" : "Monthly limit"} (₹)
          </div>

          <div style={{ position: "relative", marginBottom: 12 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.3)",
                fontSize: 13,
              }}
            >
              ₹
            </span>
            <input
              type="number"
              min="1"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={limit > 0 ? `Current: ₹${limit}` : "e.g. 5000"}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 9,
                padding: "10px 12px 10px 28px",
                color: "#E8EDF5",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = color + "66")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.12)")
              }
            />
          </div>

          {/* Reset type toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[
              { val: false, label: "🔄 Monthly", sub: "Resets on 1st" },
              { val: true, label: "🔒 Fixed", sub: "Rent, EMI…" },
            ].map((opt) => (
              <button
                key={String(opt.val)}
                onClick={() => setIsFixed(opt.val)}
                style={{
                  flex: 1,
                  padding: "9px 10px",
                  borderRadius: 9,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background:
                    isFixed === opt.val
                      ? color + "15"
                      : "rgba(255,255,255,0.04)",
                  border:
                    isFixed === opt.val
                      ? `1px solid ${color}44`
                      : "1px solid rgba(255,255,255,0.08)",
                  color: isFixed === opt.val ? color : "rgba(255,255,255,0.35)",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 500 }}>{opt.label}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                  {opt.sub}
                </div>
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 9,
                cursor: "pointer",
                fontFamily: "inherit",
                background: saved ? "rgba(16,185,129,0.15)" : color + "18",
                border: `1px solid ${saved ? "rgba(16,185,129,0.35)" : color + "44"}`,
                color: saved ? "#10B981" : color,
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              {saved ? "✓ saved!" : limit > 0 ? "update" : "set limit"}
            </button>

            {limit > 0 && (
              <button
                onClick={handleClear}
                style={{
                  padding: "10px 16px",
                  borderRadius: 9,
                  cursor: "pointer",
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  color: "rgba(239,68,68,0.6)",
                  fontSize: 12,
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.14)";
                  e.currentTarget.style.color = "#EF4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.07)";
                  e.currentTarget.style.color = "rgba(239,68,68,0.6)";
                }}
              >
                clear
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function BudgetPage({
  dashboardData,
  transactions = [],
  showToast,
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  // tick bumps after every save/clear — forces BudgetCard remounts via key
  const [tick, setTick] = useState(0);

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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Spending per category, scaled to period ─────────────────────────
  const catSummary = useMemo(
    () => dashboardData?.categorySummary || {},
    [dashboardData],
  );
  const allTimeTotal = useMemo(
    () => Object.values(catSummary).reduce((s, v) => s + v, 0),
    [catSummary],
  );
  const periodSpend = useMemo(() => {
    const raw =
      period === "weekly"
        ? dashboardData?.weeklySummary?.expenditure
        : period === "yearly"
          ? dashboardData?.yearlySummary?.expenditure
          : dashboardData?.monthlySummary?.expenditure;
    return raw || 0;
  }, [period, dashboardData]);

  const catSpending = useMemo(() => {
    if (allTimeTotal === 0) return catSummary;
    const ratio = periodSpend / allTimeTotal;
    const out = {};
    Object.entries(catSummary).forEach(([k, v]) => {
      out[k] = v * ratio;
    });
    return out;
  }, [catSummary, allTimeTotal, periodSpend]);

  // ── Summary strip ────────────────────────────────────────────────────
  // tick in deps so this re-runs after every save/clear
  const summary = useMemo(() => {
    const periodDiv =
      period === "weekly" ? 4 : period === "yearly" ? 1 / 12 : 1;
    let budgeted = 0,
      spent = 0,
      over = 0,
      warn = 0;
    categories.forEach((cat) => {
      const { limit } = loadBudget(cat.name);
      if (!limit) return;
      const scaledLimit = limit / periodDiv;
      const s = catSpending[cat.name] || 0;
      const pct = (s / scaledLimit) * 100;
      budgeted += scaledLimit;
      spent += s;
      if (pct >= 100) over++;
      else if (pct >= 80) warn++;
    });
    return {
      budgeted,
      spent,
      remaining: Math.max(0, budgeted - spent),
      over,
      warn,
    };
  }, [categories, catSpending, period, tick]); // eslint-disable-line

  const periodDiv = period === "weekly" ? 4 : period === "yearly" ? 1 / 12 : 1;
  const periodLabel =
    period === "weekly"
      ? "This week"
      : period === "yearly"
        ? "This year"
        : "This month";
  const hasBudgets = categories.some((cat) => loadBudget(cat.name).limit > 0);

  // ── Loading state ────────────────────────────────────────────────────
  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: "2px solid rgba(99,179,255,0.15)",
            borderTopColor: "#63B3FF",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          Loading categories…
        </span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  return (
    <div className="budget-page-wrap">
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#F0F4FF",
            margin: "0 0 4px",
            letterSpacing: "-0.4px",
          }}
        >
          Budget Goals
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Set spending limits per category. Limits are saved on this device
          only.
        </p>
      </div>

      {/* ── Period selector ── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 24,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            marginRight: 2,
          }}
        >
          Viewing:
        </span>
        {[
          ["monthly", "This month"],
          ["weekly", "This week"],
          ["yearly", "This year"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setPeriod(k)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
              background:
                period === k
                  ? "rgba(99,179,255,0.15)"
                  : "rgba(255,255,255,0.04)",
              border:
                period === k
                  ? "1px solid rgba(99,179,255,0.35)"
                  : "1px solid rgba(255,255,255,0.08)",
              color: period === k ? "#63B3FF" : "rgba(255,255,255,0.4)",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Summary strip ── */}
      {hasBudgets && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {[
            {
              label: "Budgeted",
              value: formatCurrency(summary.budgeted),
              color: "#63B3FF",
            },
            {
              label: "Spent",
              value: formatCurrency(summary.spent),
              color: summary.spent > summary.budgeted ? "#EF4444" : "#F0F4FF",
            },
            {
              label: "Remaining",
              value: formatCurrency(summary.remaining),
              color: "#10B981",
            },
            {
              label: "Status",
              value:
                summary.over > 0
                  ? `${summary.over} over`
                  : summary.warn > 0
                    ? `${summary.warn} near`
                    : "All OK ✓",
              color:
                summary.over > 0
                  ? "#EF4444"
                  : summary.warn > 0
                    ? "#F59E0B"
                    : "#10B981",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: "#0D1117",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 6,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color }}>
                {value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.2)",
                  marginTop: 2,
                }}
              >
                {periodLabel}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty categories state ── */}
      {categories.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#0D1117",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            color: "rgba(255,255,255,0.2)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 14 }}>📂</div>
          <p
            style={{
              fontWeight: 500,
              marginBottom: 8,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            No expense categories yet
          </p>
          <p style={{ fontSize: 13 }}>
            Go to the Categories page and add some first.
          </p>
        </div>
      ) : (
        <>
          {/* ── Cards grid ── */}
          <div className="budget-cards-grid">
            {categories.map((cat, i) => {
              const scaledSpend = (catSpending[cat.name] || 0) / periodDiv;
              const color = CAT_COLORS[i % CAT_COLORS.length];
              const icon = CAT_ICONS[cat.name] || "📁";
              return (
                <BudgetCard
                  // key includes tick so card fully remounts after every save/clear
                  key={`${cat.id}-${tick}`}
                  cat={cat.name}
                  color={color}
                  icon={icon}
                  spending={scaledSpend}
                  onSave={() => setTick((t) => t + 1)}
                  onClear={() => setTick((t) => t + 1)}
                />
              );
            })}
          </div>

          {/* ── Footer note ── */}
          <div
            style={{
              marginTop: 32,
              textAlign: "center",
              fontSize: 11,
              color: "rgba(255,255,255,0.12)",
            }}
          >
            Budget limits are saved on this device only and do not sync across
            devices.
          </div>
        </>
      )}

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
