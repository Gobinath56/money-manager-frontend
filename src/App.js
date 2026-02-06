import React, { useState, useEffect } from "react";
import { transactionAPI, accountAPI } from "./services/api";
import DashboardCards from "./components/DashboardCards";
import FilterPanel from "./components/FilterPanel";
import TransactionTable from "./components/TransactionTable";
import TransactionModal from "./components/TransactionModal";
import CategorySummary from "./components/CategorySummary";
import AccountTransferModal from "./components/AccountTransferModal";
import AccountCreateModal from "./components/AccountCreateModal";
import IncomeExpenseChart from "./components/IncomeExpenseChart";
import { FaPlus, FaExchangeAlt } from "react-icons/fa";
import "./index.css";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);

  const [editTransaction, setEditTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  /* ---------------- DARK MODE ---------------- */
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    fetchDashboardData();
    fetchAccounts();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getDashboardData();
      setDashboardData(response.data);
      setTransactions(response.data.transactions || []);
      setError(null);
    } catch {
      setError("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await accountAPI.getAllAccounts();
      setAccounts(response.data);
    } catch (err) {
      console.error("Account fetch error:", err);
    }
  };

  /* ---------------- ACCOUNT DELETE ---------------- */
  const handleDeleteAccount = async (id) => {
    if (!window.confirm("Delete this account?")) return;
    try {
      await accountAPI.deleteAccount(id);
      fetchAccounts();
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete account");
    }
  };

  /* ---------------- TRANSACTION CRUD ---------------- */
  const handleSubmitTransaction = async (formData) => {
    try {
      setLoading(true);

      if (editTransaction) {
        await transactionAPI.updateTransaction(editTransaction.id, formData);
        alert("Transaction updated!");
      } else {
        await transactionAPI.createTransaction(formData);
        alert("Transaction added!");
      }

      setEditTransaction(null);
      setIsModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await transactionAPI.deleteTransaction(id);
      fetchDashboardData();
    } catch {
      alert("Delete failed");
    }
  };

  const handleFilter = async (filters) => {
    try {
      setLoading(true);
      const params = {};

      if (filters.division) params.division = filters.division;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();

      const response = await transactionAPI.getFilteredTransactions(params);
      setTransactions(response.data);
    } catch {
      setError("Filter failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen transition-all duration-500 
      bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 
      dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900"
    >
      {/* ================= HEADER ================= */}
      <header
        className="backdrop-blur-md bg-white/60 dark:bg-slate-900/60
             border-b border-white/20 dark:border-slate-700
             p-6 shadow-lg transition-all duration-500"
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* Title + Buttons Row */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              💰 Money Manager
            </h1>

            <div className="flex gap-3 items-center">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="px-4 py-2 rounded-xl font-medium
            bg-white/80 dark:bg-slate-700
            text-gray-800 dark:text-white
            border border-gray-200 dark:border-slate-600
            hover:scale-105 hover:shadow-lg
            transition-all duration-300"
              >
                {darkMode ? "☀ Light" : "🌙 Dark"}
              </button>

              {/* Transfer */}
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="px-5 py-2.5 rounded-xl font-medium
            bg-gradient-to-r from-indigo-500 to-blue-600
            text-white shadow-md
            hover:shadow-xl hover:scale-105
            active:scale-95
            transition-all duration-300"
              >
                Transfer
              </button>

              {/* Create Account */}
              <button
                onClick={() => setIsCreateAccountOpen(true)}
                className="px-5 py-2.5 rounded-xl font-medium
            bg-white/70 dark:bg-slate-800
            text-gray-800 dark:text-white
            border border-gray-200 dark:border-slate-600
            hover:bg-white dark:hover:bg-slate-700
            hover:shadow-md hover:scale-105
            active:scale-95
            transition-all duration-300"
              >
                + Create Account
              </button>

              {/* Add Transaction */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-xl font-medium
            bg-gradient-to-r from-emerald-500 to-green-600
            text-white shadow-md
            hover:shadow-xl hover:scale-105
            active:scale-95
            transition-all duration-300"
              >
                + Add Transaction
              </button>
            </div>
          </div>

          {/* Accounts Row */}
          <div className="flex gap-4 flex-wrap">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white/70 dark:bg-slate-800/70
                     backdrop-blur-md
                     text-gray-800 dark:text-white
                     px-5 py-3 rounded-2xl shadow-lg
                     transition-all duration-300"
              >
                <div className="font-semibold">{account.name}</div>
                <div className="text-sm opacity-70">
                  ${account.balance?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {dashboardData && (
          <>
            <DashboardCards dashboardData={dashboardData} />

            <IncomeExpenseChart dashboardData={dashboardData} />

            {dashboardData.categorySummary && (
              <CategorySummary
                categorySummary={dashboardData.categorySummary}
              />
            )}

            {/* FILTER + TABLE SECTION */}
            <div
              className="bg-white dark:bg-slate-800 
          rounded-2xl shadow-lg 
          border border-gray-100 dark:border-slate-700 
          p-6 space-y-8 transition-all duration-300"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  🔎 Smart Filters
                </h2>
              </div>

              <FilterPanel
                onFilter={handleFilter}
                onReset={fetchDashboardData}
              />

              <TransactionTable
                transactions={transactions}
                onEdit={setEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            </div>
          </>
        )}
      </main>

      {/* ================= MODALS ================= */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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

      <AccountCreateModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        onSuccess={() => {
          fetchAccounts();
          fetchDashboardData();
        }}
      />
    </div>
  );
}

export default App;
