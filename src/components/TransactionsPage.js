import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { formatCurrency, formatDateTime } from "../utils/helpers";
import { exportToCSV } from "../utils/export";

// ── colour maps ────────────────────────────────────────────────────────────
const CAT_COLORS = {
  FUEL: "#F59E0B", MOVIE: "#8B5CF6", FOOD: "#F97316",
  LOAN: "#EF4444", MEDICAL: "#EC4899", SALARY: "#10B981",
  FREELANCE: "#3B82F6", INVESTMENT: "#6366F1", OTHER: "#6B7280",
};
const DIV_COLORS = { OFFICE: "#8B5CF6", PERSONAL: "#3B82F6" };

function cap(str) {
  if (!str) return "";
  return str.charAt(0) + str.slice(1).toLowerCase();
}

// ── page size for infinite scroll ─────────────────────────────────────────
const PAGE_SIZE = 25;

// ── Style tokens (dark theme, matches rest of app) ─────────────────────────
const S = {
  page:  { padding: "36px 40px", minHeight: "100vh", color: "#E8EDF5" },
  title: { fontSize: 26, fontWeight: 600, color: "#F0F4FF", margin: "0 0 4px", letterSpacing: "-0.5px" },
  sub:   { fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 28 },

  // ── toolbar ──
  toolbar: { display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" },
  search:  {
    flex: 1, minWidth: 180,
    background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 14px",
    color: "#E8EDF5", fontSize: 13, outline: "none",
  },
  select: {
    background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 12px",
    color: "rgba(255,255,255,0.6)", fontSize: 13, outline: "none", cursor: "pointer",
  },
  dateInput: {
    background: "#0D1117", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 12px",
    color: "rgba(255,255,255,0.6)", fontSize: 13, outline: "none",
    colorScheme: "dark",
  },
  exportBtn: {
    background: "rgba(99,179,255,0.1)", border: "1px solid rgba(99,179,255,0.25)",
    color: "#63B3FF", borderRadius: 10, padding: "10px 16px",
    fontSize: 12, cursor: "pointer", fontWeight: 500,
  },
  clearBtn: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.45)", borderRadius: 10,
    padding: "10px 14px", fontSize: 12, cursor: "pointer",
  },

  // ── date range row ──
  dateRow: {
    display: "flex", gap: 10, marginBottom: 14,
    flexWrap: "wrap", alignItems: "center",
  },
  dateLabel: {
    fontSize: 11, color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase", letterSpacing: "0.07em",
    alignSelf: "center",
  },
  quickBtn: (active) => ({
    padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500,
    cursor: "pointer", transition: "all 0.15s",
    background: active ? "rgba(99,179,255,0.15)" : "rgba(255,255,255,0.04)",
    border: active ? "1px solid rgba(99,179,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
    color: active ? "#63B3FF" : "rgba(255,255,255,0.4)",
  }),

  // ── table ──
  tableWrap: {
    background: "#0D1117", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 16px", textAlign: "left",
    fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.28)",
    textTransform: "uppercase", letterSpacing: "0.07em",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.02)",
  },
  tr: (i) => ({
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
  }),
  td: { padding: "12px 16px", fontSize: 13, color: "rgba(255,255,255,0.7)", verticalAlign: "middle" },
  badge: (color) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 500,
    background: color + "22", color, border: `1px solid ${color}33`,
  }),
  actionBtn: (color) => ({
    background: "none", border: "none", color,
    cursor: "pointer", padding: "4px 8px", borderRadius: 6,
    fontSize: 15, transition: "background 0.15s",
  }),

  // ── account chip ──
  accChip: (color) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "2px 9px", borderRadius: 20, fontSize: 11,
    background: color + "15", color, border: `1px solid ${color}28`,
  }),
  accDot: (color) => ({
    width: 5, height: 5, borderRadius: "50%",
    background: color, flexShrink: 0,
  }),

  // ── confirm modal ──
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
  confirmBox: { background: "#0D1117", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "28px 32px", width: 340, textAlign: "center" },

  // ── sentinel / loader ──
  sentinel: { height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 12 },
};

// account accent colours cycling list (matches Dashboard/Sidebar)
const ACCOUNT_ACCENTS = ["#63B3FF","#10B981","#8B5CF6","#F59E0B","#EC4899","#6366F1"];

// ── quick date range presets ───────────────────────────────────────────────
function getPresetRange(preset) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today": {
      const s = today.toISOString().slice(0,10);
      return { start: s, end: s };
    }
    case "week": {
      const s = new Date(today); s.setDate(today.getDate() - 6);
      return { start: s.toISOString().slice(0,10), end: today.toISOString().slice(0,10) };
    }
    case "month": {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: s.toISOString().slice(0,10), end: today.toISOString().slice(0,10) };
    }
    case "year": {
      const s = new Date(today.getFullYear(), 0, 1);
      return { start: s.toISOString().slice(0,10), end: today.toISOString().slice(0,10) };
    }
    default: return { start: "", end: "" };
  }
}

export default function TransactionsPage({ transactions, accounts = [], onEdit, onDelete }) {
  // ── filter state ───────────────────────────────────────────────────────
  const [search,      setSearch]      = useState("");
  const [filterType,  setFilterType]  = useState("");
  const [filterDiv,   setFilterDiv]   = useState("");
  const [filterCat,   setFilterCat]   = useState("");
  const [filterAcct,  setFilterAcct]  = useState("");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [activePreset,setActivePreset]= useState(""); // "today"|"week"|"month"|"year"|""

  // ── pagination state ───────────────────────────────────────────────────
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ── confirm delete ─────────────────────────────────────────────────────
  const [confirmId, setConfirmId] = useState(null);

  // ── sentinel ref for IntersectionObserver ─────────────────────────────
  const sentinelRef = useRef(null);

  // ── build account lookup map { id → { name, color } } ─────────────────
  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach((acc, i) => {
      map[acc.id] = { name: acc.name, color: ACCOUNT_ACCENTS[i % ACCOUNT_ACCENTS.length] };
    });
    return map;
  }, [accounts]);

  // ── unique categories from actual transactions (not hardcoded list) ────
  const availableCategories = useMemo(() => {
    const set = new Set(transactions.map(t => t.category).filter(Boolean));
    return [...set].sort();
  }, [transactions]);

  // ── filtered transactions (all, not paged) ────────────────────────────
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (search     && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && t.type     !== filterType) return false;
      if (filterDiv  && t.division !== filterDiv)  return false;
      if (filterCat  && t.category !== filterCat)  return false;
      if (filterAcct && t.accountId !== filterAcct) return false;
      if (startDate) {
        const tDate = new Date(t.date); tDate.setHours(0,0,0,0);
        const s     = new Date(startDate);
        if (tDate < s) return false;
      }
      if (endDate) {
        const tDate = new Date(t.date); tDate.setHours(23,59,59,999);
        const e     = new Date(endDate); e.setHours(23,59,59,999);
        if (tDate > e) return false;
      }
      return true;
    });
  }, [transactions, search, filterType, filterDiv, filterCat, filterAcct, startDate, endDate]);

  // ── paged slice ───────────────────────────────────────────────────────
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  // reset page when filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, filterType, filterDiv, filterCat, filterAcct, startDate, endDate]);

  // ── IntersectionObserver for infinite scroll ──────────────────────────
  const loadMore = useCallback(() => {
    setVisibleCount(c => Math.min(c + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore) loadMore(); },
      { rootMargin: "120px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  // ── quick preset handler ───────────────────────────────────────────────
  const applyPreset = (preset) => {
    if (activePreset === preset) {
      // toggle off
      setActivePreset("");
      setStartDate("");
      setEndDate("");
    } else {
      const range = getPresetRange(preset);
      setActivePreset(preset);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  // ── clear date preset when manual date input changes ──────────────────
  const handleStartDate = (v) => { setStartDate(v); setActivePreset(""); };
  const handleEndDate   = (v) => { setEndDate(v);   setActivePreset(""); };

  // ── clear all ─────────────────────────────────────────────────────────
  const clearAll = () => {
    setSearch(""); setFilterType(""); setFilterDiv("");
    setFilterCat(""); setFilterAcct("");
    setStartDate(""); setEndDate(""); setActivePreset("");
  };

  const hasFilters = search || filterType || filterDiv || filterCat || filterAcct || startDate || endDate;

  const handleConfirmDelete = async () => {
    if (!confirmId) return;
    await onDelete(confirmId);
    setConfirmId(null);
  };

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <h1 style={S.title}>Transactions</h1>
        <button style={S.exportBtn} onClick={() => exportToCSV(filtered, "transactions")}>
          ↓ Export CSV ({filtered.length})
        </button>
      </div>
      <p style={S.sub}>
        {filtered.length === transactions.length
          ? `${transactions.length} total records`
          : `${filtered.length} of ${transactions.length} records`}
        {hasMore && ` · showing first ${visible.length}`}
      </p>

      {/* ── Main filters row ── */}
      <div style={S.toolbar}>
        <input
          style={S.search}
          placeholder="Search by description…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={S.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <select style={S.select} value={filterDiv} onChange={e => setFilterDiv(e.target.value)}>
          <option value="">All divisions</option>
          <option value="PERSONAL">Personal</option>
          <option value="OFFICE">Office</option>
        </select>
        <select style={S.select} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {availableCategories.map(c => (
            <option key={c} value={c}>{cap(c)}</option>
          ))}
        </select>
        {accounts.length > 0 && (
          <select style={S.select} value={filterAcct} onChange={e => setFilterAcct(e.target.value)}>
            <option value="">All accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        )}
        {hasFilters && <button style={S.clearBtn} onClick={clearAll}>Clear all</button>}
      </div>

      {/* ── Date range row ── */}
      <div style={S.dateRow}>
        <span style={S.dateLabel}>Date:</span>

        {/* Quick presets */}
        {["today","week","month","year"].map(p => (
          <button key={p} style={S.quickBtn(activePreset === p)} onClick={() => applyPreset(p)}>
            {p === "today" ? "Today" : p === "week" ? "Last 7d" : p === "month" ? "This month" : "This year"}
          </button>
        ))}

        {/* Manual date inputs */}
        <input
          type="date" style={S.dateInput}
          value={startDate}
          max={endDate || undefined}
          onChange={e => handleStartDate(e.target.value)}
        />
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>→</span>
        <input
          type="date" style={S.dateInput}
          value={endDate}
          min={startDate || undefined}
          onChange={e => handleEndDate(e.target.value)}
        />

        {(startDate || endDate) && (
          <button style={S.clearBtn} onClick={() => { setStartDate(""); setEndDate(""); setActivePreset(""); }}>
            Clear dates
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={S.tableWrap} className="table-scroll-wrap">
        <table style={S.table}>
          <thead>
            <tr>
              {["Date & Time","Description","Account","Category","Sub","Division","Type","Amount","Actions"].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ ...S.td, textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.2)" }}>
                  {hasFilters ? "No transactions match your filters" : "No transactions yet"}
                </td>
              </tr>
            ) : (
              visible.map((t, i) => {
                const acct  = accountMap[t.accountId];
                return (
                  <tr key={t.id} style={S.tr(i)}>

                    {/* Date */}
                    <td style={{ ...S.td, whiteSpace: "nowrap", fontSize: 12 }}>
                      {formatDateTime(t.date)}
                    </td>

                    {/* Description */}
                    <td style={{ ...S.td, maxWidth: 180 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.description}
                      </span>
                    </td>

                    {/* Account — NEW COLUMN */}
                    <td style={S.td}>
                      {acct ? (
                        <span style={S.accChip(acct.color)}>
                          <span style={S.accDot(acct.color)} />
                          {acct.name}
                        </span>
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>—</span>
                      )}
                    </td>

                    {/* Category */}
                    <td style={S.td}>
                      <span style={S.badge(CAT_COLORS[t.category] || "#6B7280")}>
                        {cap(t.category)}
                      </span>
                    </td>

                    {/* Sub-category */}
                    <td style={S.td}>
                      {t.subCategory ? (
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                          {t.subCategory}
                        </span>
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>—</span>
                      )}
                    </td>

                    {/* Division */}
                    <td style={S.td}>
                      <span style={S.badge(DIV_COLORS[t.division] || "#6B7280")}>
                        {cap(t.division)}
                      </span>
                    </td>

                    {/* Type */}
                    <td style={S.td}>
                      <span style={S.badge(t.type === "INCOME" ? "#10B981" : "#EF4444")}>
                        {cap(t.type)}
                      </span>
                    </td>

                    {/* Amount */}
                    <td style={{ ...S.td, fontWeight: 600, textAlign: "right", whiteSpace: "nowrap", color: t.type === "INCOME" ? "#10B981" : "#EF4444" }}>
                      {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                    </td>

                    {/* Actions */}
                    <td style={S.td}>
                      <button style={S.actionBtn("rgba(99,179,255,0.7)")} onClick={() => onEdit(t)} title="Edit">✎</button>
                      <button style={S.actionBtn("rgba(239,68,68,0.7)")} onClick={() => setConfirmId(t.id)} title="Delete">✕</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ── Infinite scroll sentinel ── */}
        <div ref={sentinelRef} style={S.sentinel}>
          {hasMore
            ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 14, height: 14, border: "2px solid rgba(99,179,255,0.2)", borderTopColor: "#63B3FF", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Loading more…
              </span>
            : visible.length > 0 && filtered.length > PAGE_SIZE
              ? <span>All {filtered.length} records shown</span>
              : null
          }
        </div>
      </div>

      {/* ── Delete confirm modal ── */}
      {confirmId && (
        <div style={S.overlay}>
          <div style={S.confirmBox}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
            <h3 style={{ color: "#F0F4FF", fontWeight: 500, marginBottom: 8, fontSize: 16 }}>
              Delete this transaction?
            </h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmId(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={handleConfirmDelete} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}