import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "../utils/helpers";
import { exportToCSV } from "../utils/export";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CAT_COLORS = {
  FUEL: "#F59E0B",
  MOVIE: "#8B5CF6",
  FOOD: "#F97316",
  LOAN: "#EF4444",
  MEDICAL: "#EC4899",
  SALARY: "#10B981",
  FREELANCE: "#3B82F6",
  INVESTMENT: "#6366F1",
  OTHER: "#6B7280",
};

const card = {
  background: "#0D1117",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: "24px 28px",
};

const cardTitle = {
  fontSize: 11,
  fontWeight: 500,
  color: "rgba(255,255,255,0.35)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 20,
};

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#161D2A",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "10px 14px",
      }}
    >
      <p
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 11,
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      {payload.map((p) => (
        <p
          key={p.name}
          style={{ color: p.color, fontSize: 13, fontWeight: 500 }}
        >
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage({
  dashboardData,
  transactions,
  loading,
}) {
  // ─────────────────────────────────────────────────────────────────────────
  //  ALL HOOKS MUST BE HERE — before any conditional return
  //
  //  React Rule: hooks must be called in the same order on every render.
  //  If useMemo was after "if (!dashboardData) return null", React would
  //  call it on some renders and skip it on others → breaks the hook order.
  //  Solution: always call hooks at the top, use empty fallbacks for null data.
  // ─────────────────────────────────────────────────────────────────────────

  // Build 6-month chart data — runs even when dashboardData is null,
  // but transactions will be [] so buckets stay at zero. Safe.
  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        name: MONTHS[d.getMonth()],
        Income: 0,
        Expense: 0,
        month: d.getMonth(),
        year: d.getFullYear(),
      };
    });

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const idx = buckets.findIndex(
        (b) => b.month === d.getMonth() && b.year === d.getFullYear(),
      );
      if (idx === -1) return;
      if (t.type === "INCOME") buckets[idx].Income += t.amount;
      if (t.type === "EXPENSE") buckets[idx].Expense += t.amount;
    });

    return buckets;
  }, [transactions]); // recalculates only when transactions changes

  // Pie chart data — same pattern, safe with empty categorySummary
  const pieData = useMemo(() => {
    const categorySummary = dashboardData?.categorySummary || {};
    return Object.entries(categorySummary)
      .map(([cat, val]) => ({
        name: cat,
        value: val,
        color: CAT_COLORS[cat] || "#6B7280",
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [dashboardData]); // recalculates only when dashboardData changes

  // ─────────────────────────────────────────────────────────────────────────
  //  Early returns AFTER all hooks — this is now safe
  // ─────────────────────────────────────────────────────────────────────────

  if (loading && !dashboardData) {
    return (
      <div
        style={{
          padding: "36px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: "3px solid rgba(99,179,255,0.15)",
              borderTopColor: "#63B3FF",
              borderRadius: "50%",
              margin: "0 auto 14px",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
            Loading dashboard…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!dashboardData) return null;

  // ─────────────────────────────────────────────────────────────────────────
  //  Destructure data — safe now because we returned above if null
  // ─────────────────────────────────────────────────────────────────────────
  const {
    totalIncome = 0,
    totalExpenditure = 0,
    balance = 0,
    monthlySummary,
    weeklySummary,
    yearlySummary,
  } = dashboardData;

  return (
    <div style={{ padding: "36px 40px", minHeight: "100vh", color: "#E8EDF5" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: "#F0F4FF",
              margin: "0 0 4px",
              letterSpacing: "-0.5px",
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            Your complete financial overview
          </p>
        </div>
        <button
          onClick={() => exportToCSV(transactions, "transactions")}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.55)",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* ── 4 stat cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Total Balance",
            value: balance,
            accent: balance >= 0 ? "#10B981" : "#EF4444",
            sub: "All time net",
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
            style={{
              background: "#0D1117",
              border: `1px solid ${accent}22`,
              borderLeft: `3px solid ${accent}`,
              borderRadius: 14,
              padding: "20px 22px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 10,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: accent,
                letterSpacing: "-0.5px",
              }}
            >
              {isCount ? value : formatCurrency(value)}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.25)",
                marginTop: 6,
              }}
            >
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Period summary cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          { label: "This Month", data: monthlySummary },
          { label: "This Week", data: weeklySummary },
          { label: "This Year", data: yearlySummary },
        ].map(({ label, data }) => (
          <div
            key={label}
            style={{
              background: "#0D1117",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.28)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 14,
              }}
            >
              {label}
            </div>
            {[
              { key: "Income", val: data?.income, col: "#10B981" },
              { key: "Expense", val: data?.expenditure, col: "#EF4444" },
            ].map(({ key, val, col }) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
                  {key}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: col }}>
                  {formatCurrency(val)}
                </span>
              </div>
            ))}
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.06)",
                margin: "10px 0",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
                Balance
              </span>
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

      {/* ── Charts row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 18,
        }}
      >
        {/* Area chart */}
        <div style={card}>
          <div style={cardTitle}>Income vs Expense — 6 months</div>
          <ResponsiveContainer width="100%" height={220}>
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

        {/* Pie chart */}
        <div style={card}>
          <div style={cardTitle}>Expense breakdown</div>
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
                      background: "#161D2A",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
