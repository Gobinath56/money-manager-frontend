import React, { useState, useEffect } from "react";
import { recurringAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

// ── Constants ──────────────────────────────────────────────────────────────
const FREQUENCIES = [
  { label: "Daily", value: "DAILY" },
  { label: "Weekly", value: "WEEKLY" },
  { label: "Monthly", value: "MONTHLY" },
  { label: "Yearly", value: "YEARLY" },
];

const INCOME_CATS = ["SALARY", "FREELANCE", "INVESTMENT", "OTHER"];
const EXPENSE_CATS = ["FUEL", "FOOD", "MOVIE", "LOAN", "MEDICAL", "OTHER"];

const defaultForm = {
  description: "",
  amount: "",
  type: "INCOME",
  category: "",
  division: "PERSONAL",
  frequency: "MONTHLY",
};

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  page: {
    padding: "36px 40px",
    minHeight: "100vh",
    color: "#E8EDF5",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  title: {
    fontSize: 26,
    fontWeight: 600,
    color: "#F0F4FF",
    margin: "0 0 4px",
    letterSpacing: "-0.5px",
  },
  sub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    marginBottom: 32,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  },
  card: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "24px 28px",
  },
  cardTitle: {
    fontSize: 11,
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
    transition: "border-color 0.2s",
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
    cursor: "pointer",
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
    transition: "opacity 0.15s",
  },
  recItem: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: "16px 18px",
    marginBottom: 10,
    transition: "opacity 0.2s",
  },
  recTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recName: {
    fontSize: 14,
    fontWeight: 500,
    color: "#F0F4FF",
    marginBottom: 3,
  },
  recMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },
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
    transition: "all 0.15s",
  },
  toggleBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 12,
    cursor: "pointer",
    marginLeft: 6,
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
  spinner: {
    width: 28,
    height: 28,
    border: "2px solid rgba(99,179,255,0.15)",
    borderTopColor: "#63B3FF",
    borderRadius: "50%",
    margin: "32px auto",
    animation: "spin 0.8s linear infinite",
  },
  confirmOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  confirmBox: {
    background: "#0D1117",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 14,
    padding: "28px 32px",
    width: 340,
    textAlign: "center",
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

// Returns true if nextRunDate is in the past → transaction is overdue
function isDue(nextRunDate) {
  return new Date(nextRunDate) <= new Date();
}

// Formats a LocalDateTime string to a readable date
function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Main component ─────────────────────────────────────────────────────────
export default function RecurringPage({ showToast, onRefresh }) {
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [adding, setAdding] = useState(false);
  const [running, setRunning] = useState({}); // { [id]: true } while API call in flight
  const [confirmId, setConfirmId] = useState(null); // id waiting for delete confirm

  // ── Fetch recurring transactions from backend on mount ───────────────────
  useEffect(() => {
    fetchItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItems = async () => {
    setLoadingList(true);
    try {
      const res = await recurringAPI.getAll();
      setItems(res.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        showToast("Failed to load recurring transactions", "error");
      }
    } finally {
      setLoadingList(false);
    }
  };

  // ── Add new recurring transaction ─────────────────────────────────────────
  // Sends to POST /api/recurring — backend saves to MongoDB
  const handleAdd = async () => {
    if (!form.description.trim()) {
      showToast("Description is required", "error");
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    if (!form.category) {
      showToast("Select a category", "error");
      return;
    }

    setAdding(true);
    try {
      await recurringAPI.create({
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category,
        division: form.division,
        frequency: form.frequency,
        // startDate: when the first run should happen.
        // Set to now so it shows as "due" immediately for testing.
        // In production you might let the user pick a future date.
        startDate: new Date().toISOString(),
      });
      showToast("Recurring transaction added");
      setForm(defaultForm);
      fetchItems();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to add recurring transaction",
        "error",
      );
    } finally {
      setAdding(false);
    }
  };

  // ── Run now — manually trigger one occurrence ─────────────────────────────
  // Calls POST /api/recurring/:id/run
  // Backend creates the actual Transaction and advances nextRunDate
  const handleRun = async (item) => {
    setRunning((r) => ({ ...r, [item.id]: true }));
    try {
      await recurringAPI.runNow(item.id);
      showToast(`"${item.description}" transaction created successfully`);
      fetchItems(); // refresh list to show updated nextRunDate
      onRefresh(); // refresh dashboard totals
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to run transaction",
        "error",
      );
    } finally {
      setRunning((r) => ({ ...r, [item.id]: false }));
    }
  };

  // ── Toggle active/paused ──────────────────────────────────────────────────
  // Calls PATCH /api/recurring/:id/toggle
  // Backend flips the `active` boolean and saves
  const handleToggle = async (id) => {
    try {
      await recurringAPI.toggle(id);
      // Update local state immediately for snappy UI
      // then fetchItems() syncs with backend truth
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, active: !i.active } : i)),
      );
    } catch (err) {
      showToast("Failed to update", "error");
      fetchItems(); // re-sync on failure
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!confirmId) return;
    try {
      await recurringAPI.delete(confirmId);
      showToast("Recurring transaction removed");
      setConfirmId(null);
      fetchItems();
    } catch (err) {
      showToast("Failed to delete", "error");
      setConfirmId(null);
    }
  };

  // ── Update form when type changes — reset category ────────────────────────
  const handleTypeChange = (type) => {
    setForm({ ...form, type, category: "" });
  };

  const categories = form.type === "INCOME" ? INCOME_CATS : EXPENSE_CATS;

  // ── Count stats for header ─────────────────────────────────────────────────
  const activeCount = items.filter((i) => i.active).length;
  const dueCount = items.filter((i) => i.active && isDue(i.nextRunDate)).length;

  return (
    <div style={S.page}>
      {/* ── Page header ── */}
      <h1 style={S.title}>Recurring Transactions</h1>
      <p style={S.sub}>
        Automate salary, rent, EMI and more — backend runs them automatically at
        midnight
      </p>

      {/* ── Due banner ── */}
      {dueCount > 0 && (
        <div
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 12,
            padding: "12px 18px",
            marginBottom: 24,
            fontSize: 13,
            color: "#F59E0B",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 16 }}>⚠</span>
          <span>
            <strong>{dueCount}</strong> recurring transaction
            {dueCount > 1 ? "s are" : " is"} due now. Click "Run now" or wait
            for the midnight auto-run.
          </span>
        </div>
      )}

      
        <div className="recurring-grid">
        {/* ════════════════════════════════════════
            LEFT — Add form
        ════════════════════════════════════════ */}
        <div style={S.card}>
          <div style={S.cardTitle}>New recurring transaction</div>

          {/* Income / Expense tab */}
          <div style={S.tabRow}>
            {["INCOME", "EXPENSE"].map((t) => (
              <button
                key={t}
                style={S.tab(
                  form.type === t,
                  t === "INCOME" ? "#10B981" : "#EF4444",
                )}
                onClick={() => handleTypeChange(t)}
              >
                {t === "INCOME" ? "💰 Income" : "💸 Expense"}
              </button>
            ))}
          </div>

          {/* Description */}
          <label style={S.label}>Description</label>
          <input
            style={S.input}
            placeholder="e.g. Monthly Salary, House Rent"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />

          {/* Amount */}
          <label style={S.label}>Amount (₹)</label>
          <input
            style={S.input}
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            min="0"
            step="0.01"
          />

          {/* Category */}
          <label style={S.label}>Category</label>
          <select
            style={S.select}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          {/* Division */}
          <label style={S.label}>Division</label>
          <select
            style={S.select}
            value={form.division}
            onChange={(e) => setForm({ ...form, division: e.target.value })}
          >
            <option value="PERSONAL">Personal</option>
            <option value="OFFICE">Office</option>
          </select>

          {/* Frequency */}
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

          {/* Submit */}
          <button
            style={{ ...S.addBtn, opacity: adding ? 0.6 : 1 }}
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? "Adding…" : "+ Add Recurring Transaction"}
          </button>

          {/* Info box */}
          <div
            style={{
              marginTop: 16,
              background: "rgba(99,179,255,0.07)",
              border: "1px solid rgba(99,179,255,0.15)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.6,
            }}
          >
            ℹ The backend automatically creates transactions at midnight based
            on frequency. You can also click "Run now" to trigger one manually.
          </div>
        </div>

        {/* ════════════════════════════════════════
            RIGHT — Recurring list
        ════════════════════════════════════════ */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            {loadingList
              ? "Loading…"
              : `${activeCount} active · ${items.length} total`}
          </div>

          {/* Loading state */}
          {loadingList ? (
            <div style={S.spinner} />
          ) : items.length === 0 ? (
            /* Empty state */
            <div style={S.emptyState}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>↺</div>
              <p style={{ fontSize: 14 }}>No recurring transactions yet</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>
                Add one using the form on the left
              </p>
            </div>
          ) : (
            /* List */
            <div style={{ maxHeight: 560, overflowY: "auto", paddingRight: 4 }}>
              {items.map((item) => {
                const due = isDue(item.nextRunDate) && item.active;
                return (
                  <div
                    key={item.id}
                    style={{ ...S.recItem, opacity: item.active ? 1 : 0.5 }}
                  >
                    {/* Top row — name + badges */}
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
                          gap: 5,
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
                        {!item.active && (
                          <span style={S.badge("rgba(255,255,255,0.3)")}>
                            Paused
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date info */}
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.25)",
                        marginBottom: 12,
                        lineHeight: 1.7,
                      }}
                    >
                      <div>
                        Next run:{" "}
                        <span
                          style={{
                            color: due ? "#F59E0B" : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {fmtDate(item.nextRunDate)}
                        </span>
                      </div>
                      {item.lastRunDate && (
                        <div>Last ran: {fmtDate(item.lastRunDate)}</div>
                      )}
                      {!item.lastRunDate && (
                        <div style={{ color: "rgba(255,255,255,0.2)" }}>
                          Never run yet
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0,
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Run now — only show if active */}
                      {item.active && (
                        <button
                          style={S.runBtn}
                          onClick={() => handleRun(item)}
                          disabled={running[item.id]}
                        >
                          {running[item.id] ? "Running…" : "▶ Run now"}
                        </button>
                      )}

                      {/* Pause / Resume */}
                      <button
                        style={S.toggleBtn}
                        onClick={() => handleToggle(item.id)}
                      >
                        {item.active ? "Pause" : "Resume"}
                      </button>

                      {/* Delete */}
                      <button
                        style={S.delBtn}
                        onClick={() => setConfirmId(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          Delete confirmation modal
      ════════════════════════════════════════ */}
      {confirmId && (
        <div style={S.confirmOverlay}>
          <div style={S.confirmBox}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
            <h3
              style={{
                color: "#F0F4FF",
                fontWeight: 500,
                marginBottom: 8,
                fontSize: 16,
              }}
            >
              Remove recurring transaction?
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              This stops future automatic runs. Past transactions are not
              affected.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmId(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#EF4444",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
