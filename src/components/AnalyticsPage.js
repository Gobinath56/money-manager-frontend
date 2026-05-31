import React, { useMemo, useState, useEffect, useRef } from "react";
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
  ReferenceLine,
  LabelList,
  Label,
} from "recharts";
import { formatCurrency } from "../utils/helpers";
import { exportToCSV } from "../utils/export";

// ── colour palette ──────────────────────────────────────────────────────────
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
  TRIP: "#14B8A6",
  SHOPPING: "#F472B6",
  EDUCATION: "#60A5FA",
  UTILITIES: "#FBBF24",
  RENT: "#A78BFA",
  FITNESS: "#34D399",
  BUSINESS: "#FB923C",
  RENTAL: "#4ADE80",
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

// ── shared card style ───────────────────────────────────────────────────────
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
  marginBottom: 0,
};

// ── Y-axis tick formatter ────────────────────────────────────────────────────
function fmtYAxis(value) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
  return `₹${value}`;
}

// ── Custom tooltip ──────────────────────────────────────────────────────────
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

// ── Date-range filter options ────────────────────────────────────────────────
const RANGES = [
  { label: "Last 30d", days: 30 },
  { label: "Last 3mo", days: 90 },
  { label: "Last 6mo", days: 180 },
  { label: "All time", days: null },
];

// ── capitalize helper ────────────────────────────────────────────────────────
function cap(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ── group small pie slices into "Others" ─────────────────────────────────────
function groupSmallSlices(data, threshold = 0.03) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const big = data.filter((d) => d.value / total >= threshold);
  const small = data.filter((d) => d.value / total < threshold);
  if (small.length === 0) return data;
  const othersVal = small.reduce((s, d) => s + d.value, 0);
  const existing = big.find((d) => d.name === "OTHERS" || d.name === "OTHER");
  if (existing) {
    existing.value += othersVal;
    return big;
  }
  return [...big, { name: "OTHERS", value: othersVal, color: "#6B7280" }];
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyChart({ message = "No data yet" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: 160,
        color: "rgba(255,255,255,0.18)",
        fontSize: 13,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
      <div>{message}</div>
    </div>
  );
}

// ── IMPROVEMENT 5: Count-up animation hook ───────────────────────────────────
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const startValRef = useRef(0);

  useEffect(() => {
    if (typeof target !== "number" || isNaN(target)) {
      setValue(target);
      return;
    }
    const startVal = startValRef.current;
    startRef.current = null;

    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startVal + (target - startVal) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      else {
        setValue(target);
        startValRef.current = target;
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]); // eslint-disable-line

  return value;
}

// ── IMPROVEMENT 5: Animated stat pill ───────────────────────────────────────
function AnimatedStatPill({ label, rawValue, displayValue, accent, isCount }) {
  const numericTarget = isCount
    ? typeof rawValue === "number"
      ? rawValue
      : 0
    : null;
  const animated = useCountUp(numericTarget, 900);

  const shown = isCount ? Math.round(animated) : displayValue;

  return (
    <div style={{ ...card, borderLeft: `3px solid ${accent}` }}>
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
        {shown}
      </div>
    </div>
  );
}

// ── IMPROVEMENT 2: Pie center label ─────────────────────────────────────────
const PieCenterLabel = ({ viewBox, total }) => {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  const formatted = formatCurrency(total);
  // Shorten if too long to fit
  const short =
    total >= 100000
      ? `₹${(total / 100000).toFixed(1)}L`
      : total >= 1000
        ? `₹${(total / 1000).toFixed(0)}k`
        : formatted;

  return (
    <>
      <text
        x={cx}
        y={cy - 7}
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        fontSize={10}
      >
        total
      </text>
      <text
        x={cx}
        y={cy + 9}
        textAnchor="middle"
        fill="#F0F4FF"
        fontSize={13}
        fontWeight={600}
      >
        {short}
      </text>
    </>
  );
};

// ── Main component ──────────────────────────────────────────────────────────
export default function AnalyticsPage({ transactions = [], dashboardData }) {
  const [rangeDays, setRangeDays] = useState(180);
  const [pieMode, setPieMode] = useState("EXPENSE");
  // IMPROVEMENT 6: sort toggle for category breakdown
  const [catSort, setCatSort] = useState("amount"); // "amount" | "name"

  // ── Filter transactions by date range ──────────────────────────────────
  const rangedTxns = useMemo(() => {
    if (!rangeDays) return transactions;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays);
    return transactions.filter((t) => new Date(t.date) >= cutoff);
  }, [transactions, rangeDays]);

  // ── 1. Monthly income vs expense ───────────────────────────────────────
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = rangeDays ? Math.min(Math.ceil(rangeDays / 30), 12) : 12;
    const buckets = Array.from({ length: months }, (_, i) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - (months - 1 - i),
        1,
      );
      return {
        name: MONTHS[d.getMonth()],
        Income: 0,
        Expense: 0,
        month: d.getMonth(),
        year: d.getFullYear(),
      };
    });
    rangedTxns.forEach((t) => {
      const d = new Date(t.date);
      const bucket = buckets.find(
        (b) => b.month === d.getMonth() && b.year === d.getFullYear(),
      );
      if (!bucket) return;
      if (t.type === "INCOME") bucket.Income += t.amount;
      if (t.type === "EXPENSE") bucket.Expense += t.amount;
    });
    return buckets;
  }, [rangedTxns, rangeDays]);

  // ── 2. Net savings ──────────────────────────────────────────────────────
  const savingsData = useMemo(
    () =>
      monthlyData.map((m) => ({
        name: m.name,
        Savings: parseFloat((m.Income - m.Expense).toFixed(2)),
      })),
    [monthlyData],
  );

  // ── 3. Category breakdown ───────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const totals = {};
    rangedTxns
      .filter((t) => t.type === pieMode)
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
  }, [rangedTxns, pieMode]);

  // Grouped for pie
  const pieData = useMemo(() => groupSmallSlices(categoryData), [categoryData]);

  // Pie total for center label
  const pieTotal = useMemo(
    () => pieData.reduce((s, d) => s + d.value, 0),
    [pieData],
  );

  // IMPROVEMENT 6: sorted category data
  const sortedCategoryData = useMemo(
    () =>
      [...categoryData].sort((a, b) =>
        catSort === "amount" ? b.value - a.value : a.name.localeCompare(b.name),
      ),
    [categoryData, catSort],
  );

  // Top-3 concentration
  const top3Pct = useMemo(() => {
    const total = categoryData.reduce((s, d) => s + d.value, 0);
    if (!total) return 0;
    return (
      (categoryData.slice(0, 3).reduce((s, d) => s + d.value, 0) / total) * 100
    );
  }, [categoryData]);

  // ── 4. Day-of-week ──────────────────────────────────────────────────────
  const dowData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const totals = Array(7).fill(0);
    const weekSet = Array.from({ length: 7 }, () => new Set());

    rangedTxns
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const d = new Date(t.date);
        const dow = d.getDay();
        totals[dow] += t.amount;
        const weekKey = `${d.getFullYear()}-W${Math.floor(d.getDate() / 7)}`;
        weekSet[dow].add(weekKey);
      });

    return days.map((name, i) => ({
      name,
      "Avg Spend":
        weekSet[i].size > 0
          ? parseFloat((totals[i] / weekSet[i].size).toFixed(2))
          : 0,
    }));
  }, [rangedTxns]);

  // IMPROVEMENT 4: find max day value
  const maxDowValue = useMemo(
    () => Math.max(...dowData.map((d) => d["Avg Spend"])),
    [dowData],
  );

  // ── 5. Summary stats ────────────────────────────────────────────────────
  const totalIncome = dashboardData?.totalIncome || 0;
  const totalExpenditure = dashboardData?.totalExpenditure || 0;
  const rawSavingsRate =
    totalIncome > 0
      ? ((totalIncome - totalExpenditure) / totalIncome) * 100
      : 0;
  const savingsRate = rawSavingsRate.toFixed(1);
  const isOverBudget = rawSavingsRate < 0;

  const avgMonthlySpend = monthlyData.length
    ? (
        monthlyData.reduce((s, m) => s + m.Expense, 0) / monthlyData.length
      ).toFixed(0)
    : 0;

  const topCategory = categoryData.filter((d) => d.value > 0)[0];

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

  // ── Type toggle (shared between pie + breakdown) ─────────────────────────
  const TypeToggle = () => (
    <div
      style={{
        display: "flex",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: 3,
      }}
    >
      {["EXPENSE", "INCOME"].map((m) => (
        <button
          key={m}
          onClick={() => setPieMode(m)}
          style={{
            padding: "4px 10px",
            border: "none",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
            background:
              pieMode === m
                ? m === "EXPENSE"
                  ? "rgba(239,68,68,0.2)"
                  : "rgba(16,185,129,0.2)"
                : "transparent",
            color:
              pieMode === m
                ? m === "EXPENSE"
                  ? "#EF4444"
                  : "#10B981"
                : "rgba(255,255,255,0.3)",
            fontFamily: "inherit",
          }}
        >
          {m === "EXPENSE" ? "Expense" : "Income"}
        </button>
      ))}
    </div>
  );

  return (
    <div className="analytics-page">
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 6,
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
            Analytics
          </h1>
          <p
            style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}
          >
            Deep dive into your spending patterns
          </p>
        </div>

        {/* Date range filter */}
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRangeDays(r.days)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                background:
                  rangeDays === r.days
                    ? "rgba(99,179,255,0.15)"
                    : "rgba(255,255,255,0.04)",
                border:
                  rangeDays === r.days
                    ? "1px solid rgba(99,179,255,0.35)"
                    : "1px solid rgba(255,255,255,0.1)",
                color:
                  rangeDays === r.days ? "#63B3FF" : "rgba(255,255,255,0.4)",
                fontFamily: "inherit",
              }}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() => exportToCSV(rangedTxns, `analytics-${rangeDays || "all"}d`)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
              fontFamily: "inherit",
            }}
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 28 }} />

      {/* ── IMPROVEMENT 5: Animated stat pills ── */}
      <div className="analytics-stat-grid">
        <AnimatedStatPill
          label={isOverBudget ? "Over budget by" : "Savings rate"}
          rawValue={parseFloat(Math.abs(savingsRate))}
          displayValue={
            isOverBudget ? `${Math.abs(savingsRate)}%` : `${savingsRate}%`
          }
          accent={
            isOverBudget
              ? "#EF4444"
              : parseFloat(savingsRate) >= 20
                ? "#10B981"
                : "#F59E0B"
          }
          isCount={false}
        />
        <AnimatedStatPill
          label="Avg monthly spend"
          rawValue={parseFloat(avgMonthlySpend)}
          displayValue={formatCurrency(avgMonthlySpend)}
          accent="#EF4444"
          isCount={false}
        />
        <AnimatedStatPill
          label="Top expense"
          rawValue={topCategory ? topCategory.name : "—"}
          displayValue={topCategory ? cap(topCategory.name) : "—"}
          accent={
            topCategory ? CAT_COLORS[topCategory.name] || "#6B7280" : "#6B7280"
          }
          isCount={false}
        />
        <AnimatedStatPill
          label="Total transactions"
          rawValue={rangedTxns.length}
          displayValue={rangedTxns.length}
          accent="#63B3FF"
          isCount={true}
        />
      </div>

      {/* ── Row 1: Area chart + Pie ── */}
      <div className="analytics-row1">
        {/* IMPROVEMENT 1: Area chart with legend */}
        <div style={card}>
          {/* Header row with legend */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={cardTitle}>Income vs Expense</div>
            {/* IMPROVEMENT 1: Custom HTML legend */}
            <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
              {[
                ["#10B981", "Income"],
                ["#EF4444", "Expense"],
              ].map(([color, label]) => (
                <span
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: color,
                      display: "inline-block",
                    }}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>
          {monthlyData.every((m) => m.Income === 0 && m.Expense === 0) ? (
            <EmptyChart message="No transactions in this period" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={monthlyData}
                margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="gIncome-analytics"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="gExpense-analytics"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                  tickFormatter={fmtYAxis}
                />
                <Tooltip content={<Tip />} />
                <Area
                  type="monotone"
                  dataKey="Income"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#gIncome-analytics)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="Expense"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#gExpense-analytics)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* IMPROVEMENT 2: Pie with center label + type toggle */}
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={cardTitle}>By category</div>
            <TypeToggle />
          </div>

          {pieData.length === 0 ? (
            <EmptyChart message={`No ${pieMode.toLowerCase()} data`} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={64}
                    dataKey="value"
                    paddingAngle={3}
                    animationBegin={0}
                    animationDuration={600}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                    {/* IMPROVEMENT 2: center label showing total */}
                    <Label
                      content={<PieCenterLabel total={pieTotal} />}
                      position="center"
                    />
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
                {pieData.slice(0, 5).map((d) => (
                  <div
                    key={d.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "5px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
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
                        {cap(d.name)}
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
          )}
        </div>
      </div>

      {/* ── Row 2: Savings + Day-of-week ── */}
      <div className="analytics-row2">
        {/* IMPROVEMENT 3: Savings bar chart with zero reference line */}
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={cardTitle}>Monthly net savings</div>
            {/* Mini legend */}
            <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
              {[
                ["#10B981", "Positive"],
                ["#EF4444", "Negative"],
              ].map(([color, label]) => (
                <span
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: color,
                      display: "inline-block",
                    }}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>
          {savingsData.every((m) => m.Savings === 0) ? (
            <EmptyChart message="No data in this period" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={savingsData}
                margin={{ top: 4, right: 0, left: -10, bottom: 0 }}
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
                  tickFormatter={fmtYAxis}
                />
                <Tooltip content={<Tip />} />
                {/* IMPROVEMENT 3: zero baseline reference line */}
                <ReferenceLine
                  y={0}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
                <Bar
                  dataKey="Savings"
                  radius={[4, 4, 0, 0]}
                  animationDuration={600}
                >
                  {savingsData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.Savings >= 0 ? "#10B981" : "#EF4444"}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* IMPROVEMENT 4: Day-of-week with highlighted max bar */}
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <div style={cardTitle}>Avg spend by day</div>
            {maxDowValue > 0 && (
              <span
                style={{
                  fontSize: 10,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  color: "#F59E0B",
                }}
              >
                Peak:{" "}
                {dowData.find((d) => d["Avg Spend"] === maxDowValue)?.name}
              </span>
            )}
          </div>
          {dowData.every((d) => d["Avg Spend"] === 0) ? (
            <EmptyChart message="No expense data" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={185}>
                <BarChart
                  data={dowData}
                  margin={{ top: 16, right: 0, left: -10, bottom: 0 }}
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
                    tickFormatter={fmtYAxis}
                  />
                  <Tooltip content={<Tip />} />
                  <Bar
                    dataKey="Avg Spend"
                    radius={[4, 4, 0, 0]}
                    animationDuration={600}
                  >
                    {dowData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry["Avg Spend"] === maxDowValue && maxDowValue > 0
                            ? "#F59E0B"
                            : "#6366F1"
                        }
                        fillOpacity={
                          entry["Avg Spend"] === maxDowValue && maxDowValue > 0
                            ? 1
                            : 0.6
                        }
                      />
                    ))}
                    {/* IMPROVEMENT 4: "peak" label on max bar */}
                    <LabelList
                      dataKey="Avg Spend"
                      content={({ x, y, width, value }) => {
                        if (value !== maxDowValue || maxDowValue === 0)
                          return null;
                        return (
                          <text
                            x={x + width / 2}
                            y={y - 5}
                            fill="#F59E0B"
                            fontSize={10}
                            textAnchor="middle"
                            fontWeight={600}
                          >
                            peak
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.2)",
                  marginTop: 8,
                }}
              >
                Average expense per day-of-week — pinpoint your highest-spend
                days
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── IMPROVEMENT 6: Full category breakdown with sort + concentration summary ── */}
      <div style={{ ...card, marginTop: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={cardTitle}>Full category breakdown</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* IMPROVEMENT 6: sort toggle */}
            <div style={{ display: "flex", gap: 4 }}>
              {[
                ["amount", "By value"],
                ["name", "A–Z"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCatSort(key)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    background:
                      catSort === key
                        ? "rgba(99,179,255,0.15)"
                        : "rgba(255,255,255,0.04)",
                    border:
                      catSort === key
                        ? "1px solid rgba(99,179,255,0.3)"
                        : "1px solid rgba(255,255,255,0.1)",
                    color:
                      catSort === key ? "#63B3FF" : "rgba(255,255,255,0.35)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <TypeToggle />
          </div>
        </div>

        {/* IMPROVEMENT 6: Top-3 concentration summary */}
        {sortedCategoryData.length >= 3 && (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.4)" }}>
              Top 3 categories account for
            </span>
            <span
              style={{
                fontWeight: 600,
                color:
                  top3Pct > 80
                    ? "#EF4444"
                    : top3Pct > 60
                      ? "#F59E0B"
                      : "#10B981",
              }}
            >
              {top3Pct.toFixed(0)}% of total {pieMode.toLowerCase()}
            </span>
          </div>
        )}

        {sortedCategoryData.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "rgba(255,255,255,0.2)",
              fontSize: 13,
            }}
          >
            No {pieMode.toLowerCase()} categories in this period
          </div>
        ) : (
          <div className="analytics-cat-grid">
            {sortedCategoryData.map(({ name, value, color }) => {
              const modeTotal = sortedCategoryData.reduce(
                (s, d) => s + d.value,
                0,
              );
              const pct =
                modeTotal > 0 ? ((value / modeTotal) * 100).toFixed(1) : 0;
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
                        color: "#E8EDF5",
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
                      {cap(name)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color }}>
                      {formatCurrency(value)}
                    </span>
                  </div>
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
                    {pct}% of total {pieMode.toLowerCase()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Responsive CSS ── */}
      <style>{`
        .analytics-page {
          padding: 16px;
          min-height: 100vh;
          color: #E8EDF5;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .analytics-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .analytics-row1 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .analytics-row2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .analytics-cat-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        @media (min-width: 600px) {
          .analytics-page { padding: 24px 28px; gap: 18px; }
          .analytics-stat-grid { grid-template-columns: repeat(4, 1fr); }
          .analytics-cat-grid  { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 900px) {
          .analytics-page   { padding: 36px 40px; }
          .analytics-row1   { grid-template-columns: 2fr 1fr; }
          .analytics-row2   { grid-template-columns: 1fr 1fr; }
          .analytics-cat-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
        }
      `}</style>
    </div>
  );
}
