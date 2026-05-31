import React, { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { formatCurrency } from "../utils/helpers";
import { exportToCSV } from "../utils/export";

// ── Constants ──────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CAT_COLORS = {
  FUEL: "#F59E0B", MOVIE: "#8B5CF6", FOOD: "#F97316",
  LOAN: "#EF4444", MEDICAL: "#EC4899", SALARY: "#10B981",
  FREELANCE: "#3B82F6", INVESTMENT: "#6366F1", OTHER: "#6B7280",
};

// Each account card gets a distinct colour cycling through this list
const ACCOUNT_ACCENTS = ["#63B3FF","#10B981","#8B5CF6","#F59E0B","#EC4899","#6366F1"];

// ── Custom chart tooltip ───────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#161D2A",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "10px 14px",
    }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 6 }}>
        {label}
      </p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontSize: 13, fontWeight: 500 }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Component ──────────────────────────────────────────────────────────────
export default function DashboardPage({ dashboardData, transactions, accounts = [], loading }) {

  // ── ALL hooks BEFORE any early return ─────────────────────────────────────
  // React rules of hooks: must be called in the same order on every render.
  // If useMemo was placed after "if (!dashboardData) return null",
  // it would be called on some renders and skipped on others → error.
  // Solution: always call hooks first, use safe fallbacks (|| []) for null data.

  // Build 6-month income vs expense buckets from transactions array
  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        name: MONTHS[d.getMonth()],
        Income: 0, Expense: 0,
        month: d.getMonth(), year: d.getFullYear(),
      };
    });
    transactions.forEach(t => {
      const d   = new Date(t.date);
      const idx = buckets.findIndex(
        b => b.month === d.getMonth() && b.year === d.getFullYear()
      );
      if (idx === -1) return;
      if (t.type === "INCOME")  buckets[idx].Income  += t.amount;
      if (t.type === "EXPENSE") buckets[idx].Expense += t.amount;
    });
    return buckets;
  }, [transactions]);

  // Build pie chart slices from categorySummary
  const pieData = useMemo(() => {
    const summary = dashboardData?.categorySummary || {};
    return Object.entries(summary)
      .map(([cat, val]) => ({ name: cat, value: val, color: CAT_COLORS[cat] || "#6B7280" }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [dashboardData]);

  // Net worth = sum of all account balances
  const netWorth = useMemo(() =>
    accounts.reduce((sum, a) => sum + (a.balance || 0), 0),
  [accounts]);

  // ── Early returns AFTER all hooks ─────────────────────────────────────────
  if (loading && !dashboardData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 36, height: 36,
            border: "3px solid rgba(99,179,255,0.15)",
            borderTopColor: "#63B3FF", borderRadius: "50%",
            margin: "0 auto 14px",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading dashboard…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!dashboardData) return null;

  // Safe to destructure now — dashboardData is guaranteed non-null
  const {
    totalIncome      = 0,
    totalExpenditure = 0,
    balance          = 0,
    monthlySummary,
    weeklySummary,
    yearlySummary,
  } = dashboardData;

  return (
    <div className="dash-page">
      {/* ══════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════ */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">Your complete financial overview</p>
        </div>
        <button
          className="export-btn"
          onClick={() => exportToCSV(transactions, "transactions")}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* ══════════════════════════════════════════
          ACCOUNTS ROW
          Shows each real-world account (UPI, Cash, Bank etc.)
          with its live balance. Balances auto-update when
          transactions are added or deleted.
          Last card = net worth (sum of all accounts).
      ══════════════════════════════════════════ */}
      {accounts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-label">Your Accounts</div>
          <div className="accounts-grid">
            {accounts.map((acc, i) => {
              const accent = ACCOUNT_ACCENTS[i % ACCOUNT_ACCENTS.length];
              return (
                <div
                  key={acc.id}
                  className="account-card"
                  style={{ borderLeftColor: accent }}
                >
                  <div className="account-card-name">{acc.name}</div>
                  <div
                    className="account-card-balance"
                    style={{ color: accent }}
                  >
                    {formatCurrency(acc.balance)}
                  </div>
                  <div className="account-card-sub">Current balance</div>
                </div>
              );
            })}

            {/* Net worth total card */}
            <div
              className="account-card"
              style={{ borderLeftColor: "#10B981" }}
            >
              <div className="account-card-name">Net Worth</div>
              <div
                className="account-card-balance"
                style={{ color: "#10B981" }}
              >
                {formatCurrency(netWorth)}
              </div>
              <div className="account-card-sub">All accounts combined</div>
            </div>
          </div>
        </div>
      )}

      {/* No accounts warning */}
      {accounts.length === 0 && (
        <div className="no-accounts-banner">
          ⚠ No accounts yet. Create accounts like UPI, Cash, Bank, Savings to
          track balances automatically.
        </div>
      )}

      {/* ══════════════════════════════════════════
          STAT CARDS
          Global totals across all transactions.
          2 columns on mobile → 4 columns on desktop.
      ══════════════════════════════════════════ */}
      <div className="stats-grid">
        {[
          {
            label: "Total Balance",
            value: balance,
            accent: balance >= 0 ? "#10B981" : "#EF4444",
            sub: "Income − Expenses",
            isCount: false,
          },
          {
            label: "Total Income",
            value: totalIncome,
            accent: "#10B981",
            sub: "All time",
            isCount: false,
          },
          {
            label: "Total Expenses",
            value: totalExpenditure,
            accent: "#EF4444",
            sub: "All time",
            isCount: false,
          },
          {
            label: "Transactions",
            value: transactions.length,
            accent: "#63B3FF",
            sub: "Total records",
            isCount: true,
          },
        ].map(({ label, value, accent, sub, isCount }) => (
          <div
            key={label}
            className="stat-card"
            style={{ borderLeftColor: accent }}
          >
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color: accent }}>
              {isCount ? value : formatCurrency(value)}
            </div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          PERIOD SUMMARY CARDS
          Monthly / Weekly / Yearly breakdown.
          1 column on mobile → 3 columns on desktop.
      ══════════════════════════════════════════ */}
      <div className="period-grid">
        {[
          { label: "This Month", data: monthlySummary },
          { label: "This Week", data: weeklySummary },
          { label: "This Year", data: yearlySummary },
        ].map(({ label, data }) => (
          <div key={label} className="dark-card">
            <div className="section-label">{label}</div>

            {[
              { key: "Income", val: data?.income, col: "#10B981" },
              { key: "Expense", val: data?.expenditure, col: "#EF4444" },
            ].map(({ key, val, col }) => (
              <div key={key} className="period-row">
                <span className="period-key">{key}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: col }}>
                  {formatCurrency(val)}
                </span>
              </div>
            ))}

            <div className="divider" />

            <div className="period-row">
              <span className="period-key">Balance</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: (data?.balance ?? 0) >= 0 ? "#63B3FF" : "#EF4444",
                }}
              >
                {formatCurrency(data?.balance)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          CHARTS ROW
          Area chart (income vs expense) +
          Donut pie chart (expense by category).
          Stacked on mobile → side by side on desktop.
      ══════════════════════════════════════════ */}
      <div className="charts-grid">
        {/* ── Area chart — 6 month trend ── */}
        <div className="dark-card">
          <div className="section-label">Income vs Expense — 6 months</div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart
              data={monthlyChartData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTip />} />
              <Area
                type="monotone"
                dataKey="Income"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#gIncome)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="Expense"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#gExpense)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Donut pie — expense by category ── */}
        <div className="dark-card">
          <div className="section-label">Expense breakdown</div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{
                      background: "#1E293B",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#F0F4FF",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                    }}
                    itemStyle={{ color: "#F0F4FF" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Category legend */}
              <div style={{ marginTop: 10 }}>
                {pieData.slice(0, 4).map((d) => (
                  <div
                    key={d.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "5px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: d.color,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.45)",
                        }}
                      >
                        {d.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#E8EDF5",
                      }}
                    >
                      {formatCurrency(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 13,
                textAlign: "center",
                marginTop: 40,
              }}
            >
              No expense data yet
            </p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RESPONSIVE STYLES
          Mobile-first approach:
            Default CSS = mobile layout
            600px+       = tablet improvements
            900px+       = full desktop layout
      ══════════════════════════════════════════ */}
      <style>{`
        /* ── Base (mobile-first) ── */
        .dash-page    { padding: 16px; color: #E8EDF5; min-height: 100vh; }
        .dash-header  { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 10px; }
        .dash-title   { font-size: 20px; font-weight: 600; color: #F0F4FF; margin: 0 0 3px; letter-spacing: -0.4px; }
        .dash-sub     { font-size: 12px; color: rgba(255,255,255,0.35); margin: 0; }
        .export-btn   { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.55); border-radius: 8px; padding: 7px 12px; font-size: 11px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }

        .section-label { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
        .dark-card     { background: #0D1117; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px 18px; }
        .divider       { height: 1px; background: rgba(255,255,255,0.06); margin: 8px 0; }
        .period-row    { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .period-key    { font-size: 12px; color: rgba(255,255,255,0.38); }

        /* No accounts banner */
        .no-accounts-banner { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #F59E0B; margin-bottom: 18px; line-height: 1.6; }

        /* Accounts grid — auto-fit so it always looks right */
        .accounts-grid       { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
        .account-card        { background: #0D1117; border: 1px solid rgba(255,255,255,0.07); border-left: 3px solid; border-radius: 12px; padding: 13px 15px; }
        .account-card-name   { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
        .account-card-balance{ font-size: 16px; font-weight: 600; letter-spacing: -0.3px; }
        .account-card-sub    { font-size: 10px; color: rgba(255,255,255,0.2); margin-top: 3px; }

        /* Stat cards: 2 columns on mobile */
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
        .stat-card  { background: #0D1117; border: 1px solid rgba(255,255,255,0.07); border-left: 3px solid; border-radius: 12px; padding: 14px 15px; }
        .stat-label { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
        .stat-value { font-size: 18px; font-weight: 600; letter-spacing: -0.3px; }
        .stat-sub   { font-size: 10px; color: rgba(255,255,255,0.22); margin-top: 4px; }

        /* Period cards: 1 column on mobile */
        .period-grid { display: grid; grid-template-columns: 1fr; gap: 10px; margin-bottom: 14px; }

        /* Charts: 1 column on mobile */
        .charts-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }

        /* ── Tablet 600px+ ── */
        @media (min-width: 600px) {
          .dash-page    { padding: 20px 24px; }
          .dash-title   { font-size: 22px; }
          .stats-grid   { grid-template-columns: repeat(4, 1fr); }
          .period-grid  { grid-template-columns: repeat(3, 1fr); }
          .stat-value   { font-size: 22px; }
          .account-card-balance { font-size: 18px; }
        }

        /* ── Desktop 900px+ ── */
        @media (min-width: 900px) {
          .dash-page    { padding: 36px 40px; }
          .dash-title   { font-size: 26px; }
          .export-btn   { padding: 8px 16px; font-size: 12px; }
          .charts-grid  { grid-template-columns: 2fr 1fr; }
          .dark-card    { padding: 24px 28px; }
          .stat-card    { padding: 20px 22px; }
          .stat-value   { font-size: 26px; }
          .account-card { padding: 16px 18px; }
          .account-card-balance { font-size: 22px; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}