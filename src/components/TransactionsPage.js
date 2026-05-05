import React, { useState, useMemo } from "react";
import { formatCurrency, formatDateTime } from "../utils/helpers";
import { exportToCSV } from "../utils/export";

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
const DIV_COLORS = { OFFICE: "#8B5CF6", PERSONAL: "#3B82F6" };

function cap(str) {
  if (!str) return "";
  return str.charAt(0) + str.slice(1).toLowerCase();
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
  sub: { fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 28 },
  toolbar: {
    display: "flex",
    gap: 10,
    marginBottom: 18,
    flexWrap: "wrap",
    alignItems: "center",
  },
  search: {
    flex: 1,
    minWidth: 180,
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#E8EDF5",
    fontSize: 13,
    outline: "none",
  },
  select: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    outline: "none",
    cursor: "pointer",
  },
  exportBtn: {
    background: "rgba(99,179,255,0.1)",
    border: "1px solid rgba(99,179,255,0.25)",
    color: "#63B3FF",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 500,
  },
  clearBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.45)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 12,
    cursor: "pointer",
  },
  tableWrap: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: 10,
    fontWeight: 500,
    color: "rgba(255,255,255,0.28)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.02)",
  },
  tr: (i) => ({
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
  }),
  td: {
    padding: "13px 16px",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    verticalAlign: "middle",
  },
  badge: (color) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500,
    background: color + "22",
    color,
    border: `1px solid ${color}33`,
  }),
  actionBtn: (color) => ({
    background: "none",
    border: "none",
    color,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 15,
    transition: "background 0.15s",
  }),
  overlay: {
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

const CATEGORIES = [
  "FUEL",
  "FOOD",
  "MOVIE",
  "LOAN",
  "MEDICAL",
  "SALARY",
  "FREELANCE",
  "INVESTMENT",
  "OTHER",
];

export default function TransactionsPage({ transactions, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDiv, setFilterDiv] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  // ── Client-side filter — runs only when dependencies change ───────────────
  // useMemo prevents re-filtering on unrelated re-renders
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        !search || t.description?.toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || t.type === filterType;
      const matchDiv = !filterDiv || t.division === filterDiv;
      const matchCat = !filterCat || t.category === filterCat;
      return matchSearch && matchType && matchDiv && matchCat;
    });
  }, [transactions, search, filterType, filterDiv, filterCat]);

  const hasFilters = search || filterType || filterDiv || filterCat;

  const handleConfirmDelete = async () => {
    if (!confirmId) return;
    await onDelete(confirmId);
    setConfirmId(null);
  };

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 6,
        }}
      >
        <h1 style={S.title}>Transactions</h1>
        <button
          style={S.exportBtn}
          onClick={() => exportToCSV(filtered, "transactions")}
        >
          ↓ Export CSV
        </button>
      </div>
      <p style={S.sub}>
        {filtered.length} of {transactions.length} records
      </p>

      {/* ── Toolbar: search + filters ── */}
      <div style={S.toolbar}>
        <input
          style={S.search}
          placeholder="Search by description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={S.select}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <select
          style={S.select}
          value={filterDiv}
          onChange={(e) => setFilterDiv(e.target.value)}
        >
          <option value="">All divisions</option>
          <option value="PERSONAL">Personal</option>
          <option value="OFFICE">Office</option>
        </select>
        <select
          style={S.select}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {cap(c)}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            style={S.clearBtn}
            onClick={() => {
              setSearch("");
              setFilterType("");
              setFilterDiv("");
              setFilterCat("");
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      // REPLACE WITH:
        <div style={S.tableWrap} className="table-scroll-wrap">
        <table style={S.table}>
          <thead>
            <tr>
              {[
                "Date & Time",
                "Description",
                "Category",
                "Division",
                "Type",
                "Amount",
                "Actions",
              ].map((h) => (
                <th key={h} style={S.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    ...S.td,
                    textAlign: "center",
                    padding: "48px 0",
                    color: "rgba(255,255,255,0.2)",
                  }}
                >
                  {hasFilters
                    ? "No transactions match your filters"
                    : "No transactions yet"}
                </td>
              </tr>
            ) : (
              filtered.map((t, i) => (
                <tr key={t.id} style={S.tr(i)}>
                  <td style={S.td}>{formatDateTime(t.date)}</td>
                  <td style={{ ...S.td, maxWidth: 200 }}>
                    <span
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.description}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={S.badge(CAT_COLORS[t.category] || "#6B7280")}>
                      {cap(t.category)}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={S.badge(DIV_COLORS[t.division] || "#6B7280")}>
                      {cap(t.division)}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span
                      style={S.badge(
                        t.type === "INCOME" ? "#10B981" : "#EF4444",
                      )}
                    >
                      {cap(t.type)}
                    </span>
                  </td>
                  <td
                    style={{
                      ...S.td,
                      fontWeight: 600,
                      textAlign: "right",
                      color: t.type === "INCOME" ? "#10B981" : "#EF4444",
                    }}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </td>
                  <td style={S.td}>
                    <button
                      style={S.actionBtn("rgba(99,179,255,0.7)")}
                      onClick={() => onEdit(t)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      style={S.actionBtn("rgba(239,68,68,0.7)")}
                      onClick={() => setConfirmId(t.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Delete confirm modal ── */}
      {confirmId && (
        <div style={S.overlay}>
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
              Delete this transaction?
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              This action cannot be undone.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
