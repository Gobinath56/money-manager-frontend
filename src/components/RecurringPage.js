import React, { useState, useEffect } from "react";
import { transactionAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

// ── Recurring transactions are stored in localStorage ──────────────────────
// Structure: Array of { id, type, amount, description, category, division,
//                       frequency, nextRunDate, lastRun, active }
//
// Why localStorage and not backend?
// Adding @Scheduled on the backend requires the server to be running.
// For this project, storing in localStorage and running on page load is
// simpler and works well enough. A production app would use a backend scheduler.
const STORAGE_KEY = "mm_recurring";

const FREQUENCIES = [
  { label: "Daily", value: "DAILY", days: 1 },
  { label: "Weekly", value: "WEEKLY", days: 7 },
  { label: "Monthly", value: "MONTHLY", days: 30 },
  { label: "Yearly", value: "YEARLY", days: 365 },
];

const INCOME_CATS = ["SALARY", "FREELANCE", "INVESTMENT", "OTHER"];
const EXPENSE_CATS = ["FUEL", "FOOD", "MOVIE", "LOAN", "MEDICAL", "OTHER"];

function nextDate(fromDate, frequency) {
  const d = new Date(fromDate);
  const freq = FREQUENCIES.find((f) => f.value === frequency);
  d.setDate(d.getDate() + (freq?.days || 30));
  return d.toISOString();
}

function isDue(nextRunDate) {
  return new Date(nextRunDate) <= new Date();
}

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
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  card: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "24px 28px",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 6,
    display: "block",
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#E8EDF5",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 14,
  },
  select: {
    width: "100%",
    background: "#161D2A",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#E8EDF5",
    fontSize: 13,
    outline: "none",
    marginBottom: 14,
  },
  tabRow: {
    display: "flex",
    marginBottom: 14,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  tab: (active, color) => ({
    flex: 1,
    padding: "9px",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    background: active ? color + "22" : "transparent",
    color: active ? color : "rgba(255,255,255,0.4)",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    transition: "all 0.15s",
  }),
  addBtn: {
    width: "100%",
    padding: "11px",
    borderRadius: 8,
    background: "linear-gradient(135deg, #1E6FD9, #0D4FA8)",
    border: "none",
    color: "#fff",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 4,
  },
  recItem: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: "16px 18px",
    marginBottom: 10,
  },
  recTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recName: { fontSize: 14, fontWeight: 500, color: "#F0F4FF", marginBottom: 3 },
  recMeta: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  badge: (color) => ({
    display: "inline-block",
    padding: "2px 9px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500,
    background: color + "22",
    color: color,
    border: `1px solid ${color}33`,
    marginRight: 6,
  }),
  dueBadge: {
    display: "inline-block",
    padding: "2px 9px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500,
    background: "rgba(245,158,11,0.2)",
    color: "#F59E0B",
    border: "1px solid rgba(245,158,11,0.3)",
  },
  runBtn: {
    background: "rgba(16,185,129,0.15)",
    border: "1px solid rgba(16,185,129,0.3)",
    color: "#10B981",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 12,
    cursor: "pointer",
  },
  delBtn: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#EF4444",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 12,
    cursor: "pointer",
    marginLeft: 6,
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "rgba(255,255,255,0.2)",
  },
};

const defaultForm = {
  description: "",
  amount: "",
  type: "INCOME",
  category: "",
  division: "PERSONAL",
  frequency: "MONTHLY",
};

export default function RecurringPage({ showToast, onRefresh }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState(defaultForm);
  const [running, setRunning] = useState({});

  // ── On mount: auto-run any overdue recurring transactions ────────────────
  // This fires once when the page loads, checking if any items are past due.
  useEffect(() => {
    const due = items.filter((i) => i.active && isDue(i.nextRunDate));
    if (due.length > 0) {
      showToast(
        `${due.length} recurring transaction${due.length > 1 ? "s" : ""} are due — run them from the list`,
        "info",
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (updated) => {
    setItems(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!form.description || !form.amount || !form.category) {
      showToast("Please fill all fields", "error");
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      ...form,
      amount: parseFloat(form.amount),
      active: true,
      // nextRunDate: starts from today + frequency interval
      nextRunDate: nextDate(new Date().toISOString(), form.frequency),
      lastRun: null,
      createdAt: new Date().toISOString(),
    };

    save([...items, newItem]);
    setForm(defaultForm);
    showToast("Recurring transaction added");
  };

  // ── Run a recurring transaction now ──────────────────────────────────────
  // Creates the actual transaction via API, then advances nextRunDate
  const handleRun = async (item) => {
    setRunning((r) => ({ ...r, [item.id]: true }));
    try {
      await transactionAPI.createTransaction({
        type: item.type,
        amount: item.amount,
        description: item.description + " (recurring)",
        category: item.category,
        division: item.division,
        date: new Date().toISOString(),
      });

      // Advance nextRunDate by the frequency interval
      const updated = items.map((i) =>
        i.id === item.id
          ? {
              ...i,
              lastRun: new Date().toISOString(),
              nextRunDate: nextDate(new Date().toISOString(), i.frequency),
            }
          : i,
      );
      save(updated);
      showToast(`"${item.description}" transaction created`);
      onRefresh(); // refresh dashboard totals
    } catch (err) {
      showToast("Failed to create transaction", "error");
    } finally {
      setRunning((r) => ({ ...r, [item.id]: false }));
    }
  };

  const handleToggle = (id) => {
    save(items.map((i) => (i.id === id ? { ...i, active: !i.active } : i)));
  };

  const handleDelete = (id) => {
    save(items.filter((i) => i.id !== id));
    showToast("Recurring transaction removed");
  };

  const categories = form.type === "INCOME" ? INCOME_CATS : EXPENSE_CATS;

  return (
    <div style={S.page}>
      <h1 style={S.title}>Recurring Transactions</h1>
      <p style={S.sub}>
        Set up automatic transactions for salary, rent, EMI, and more
      </p>

      <div style={S.grid}>
        {/* ── Add form ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>New recurring transaction</div>

          {/* Type tab */}
          <div style={S.tabRow}>
            {["INCOME", "EXPENSE"].map((t) => (
              <button
                key={t}
                style={S.tab(
                  form.type === t,
                  t === "INCOME" ? "#10B981" : "#EF4444",
                )}
                onClick={() => setForm({ ...form, type: t, category: "" })}
              >
                {t === "INCOME" ? "💰 Income" : "💸 Expense"}
              </button>
            ))}
          </div>

          <label style={S.label}>Description</label>
          <input
            style={S.input}
            placeholder="e.g. Monthly Salary"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label style={S.label}>Amount (₹)</label>
          <input
            style={S.input}
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            min="0"
          />

          <label style={S.label}>Category</label>
          <select
            style={S.select}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label style={S.label}>Division</label>
          <select
            style={S.select}
            value={form.division}
            onChange={(e) => setForm({ ...form, division: e.target.value })}
          >
            <option value="PERSONAL">Personal</option>
            <option value="OFFICE">Office</option>
          </select>

          <label style={S.label}>Frequency</label>
          <select
            style={S.select}
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <button style={S.addBtn} onClick={handleAdd}>
            + Add Recurring Transaction
          </button>
        </div>

        {/* ── Recurring list ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            Active recurring ({items.filter((i) => i.active).length})
          </div>

          {items.length === 0 ? (
            <div style={S.emptyState}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>↺</div>
              <p style={{ fontSize: 14 }}>No recurring transactions yet</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>
                Add one using the form on the left
              </p>
            </div>
          ) : (
            items.map((item) => {
              const due = isDue(item.nextRunDate) && item.active;
              return (
                <div
                  key={item.id}
                  style={{ ...S.recItem, opacity: item.active ? 1 : 0.5 }}
                >
                  <div style={S.recTop}>
                    <div>
                      <div style={S.recName}>{item.description}</div>
                      <div style={S.recMeta}>
                        {formatCurrency(item.amount)} · {item.frequency} ·{" "}
                        {item.category}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 6,
                      }}
                    >
                      <span
                        style={S.badge(
                          item.type === "INCOME" ? "#10B981" : "#EF4444",
                        )}
                      >
                        {item.type}
                      </span>
                      {due && <span style={S.dueBadge}>Due now</span>}
                    </div>
                  </div>

                  {/* Next run date */}
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.25)",
                      marginBottom: 10,
                    }}
                  >
                    Next:{" "}
                    {new Date(item.nextRunDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {item.lastRun &&
                      ` · Last ran: ${new Date(item.lastRun).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {item.active && (
                      <button
                        style={S.runBtn}
                        onClick={() => handleRun(item)}
                        disabled={running[item.id]}
                      >
                        {running[item.id] ? "Running…" : "▶ Run now"}
                      </button>
                    )}
                    <button
                      onClick={() => handleToggle(item.id)}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.5)",
                        borderRadius: 6,
                        padding: "5px 12px",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {item.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      style={S.delBtn}
                      onClick={() => handleDelete(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
