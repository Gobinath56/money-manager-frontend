import React, { useState, useMemo, useEffect, useCallback } from "react";
import { formatCurrency, formatDateTime } from "../utils/helpers";
import { exportToCSV } from "../utils/export";
import { categoryAPI, transactionAPI } from "../services/api";

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

function fmtShortDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function fmtDateRange(startDate, endDate, count) {
  if (!startDate && !endDate) return `Export all ${count} records`;
  if (startDate && endDate)
    return `Export ${count} records (${startDate} → ${endDate})`;
  if (startDate) return `Export ${count} records (from ${startDate})`;
  return `Export ${count} records (until ${endDate})`;
}

const ACCOUNT_ACCENTS = [
  "#63B3FF",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#6366F1",
];

function getPresetRange(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case "today": {
      const s = today.toISOString().slice(0, 10);
      return { start: s, end: s };
    }
    case "week": {
      const s = new Date(today);
      s.setDate(today.getDate() - 6);
      return {
        start: s.toISOString().slice(0, 10),
        end: today.toISOString().slice(0, 10),
      };
    }
    case "month": {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: s.toISOString().slice(0, 10),
        end: today.toISOString().slice(0, 10),
      };
    }
    case "year": {
      const s = new Date(today.getFullYear(), 0, 1);
      return {
        start: s.toISOString().slice(0, 10),
        end: today.toISOString().slice(0, 10),
      };
    }
    default:
      return { start: "", end: "" };
  }
}

const S = {
  title: {
    fontSize: 26,
    fontWeight: 600,
    color: "#F0F4FF",
    margin: "0 0 4px",
    letterSpacing: "-0.5px",
  },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 28 },
  exportBtn: {
    background: "rgba(99,179,255,0.1)",
    border: "1px solid rgba(99,179,255,0.25)",
    color: "#63B3FF",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 500,
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  // FIX #17 — search no longer has display:none on mobile.
  // Previously the toolbar used col-desktop to hide selects on mobile,
  // but search was also getting hidden because it was inside the same
  // flex container that collapsed. Now search is pulled into its own
  // always-visible row above the collapsible filter row.
  search: {
    width: "100%",
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#E8EDF5",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
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
    fontFamily: "inherit",
  },
  dateInput: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "10px 12px",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    outline: "none",
    colorScheme: "dark",
    fontFamily: "inherit",
  },
  clearBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.45)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  dateRow: {
    display: "flex",
    gap: 10,
    marginBottom: 14,
    flexWrap: "wrap",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    alignSelf: "center",
  },
  quickBtn: (active) => ({
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
    background: active ? "rgba(99,179,255,0.15)" : "rgba(255,255,255,0.04)",
    border: active
      ? "1px solid rgba(99,179,255,0.3)"
      : "1px solid rgba(255,255,255,0.08)",
    color: active ? "#63B3FF" : "rgba(255,255,255,0.4)",
  }),
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
    padding: "12px 16px",
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
    fontFamily: "inherit",
  }),
  accChip: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "2px 9px",
    borderRadius: 20,
    fontSize: 11,
    background: color + "15",
    color,
    border: `1px solid ${color}28`,
  }),
  accDot: (color) => ({
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
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
  paginationBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.01)",
    flexWrap: "wrap",
    gap: 10,
  },
  pageBtn: (active, disabled) => ({
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    background: active ? "rgba(99,179,255,0.15)" : "rgba(255,255,255,0.04)",
    border: active
      ? "1px solid rgba(99,179,255,0.3)"
      : "1px solid rgba(255,255,255,0.08)",
    color: disabled
      ? "rgba(255,255,255,0.15)"
      : active
        ? "#63B3FF"
        : "rgba(255,255,255,0.5)",
    transition: "all 0.15s",
    minWidth: 36,
    textAlign: "center",
  }),
  pageSizeSelect: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "6px 10px",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

export default function TransactionsPage({
  transactions,
  accounts = [],
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDiv, setFilterDiv] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterAcct, setFilterAcct] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [confirmId, setConfirmId] = useState(null);

  // FIX #5 — paged data from API
  const [pagedData, setPagedData] = useState(null); // Page<Transaction> from backend
  const [pagedLoading, setPagedLoading] = useState(false);

  const [allCategories, setAllCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // ── Are any filters active that need client-side filtering? ─────────────
  // When no filters are set, we use the fast paged API.
  // When filters are set, we fall back to the full transactions prop
  // (already loaded for dashboard) and filter client-side.
  // This avoids building a complex server-side filter+paginate endpoint.
  const hasFilters = !!(
    search ||
    filterType ||
    filterDiv ||
    filterCat ||
    filterAcct ||
    startDate ||
    endDate
  );

  // ── Fetch one page from backend (only when no filters active) ───────────
  const fetchPage = useCallback(
    async (page, size) => {
      if (hasFilters) return; // filters active — use client-side path
      setPagedLoading(true);
      try {
        const res = await transactionAPI.getPagedTransactions(page - 1, size);
        setPagedData(res.data);
      } catch {
        setPagedData(null); // fallback to client-side
      } finally {
        setPagedLoading(false);
      }
    },
    [hasFilters],
  ); // eslint-disable-line

  useEffect(() => {
    if (!hasFilters) {
      fetchPage(currentPage, pageSize);
    }
  }, [currentPage, pageSize, hasFilters]); // eslint-disable-line

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    filterType,
    filterDiv,
    filterCat,
    filterAcct,
    startDate,
    endDate,
    pageSize,
  ]);

  const fetchAllCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const res = await categoryAPI.getAll();
      setAllCategories(res.data || []);
    } catch {
      setAllCategories([]);
    } finally {
      setLoadingCats(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  const filterCategoryOptions = useMemo(() => {
    if (allCategories.length > 0)
      return allCategories.map((c) => c.name).sort();
    const set = new Set(transactions.map((t) => t.category).filter(Boolean));
    return [...set].sort();
  }, [allCategories, transactions]);

  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach((acc, i) => {
      map[acc.id] = {
        name: acc.name,
        color: ACCOUNT_ACCENTS[i % ACCOUNT_ACCENTS.length],
      };
    });
    return map;
  }, [accounts]);

  // ── Client-side filtered list (used when filters are active) ────────────
  const filtered = useMemo(() => {
    if (!hasFilters) return transactions; // not used in paged mode
    return transactions.filter((t) => {
      if (
        search &&
        !t.description?.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (filterType && t.type !== filterType) return false;
      if (filterDiv && t.division !== filterDiv) return false;
      if (filterCat && t.category !== filterCat) return false;
      if (filterAcct && t.accountId !== filterAcct) return false;
      if (startDate) {
        const tDate = new Date(t.date);
        tDate.setHours(0, 0, 0, 0);
        if (tDate < new Date(startDate)) return false;
      }
      if (endDate) {
        const tDate = new Date(t.date);
        tDate.setHours(23, 59, 59, 999);
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (tDate > e) return false;
      }
      return true;
    });
  }, [
    transactions,
    search,
    filterType,
    filterDiv,
    filterCat,
    filterAcct,
    startDate,
    endDate,
    hasFilters,
  ]);

  // Client-side pagination (used when filters active)
  const clientTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clientSafePage = Math.min(currentPage, clientTotalPages);
  const clientPageSlice = useMemo(() => {
    const start = (clientSafePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, clientSafePage, pageSize]);

  // ── Decide which data source to use ─────────────────────────────────────
  const pageSlice = hasFilters ? clientPageSlice : pagedData?.content || [];
  const totalPages = hasFilters ? clientTotalPages : pagedData?.totalPages || 1;
  const totalRecords = hasFilters
    ? filtered.length
    : pagedData?.totalElements || transactions.length;
  const safePage = hasFilters ? clientSafePage : currentPage;
  const startRecord = (safePage - 1) * pageSize + 1;
  const endRecord = Math.min(safePage * pageSize, totalRecords);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (safePage > 3) pages.push("...");
    for (
      let p = Math.max(2, safePage - 1);
      p <= Math.min(totalPages - 1, safePage + 1);
      p++
    ) {
      pages.push(p);
    }
    if (safePage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  const applyPreset = (preset) => {
    if (activePreset === preset) {
      setActivePreset("");
      setStartDate("");
      setEndDate("");
    } else {
      const r = getPresetRange(preset);
      setActivePreset(preset);
      setStartDate(r.start);
      setEndDate(r.end);
    }
  };

  const clearAll = () => {
    setSearch("");
    setFilterType("");
    setFilterDiv("");
    setFilterCat("");
    setFilterAcct("");
    setStartDate("");
    setEndDate("");
    setActivePreset("");
  };

  const handleConfirmDelete = async () => {
    if (!confirmId) return;
    await onDelete(confirmId);
    setConfirmId(null);
    if (!hasFilters) fetchPage(currentPage, pageSize);
  };

  const exportLabel = fmtDateRange(startDate, endDate, totalRecords);

  return (
    <div className="txn-page-wrap">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 6,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h1 style={S.title}>Transactions</h1>
        <button
          style={S.exportBtn}
          onClick={() => {
            const data = hasFilters
              ? filtered
              : pagedData?.content || transactions;
            if (!data.length) {
              alert("No transactions to export");
              return;
            }
            exportToCSV(
              data,
              startDate || endDate
                ? `transactions-${startDate || "start"}-to-${endDate || "end"}`
                : "transactions-all",
            );
          }}
        >
          ↓ {exportLabel}
        </button>
      </div>

      <p style={S.sub}>
        {totalRecords === transactions.length
          ? `${transactions.length} total records`
          : `${totalRecords} of ${transactions.length} records`}
        {totalRecords > 0 && ` · showing ${startRecord}–${endRecord}`}
        {/* FIX #5 — show server-paged indicator when no filters active */}
        {!hasFilters && pagedData && (
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              color: "rgba(99,179,255,0.5)",
            }}
          >
            · server paged
          </span>
        )}
      </p>

      {/* ── FIX #17 — Search is now in its own full-width row ─────────────
          Previously search was inside the same flex row as the selects.
          On mobile that row was hidden with col-desktop, which also hid
          the search input even though it was never supposed to be hidden.
          Now search lives above the filter row and is always visible.    */}
      <div style={{ marginBottom: 10 }}>
        <input
          style={S.search}
          placeholder="🔍  Search by description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter row — desktop selects (hidden on mobile via CSS) */}
      <div
        className="filter-row"
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
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
          disabled={loadingCats}
        >
          <option value="">
            {loadingCats ? "Loading…" : "All categories"}
          </option>
          {filterCategoryOptions.map((name) => (
            <option key={name} value={name}>
              {cap(name)}
            </option>
          ))}
        </select>
        {accounts.length > 0 && (
          <select
            style={S.select}
            value={filterAcct}
            onChange={(e) => setFilterAcct(e.target.value)}
          >
            <option value="">All accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        )}
        {hasFilters && (
          <button style={S.clearBtn} onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>

      {/* Date range */}
      <div style={S.dateRow}>
        <span style={S.dateLabel}>Date:</span>
        {["today", "week", "month", "year"].map((p) => (
          <button
            key={p}
            style={S.quickBtn(activePreset === p)}
            onClick={() => applyPreset(p)}
          >
            {p === "today"
              ? "Today"
              : p === "week"
                ? "Last 7d"
                : p === "month"
                  ? "This month"
                  : "This year"}
          </button>
        ))}
        <input
          type="date"
          style={S.dateInput}
          value={startDate}
          max={endDate || undefined}
          onChange={(e) => {
            setStartDate(e.target.value);
            setActivePreset("");
          }}
        />
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>→</span>
        <input
          type="date"
          style={S.dateInput}
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => {
            setEndDate(e.target.value);
            setActivePreset("");
          }}
        />
        {(startDate || endDate) && (
          <button
            style={S.clearBtn}
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setActivePreset("");
            }}
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Table */}
      <div style={S.tableWrap} className="table-scroll-wrap">
        {pagedLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px 0",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                border: "2px solid rgba(99,179,255,0.15)",
                borderTopColor: "#63B3FF",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th} className="col-date">
                  Date
                </th>
                <th style={S.th} className="col-desc">
                  Description
                </th>
                <th style={S.th} className="col-desktop">
                  Account
                </th>
                <th style={S.th} className="col-desktop">
                  Category
                </th>
                <th style={S.th} className="col-desktop">
                  Sub
                </th>
                <th style={S.th} className="col-desktop">
                  Division
                </th>
                <th style={S.th} className="col-desktop">
                  Type
                </th>
                <th
                  style={{ ...S.th, textAlign: "right" }}
                  className="col-amount"
                >
                  Amount
                </th>
                <th
                  style={{ ...S.th, textAlign: "center" }}
                  className="col-actions"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
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
                pageSlice.map((t, i) => {
                  const acct = accountMap[t.accountId];
                  return (
                    <tr key={t.id} style={S.tr(i)}>
                      <td
                        style={{ ...S.td, whiteSpace: "nowrap", fontSize: 12 }}
                        className="col-date"
                      >
                        <span className="date-full">
                          {formatDateTime(t.date)}
                        </span>
                        <span className="date-short">
                          {fmtShortDate(t.date)}
                        </span>
                      </td>
                      <td
                        style={{ ...S.td, maxWidth: 200 }}
                        className="col-desc"
                      >
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
                        <div className="mobile-sub-row">
                          <span
                            style={S.badge(CAT_COLORS[t.category] || "#6B7280")}
                          >
                            {cap(t.category)}
                          </span>
                          {acct && (
                            <span
                              style={{
                                ...S.accChip(acct.color),
                                marginLeft: 4,
                              }}
                            >
                              <span style={S.accDot(acct.color)} />
                              {acct.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={S.td} className="col-desktop">
                        {acct ? (
                          <span style={S.accChip(acct.color)}>
                            <span style={S.accDot(acct.color)} />
                            {acct.name}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "rgba(255,255,255,0.15)",
                              fontSize: 11,
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td style={S.td} className="col-desktop">
                        <span
                          style={S.badge(CAT_COLORS[t.category] || "#6B7280")}
                        >
                          {cap(t.category)}
                        </span>
                      </td>
                      <td style={S.td} className="col-desktop">
                        {t.subCategory ? (
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "rgba(255,255,255,0.5)",
                            }}
                          >
                            {t.subCategory}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "rgba(255,255,255,0.15)",
                              fontSize: 11,
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td style={S.td} className="col-desktop">
                        <span
                          style={S.badge(DIV_COLORS[t.division] || "#6B7280")}
                        >
                          {cap(t.division)}
                        </span>
                      </td>
                      <td style={S.td} className="col-desktop">
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
                          whiteSpace: "nowrap",
                          color: t.type === "INCOME" ? "#10B981" : "#EF4444",
                        }}
                        className="col-amount"
                      >
                        {t.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </td>
                      <td
                        style={{ ...S.td, textAlign: "center" }}
                        className="col-actions"
                      >
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
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* Pagination bar */}
        {totalRecords > 0 && (
          <div style={S.paginationBar}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                {startRecord}–{endRecord} of {totalRecords}
              </span>
              <select
                style={S.pageSizeSelect}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: "flex",
                gap: 4,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                style={S.pageBtn(false, safePage === 1)}
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {pageNumbers.map((p, idx) =>
                p === "..." ? (
                  <span
                    key={`e-${idx}`}
                    style={{
                      color: "rgba(255,255,255,0.2)",
                      fontSize: 12,
                      padding: "0 4px",
                    }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    style={S.pageBtn(p === safePage, false)}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                style={S.pageBtn(false, safePage === totalPages)}
                disabled={safePage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
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
                  fontFamily: "inherit",
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
                  fontFamily: "inherit",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .txn-page-wrap { padding: 36px 40px; min-height: 100vh; color: #E8EDF5; }

        .col-desktop  { display: table-cell; }
        .date-full    { display: inline; }
        .date-short   { display: none; }
        .mobile-sub-row { display: none; }

        /* FIX #17 — hide the filter selects on mobile but NEVER hide search */
        @media (max-width: 768px) {
          .txn-page-wrap { padding: 16px; }
          .filter-row   { display: none !important; }
          .col-desktop  { display: none !important; }
          .date-full    { display: none; }
          .date-short   { display: inline; }
          .mobile-sub-row { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
          .col-actions button { padding: 4px 6px; font-size: 13px; }
          .col-desc { max-width: 140px; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
