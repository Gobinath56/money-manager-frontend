import React, { useState, useEffect, useCallback } from "react";
import { transactionAPI, accountAPI } from "./services/api";
import { getToken, setAuthHeader, logout } from "./services/authService";
import DashboardCards from "./components/DashboardCards";
import FilterPanel from "./components/FilterPanel";
import TransactionTable from "./components/TransactionTable";
import TransactionModal from "./components/TransactionModal";
import CategorySummary from "./components/CategorySummary";
import AccountTransferModal from "./components/AccountTransferModal";
import IncomeExpenseChart from "./components/IncomeExpenseChart";
import LoginPage from "./components/LoginPage";
import {
  FaPlus,
  FaExchangeAlt,
  FaWallet,
  FaTrash,
  FaTimes,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";

// ─────────────────────────────────────────────
//  HELPER — decode JWT payload (no library needed)
//  JWT = "header.payload.signature" — payload is base64url encoded JSON
// ─────────────────────────────────────────────
function getEmailFromToken(token) {
  try {
    const payload = token.split(".")[1]; // grab the middle part
    const decoded = atob(payload); // base64 decode → JSON string
    return JSON.parse(decoded).sub; // "sub" = subject = email (set in JwtService)
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────
function App() {
  // ── Auth state ──────────────────────────────
  // !!getToken() converts the stored token string to boolean (true if exists)
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [userEmail, setUserEmail] = useState(() => {
    const t = getToken();
    return t ? getEmailFromToken(t) : null;
    // Arrow function in useState = runs once on mount, avoids re-running on re-renders
  });

  // ── App state ────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] =
    useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Restore JWT into Axios headers on page refresh ──
  // This runs once on mount. Without it, refreshing the page loses the token
  // from Axios even though it's still in localStorage.
  useEffect(() => {
    const token = getToken();
    if (token) {
      setAuthHeader(token);
    }
  }, []);

  // ── Fetch data only when authenticated ──────
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      fetchAccounts();
    }
  }, [isAuthenticated, fetchDashboardData, fetchAccounts]);

  // ─────────────────────────────────────────────
  //  DATA FETCHING
  // ─────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transactionAPI.getDashboardData();
      setDashboardData(response.data);
      setTransactions(response.data.transactions || []);
    } catch (err) {
      // 401 = token expired or invalid → force logout
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        setError("Failed to load dashboard data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  });

  const fetchAccounts = useCallback( async () => {
    try {
      const response = await accountAPI.getAllAccounts();
      setAccounts(response.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  });

  // ─────────────────────────────────────────────
  //  AUTH HANDLERS
  // ─────────────────────────────────────────────
  const handleLoginSuccess = (token, email) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    // authService.login() already stored the token and set the Axios header,
    // so we just update local state here.
  };

  const handleLogout = () => {
    logout(); // clears localStorage + Axios header
    setIsAuthenticated(false);
    setUserEmail(null);
    setDashboardData(null);
    setTransactions([]);
    setAccounts([]);
  };

  // ─────────────────────────────────────────────
  //  TRANSACTION HANDLERS
  // ─────────────────────────────────────────────
  const handleSubmitTransaction = async (formData) => {
    try {
      if (editTransaction) {
        await transactionAPI.updateTransaction(editTransaction.id, formData);
      } else {
        await transactionAPI.createTransaction(formData);
      }
      setEditTransaction(null);
      setIsModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        alert(err.response?.data?.message || "Transaction save failed");
      }
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      try {
        await transactionAPI.deleteTransaction(id);
        fetchDashboardData();
      } catch (err) {
        if (err.response?.status === 401) handleLogout();
        else alert("Failed to delete transaction");
      }
    }
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm("Delete this account?")) {
      try {
        await accountAPI.deleteAccount(id);
        fetchAccounts();
      } catch (err) {
        if (err.response?.status === 401) handleLogout();
        else alert("Failed to delete account");
      }
    }
  };

  const handleCreateAccount = async (data) => {
    try {
      await accountAPI.createAccount(data);
      setIsCreateAccountModalOpen(false);
      fetchAccounts();
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      else alert("Failed to create account");
    }
  };

  // ─────────────────────────────────────────────
  //  GATE: show login if not authenticated
  // ─────────────────────────────────────────────
  if (!isAuthenticated) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  // ─────────────────────────────────────────────
  //  LOADING STATE
  // ─────────────────────────────────────────────
  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  //  MAIN RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      {/* ── HEADER ── */}
      <header className="bg-[#111827] border-b border-slate-700 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Brand */}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              💰 Money Manager
            </h1>
            <p className="text-slate-400 text-xs">
              Intelligent finance tracking
            </p>
          </div>

          {/* Right side controls */}
          <div className="flex gap-3 items-center">
            {/* User email display */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl text-sm text-slate-300">
              <FaUser className="text-slate-500 text-xs" />
              <span className="max-w-[180px] truncate">{userEmail}</span>
            </div>

            {/* Accounts dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="bg-violet-600 hover:bg-violet-500 px-4 py-2.5 rounded-xl font-semibold shadow-lg transition flex items-center gap-2 text-sm"
              >
                <FaWallet /> Accounts
              </button>

              {isAccountDropdownOpen && (
                <>
                  {/* Backdrop — clicking outside closes dropdown */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsAccountDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-3 w-80 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl p-5 z-50">
                    <button
                      onClick={() => {
                        setIsTransferModalOpen(true);
                        setIsAccountDropdownOpen(false);
                      }}
                      className="w-full mb-4 bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl flex items-center gap-2 transition text-sm"
                    >
                      <FaExchangeAlt /> Transfer between accounts
                    </button>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {accounts.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4">
                          No accounts yet
                        </p>
                      ) : (
                        accounts.map((acc) => (
                          <div
                            key={acc.id}
                            className="flex justify-between items-center bg-slate-800 px-4 py-3 rounded-xl"
                          >
                            <div>
                              <p className="font-semibold text-sm">
                                {acc.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                ₹{acc.balance?.toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteAccount(acc.id)}
                              className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-900/20 transition"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setIsCreateAccountModalOpen(true);
                        setIsAccountDropdownOpen(false);
                      }}
                      className="mt-4 w-full bg-violet-600 hover:bg-violet-500 px-4 py-2.5 rounded-xl transition text-sm font-semibold"
                    >
                      + Create Account
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Add Transaction */}
            <button
              onClick={() => {
                setEditTransaction(null);
                setIsModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 rounded-xl font-semibold shadow-lg transition flex items-center gap-2 text-sm"
            >
              <FaPlus /> Add Transaction
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Sign out"
              className="bg-slate-700 hover:bg-red-900/50 hover:text-red-400 p-2.5 rounded-xl transition text-slate-400"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Error banner */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-5 py-4 rounded-xl flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {dashboardData && (
          <>
            <DashboardCards dashboardData={dashboardData} />

            {/* Income vs Expense chart */}
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-8 shadow-xl">
              <h2 className="text-lg font-semibold mb-6">Income vs Expense</h2>
              <IncomeExpenseChart dashboardData={dashboardData} />
            </div>

            {/* Category pie */}
            {dashboardData.categorySummary &&
              Object.keys(dashboardData.categorySummary).length > 0 && (
                <CategorySummary
                  categorySummary={dashboardData.categorySummary}
                />
              )}

            {/* Filter + Table */}
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-8 shadow-xl">
              <FilterPanel
                onFilter={async (filters) => {
                  // ── This was previously broken (onFilter={() => {}}) ──
                  // Now it actually calls the backend filter endpoint.
                  try {
                    const params = {};
                    if (filters.division) params.division = filters.division;
                    if (filters.category) params.category = filters.category;
                    if (filters.startDate)
                      params.startDate = filters.startDate.toISOString();
                    if (filters.endDate)
                      params.endDate = filters.endDate.toISOString();

                    const response =
                      await transactionAPI.getFilteredTransactions(params);
                    setTransactions(response.data);
                  } catch (err) {
                    if (err.response?.status === 401) handleLogout();
                    else setError("Filter failed. Please try again.");
                  }
                }}
                onReset={fetchDashboardData}
              />

              <div className="mt-6">
                <TransactionTable
                  transactions={transactions}
                  onEdit={(t) => {
                    setEditTransaction(t);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDeleteTransaction}
                />
              </div>
            </div>
          </>
        )}

        {/* Empty state — authenticated but no data yet */}
        {!loading && !error && dashboardData && transactions.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">💸</div>
            <p className="text-lg">No transactions yet</p>
            <p className="text-sm mt-1">
              Click "Add Transaction" to get started
            </p>
          </div>
        )}
      </main>

      {/* ── MODALS ── */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditTransaction(null);
        }}
        onSubmit={handleSubmitTransaction}
        editTransaction={editTransaction}
      />

      <AccountTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => {
          fetchAccounts();
          fetchDashboardData();
        }}
      />

      {isCreateAccountModalOpen && (
        <CreateAccountModal
          onClose={() => setIsCreateAccountModalOpen(false)}
          onSubmit={handleCreateAccount}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  CREATE ACCOUNT MODAL (inline — small component)
// ─────────────────────────────────────────────
function CreateAccountModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create Account</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ name, balance: parseFloat(balance) || 0 });
          }}
          className="space-y-4"
        >
          <input
            type="text"
            required
            placeholder="Account Name (e.g. Savings, Cash)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-violet-500 transition"
          />
          <input
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="Initial Balance (₹)"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-violet-500 transition"
          />
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl transition text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-violet-600 hover:bg-violet-500 px-4 py-3 rounded-xl transition text-sm font-semibold"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
