import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "../utils/helpers";

// ── colour palette shared across all charts ────────────────────────────────
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

// ── shared card style ──────────────────────────────────────────────────────
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

// ── custom tooltip ─────────────────────────────────────────────────────────
const Tip = ({ active, payload, label }) => {
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
          {p.name}:{" "}
          {typeof p.value === "number" && p.value > 100
            ? formatCurrency(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage({ transactions = [], dashboardData }) {
  // ── 1. Monthly income vs expense for last 6 months ──────────────────────
  // useMemo: recalculates only when transactions array changes, not every render
  const monthlyData = useMemo(() => {
    const now = new Date();
    // Build 6 buckets — one per month going back from today
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
      const bucket = buckets.find(
        (b) => b.month === d.getMonth() && b.year === d.getFullYear(),
      );
      if (!bucket) return;
      if (t.type === "INCOME") bucket.Income += t.amount;
      if (t.type === "EXPENSE") bucket.Expense += t.amount;
    });

    return buckets;
  }, [transactions]);

  // ── 2. Net savings per month (Income - Expense) ──────────────────────────
  const savingsData = useMemo(() => {
    return monthlyData.map((m) => ({
      name: m.name,
      Savings: parseFloat((m.Income - m.Expense).toFixed(2)),
    }));
  }, [monthlyData]);

  // ── 3. Category breakdown (expense only) ────────────────────────────────
  const categoryData = useMemo(() => {
    const totals = {};
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      });
    return Object.entries(totals)
      .map(([cat, val]) => ({
        name: cat,
        value: parseFloat(val.toFixed(2)),
        color: CAT_COLORS[cat] || "#6B7280",
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // ── 4. Day-of-week spending pattern ─────────────────────────────────────
  const dowData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const totals = Array(7).fill(0);
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        totals[new Date(t.date).getDay()] += t.amount;
      });
    return days.map((name, i) => ({
      name,
      Spending: parseFloat(totals[i].toFixed(2)),
    }));
  }, [transactions]);

  // ── 5. Summary stats ────────────────────────────────────────────────────
  const totalIncome = dashboardData?.totalIncome || 0;
  const totalExpenditure = dashboardData?.totalExpenditure || 0;
  const savingsRate =
    totalIncome > 0
      ? (((totalIncome - totalExpenditure) / totalIncome) * 100).toFixed(1)
      : 0;
  const avgMonthlySpend = monthlyData.length
    ? (
        monthlyData.reduce((s, m) => s + m.Expense, 0) / monthlyData.length
      ).toFixed(0)
    : 0;
  const topCategory = categoryData[0];

  if (!transactions.length) {
    return (
      <div
        style={{
          padding: "36px 40px",
          color: "rgba(255,255,255,0.3)",
          textAlign: "center",
          paddingTop: 120,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <p style={{ fontSize: 16 }}>No transaction data yet</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>
          Add some transactions to see your analytics
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 40px", minHeight: "100vh", color: "#E8EDF5" }}>
      {/* ── Header ── */}
      <h1
        style={{
          fontSize: 26,
          fontWeight: 600,
          color: "#F0F4FF",
          margin: "0 0 4px",
          letterSpacing: "-0.5px",
        }}
      >
        Analytics
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.35)",
          marginBottom: 32,
        }}
      >
        Deep dive into your spending patterns
      </p>

      {/* ── Stat pills ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: "Savings rate",
            value: `${savingsRate}%`,
            accent: savingsRate >= 20 ? "#10B981" : "#F59E0B",
          },
          {
            label: "Avg monthly spend",
            value: formatCurrency(avgMonthlySpend),
            accent: "#EF4444",
          },
          {
            label: "Top expense",
            value: topCategory ? topCategory.name : "—",
            accent: topCategory
              ? CAT_COLORS[topCategory.name] || "#6B7280"
              : "#6B7280",
          },
          {
            label: "Total transactions",
            value: transactions.length,
            accent: "#63B3FF",
          },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            style={{ ...card, borderLeft: `3px solid ${accent}` }}
          >
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 8,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: accent }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Area chart + Pie ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 18,
          marginBottom: 18,
        }}
      >
        {/* Income vs Expense area chart */}
        <div style={card}>
          <div style={cardTitle}>Income vs Expense — 6 months</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={monthlyData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
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
              <Tooltip content={<Tip />} />
              <Area
                type="monotone"
                dataKey="Income"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#gI)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="Expense"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#gE)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div style={card}>
          <div style={cardTitle}>Expense by category</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={68}
                dataKey="value"
                paddingAngle={3}
              >
                {categoryData.map((entry, i) => (
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
          <div style={{ marginTop: 8 }}>
            {categoryData.slice(0, 4).map((d) => (
              <div
                key={d.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: d.color,
                    }}
                  />
                  <span
                    style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}
                  >
                    {d.name}
                  </span>
                </div>
                <span
                  style={{ fontSize: 12, fontWeight: 500, color: "#E8EDF5" }}
                >
                  {formatCurrency(d.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Savings trend + Day-of-week ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginBottom: 18,
        }}
      >
        {/* Net savings bar chart */}
        <div style={card}>
          <div style={cardTitle}>Monthly net savings</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={savingsData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
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
              <Tooltip content={<Tip />} />
              <Bar dataKey="Savings" radius={[4, 4, 0, 0]}>
                {/* Bar colour: green if positive, red if negative */}
                {savingsData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.Savings >= 0 ? "#10B981" : "#EF4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Day-of-week spending pattern */}
        <div style={card}>
          <div style={cardTitle}>Spending by day of week</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={dowData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
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
              <Tooltip content={<Tip />} />
              <Bar dataKey="Spending" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              marginTop: 10,
            }}
          >
            Helps identify which days you tend to overspend
          </p>
        </div>
      </div>

      {/* ── Row 3: Full category breakdown table ── */}
      <div style={card}>
        <div style={cardTitle}>Full category breakdown</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {categoryData.map(({ name, value, color }) => {
            const pct =
              totalExpenditure > 0
                ? ((value / totalExpenditure) * 100).toFixed(1)
                : 0;
            return (
              <div
                key={name}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: color,
                        display: "inline-block",
                      }}
                    />
                    {name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color }}>
                    {formatCurrency(value)}
                  </span>
                </div>
                {/* Progress bar showing % of total expenses */}
                <div
                  style={{
                    height: 4,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: color,
                      borderRadius: 999,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.3)",
                    marginTop: 6,
                  }}
                >
                  {pct}% of total expenses
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
