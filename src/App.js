import React, { useState, useEffect } from "react";
import { transactionAPI, accountAPI } from "./services/api";
import DashboardCards from "./components/DashboardCards";
import FilterPanel from "./components/FilterPanel";
import TransactionTable from "./components/TransactionTable";
import TransactionModal from "./components/TransactionModal";
import CategorySummary from "./components/CategorySummary";
import AccountTransferModal from "./components/AccountTransferModal";
import IncomeExpenseChart from "./components/IncomeExpenseChart";
import {
  FaPlus,
  FaExchangeAlt,
  FaWallet,
  FaTrash,
  FaTimes,
} from "react-icons/fa";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] =
    useState(false);
  const [editTransaction, setEditTransaction] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchAccounts();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await transactionAPI.getDashboardData();
      setDashboardData(response.data);
      setTransactions(response.data.transactions || []);
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await accountAPI.getAllAccounts();
      setAccounts(response.data);
    } catch (err) {
      console.error("Account fetch failed", err);
    }
  };

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
    } catch {
      alert("Transaction save failed");
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      await transactionAPI.deleteTransaction(id);
      fetchDashboardData();
    }
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm("Delete this account?")) {
      await accountAPI.deleteAccount(id);
      fetchAccounts();
    }
  };

  const handleCreateAccount = async (data) => {
    await accountAPI.createAccount(data);
    setIsCreateAccountModalOpen(false);
    fetchAccounts();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      {/* HEADER */}
      <header className="bg-[#111827] border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              💰 Money Manager
            </h1>
            <p className="text-slate-400 text-sm">
              Intelligent finance tracking
            </p>
          </div>

          <div className="flex gap-4 relative">
            {/* Accounts Button */}
            <div className="relative">
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl font-semibold shadow-lg transition flex items-center gap-2"
              >
                <FaWallet /> Accounts
              </button>

              {isAccountDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl p-5 z-50">
                  <button
                    onClick={() => {
                      setIsTransferModalOpen(true);
                      setIsAccountDropdownOpen(false);
                    }}
                    className="w-full mb-4 bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl flex items-center gap-2 transition"
                  >
                    <FaExchangeAlt /> Transfer
                  </button>

                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex justify-between items-center bg-slate-800 px-4 py-3 rounded-xl"
                      >
                        <div>
                          <p className="font-semibold">{acc.name}</p>
                          <p className="text-sm text-slate-400">
                            ₹{acc.balance?.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="text-red-500 hover:text-red-400 p-2"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setIsCreateAccountModalOpen(true);
                      setIsAccountDropdownOpen(false);
                    }}
                    className="mt-4 w-full bg-violet-600 hover:bg-violet-500 px-4 py-3 rounded-xl transition"
                  >
                    + Create Account
                  </button>
                </div>
              )}
            </div>

            {/* Add Transaction */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-semibold shadow-lg transition flex items-center gap-2"
            >
              <FaPlus /> Add Transaction
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {dashboardData && (
          <>
            <DashboardCards dashboardData={dashboardData} />

            {/* Premium Chart Card */}
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-8 shadow-xl">
              <h2 className="text-lg font-semibold mb-6">Income vs Expense</h2>
              <IncomeExpenseChart dashboardData={dashboardData} />
            </div>

            {dashboardData.categorySummary && (
              <CategorySummary
                categorySummary={dashboardData.categorySummary}
              />
            )}

            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-8 shadow-xl">
              <FilterPanel onFilter={() => {}} onReset={fetchDashboardData} />

              <TransactionTable
                transactions={transactions}
                onEdit={(t) => {
                  setEditTransaction(t);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteTransaction}
              />
            </div>
          </>
        )}
      </main>

      {/* MODALS */}
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

      {isCreateAccountModalOpen && (
        <CreateAccountModal
          onClose={() => setIsCreateAccountModalOpen(false)}
          onSubmit={handleCreateAccount}
        />
      )}
    </div>
  );
}

/* ---------------- Create Account Modal ---------------- */

function CreateAccountModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create Account</h2>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ name, balance });
          }}
          className="space-y-4"
        >
          <input
            type="text"
            required
            placeholder="Account Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:outline-none"
          />

          <input
            type="number"
            required
            placeholder="Initial Balance"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:outline-none"
          />

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-violet-600 hover:bg-violet-500 px-4 py-3 rounded-xl transition"
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
