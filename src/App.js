import React, { useState, useEffect } from "react";
import { transactionAPI, accountAPI } from "./services/api";
import { getToken, setAuthHeader, logout } from "./services/authService";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import MobileHeader from "./components/MobileHeader";
import DashboardPage from "./components/DashboardPage";
import TransactionsPage from "./components/TransactionsPage";
import BudgetPage from "./components/BudgetPage";
import AnalyticsPage from "./components/AnalyticsPage";
import RecurringPage from "./components/RecurringPage";
import TransactionModal from "./components/TransactionModal";
import AccountTransferModal from "./components/AccountTransferModal";
import Toast from "./components/Toast";
import CategoriesPage from "./components/CategoriesPage";
import ChangePasswordPage from "./components/ChangePasswordPage";
import { startKeepAlive, stopKeepAlive } from "./services/keepAlive";

function getEmailFromToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1])).sub;
  } catch {
    return null;
  }
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function App() {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [userEmail, setUserEmail] = useState(() => {
    const t = getToken();
    return t ? getEmailFromToken(t) : null;
  });

  // ── Navigation ─────────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Responsive ─────────────────────────────────────────────────────────────
  const isMobile = useIsMobile();
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  // ── Data ───────────────────────────────────────────────────────────────────
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] =
    useState(false);
  const [editTransaction, setEditTransaction] = useState(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Restore Axios header on refresh ───────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (token) {
      setAuthHeader(token);
      startKeepAlive(); // FIX #4: resume keep-alive if user was already logged in
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      fetchAccounts();
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  //  DATA FETCHERS
  // ─────────────────────────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await transactionAPI.getDashboardData();
      setDashboardData(res.data);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      else showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await accountAPI.getAllAccounts();
      setAccounts(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  AUTH
  // ─────────────────────────────────────────────────────────────────────────
  const handleLoginSuccess = (token, email) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    startKeepAlive(); // FIX #4: keep Render server warm after login
  };

  const handleLogout = () => {
    stopKeepAlive(); // FIX #4: stop pinging when user logs out
    logout();
    setIsAuthenticated(false);
    setUserEmail(null);
    setDashboardData(null);
    setTransactions([]);
    setAccounts([]);
    setActivePage("dashboard");
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  TRANSACTION HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handleSubmitTransaction = async (formData) => {
    try {
      if (editTransaction) {
        await transactionAPI.updateTransaction(editTransaction.id, formData);
        showToast("Transaction updated");
      } else {
        await transactionAPI.createTransaction(formData);
        showToast("Transaction added");
      }
      setEditTransaction(null);
      setIsTransactionModalOpen(false);
      fetchDashboardData();
      fetchAccounts();
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      else
        showToast(
          err.response?.data?.message || "Failed to save transaction",
          "error",
        );
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await transactionAPI.deleteTransaction(id);
      showToast("Transaction deleted");
      fetchDashboardData();
      fetchAccounts();
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      else showToast("Failed to delete transaction", "error");
    }
  };

  const handleEditTransaction = (t) => {
    setEditTransaction(t);
    setIsTransactionModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  ACCOUNT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handleCreateAccount = async ({ name, balance }) => {
    try {
      await accountAPI.createAccount({
        name,
        balance: parseFloat(balance) || 0,
      });
      showToast(`Account "${name}" created`);
      setIsCreateAccountModalOpen(false);
      fetchAccounts();
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      else
        showToast(
          err.response?.data?.message || "Failed to create account",
          "error",
        );
    }
  };

  const handleDeleteAccount = async (id, name) => {
    try {
      await accountAPI.deleteAccount(id);
      showToast(`Account "${name}" deleted`);
      fetchAccounts();
      // Refresh transactions so orphaned ones update their display
      fetchDashboardData();
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      else showToast("Failed to delete account", "error");
    }
  };

  const openAddTransaction = () => {
    setEditTransaction(null);
    setIsTransactionModalOpen(true);
    setSidebarOpen(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  GATE
  // ─────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) return <LoginPage onSuccess={handleLoginSuccess} />;

  // ─────────────────────────────────────────────────────────────────────────
  //  PAGE ROUTER
  // ─────────────────────────────────────────────────────────────────────────
  const sharedProps = {
    dashboardData,
    transactions,
    accounts,
    loading,
    showToast,
    onEdit: handleEditTransaction,
    onDelete: handleDeleteTransaction,
    onRefresh: fetchDashboardData,
    onLogout: handleLogout,
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage {...sharedProps} />;
      case "transactions":
        return <TransactionsPage {...sharedProps} />;
      case "analytics":
        return <AnalyticsPage {...sharedProps} />;
      case "budget":
        return <BudgetPage {...sharedProps} />;
      case "recurring":
        return (
          <RecurringPage
            showToast={showToast}
            onRefresh={() => {
              fetchDashboardData();
              fetchAccounts();
            }}
          />
        );
      case "categories":
        return <CategoriesPage showToast={showToast} />;
      case "settings":
        return <ChangePasswordPage showToast={showToast} />;
      default:
        return <DashboardPage {...sharedProps} />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#080C14",
        fontFamily: "'DM Sans', 'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        userEmail={userEmail}
        accounts={accounts}
        transactions={transactions} // FIX: passed so Sidebar can count linked transactions
        onLogout={handleLogout}
        onAddTransaction={openAddTransaction}
        onCreateAccount={() => setIsCreateAccountModalOpen(true)}
        onDeleteAccount={handleDeleteAccount}
        onTransfer={() => setIsTransferModalOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <MobileHeader
        activePage={activePage}
        onOpenSidebar={() => setSidebarOpen(true)}
        onAddTransaction={openAddTransaction}
      />

      <div className="page-content">{renderPage()}</div>

      <BottomNav
        activePage={activePage}
        setActivePage={setActivePage}
        onAddTransaction={openAddTransaction}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditTransaction(null);
        }}
        onSubmit={handleSubmitTransaction}
        editTransaction={editTransaction}
        accounts={accounts}
      />

      <AccountTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => {
          fetchAccounts();
          fetchDashboardData();
          showToast("Transfer successful");
        }}
      />

      {isCreateAccountModalOpen && (
        <CreateAccountModal
          onClose={() => setIsCreateAccountModalOpen(false)}
          onSubmit={handleCreateAccount}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        @media (min-width: 769px) {
          .page-content { flex: 1; margin-left: 240px; min-height: 100vh; overflow-x: hidden; }
        }
        @media (max-width: 768px) {
          .page-content { flex: 1; margin-left: 0; min-height: 100vh; overflow-x: hidden; padding-top: 56px; padding-bottom: 70px; }
        }
        body.sidebar-open { overflow: hidden; }
      `}</style>
    </div>
  );
}

// ── Create Account Modal ───────────────────────────────────────────────────
function CreateAccountModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");

  const PRESETS = ["UPI", "Cash", "Bank", "Savings", "Credit Card", "Wallet"];

  const S = {
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.65)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 500,
      padding: "0 16px",
    },
    box: {
      background: "#0D1117",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16,
      padding: "28px 24px",
      width: "100%",
      maxWidth: 380,
    },
    title: {
      fontSize: 17,
      fontWeight: 500,
      color: "#F0F4FF",
      margin: "0 0 20px",
      letterSpacing: "-0.3px",
    },
    label: {
      display: "block",
      fontSize: 11,
      fontWeight: 500,
      color: "rgba(255,255,255,0.35)",
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      marginBottom: 7,
    },
    input: {
      width: "100%",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 9,
      padding: "11px 13px",
      color: "#F0F4FF",
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box",
      marginBottom: 14,
    },
    footer: { display: "flex", gap: 10, marginTop: 8 },
    cancel: {
      flex: 1,
      padding: "11px",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "rgba(255,255,255,0.55)",
      borderRadius: 9,
      fontSize: 13,
      cursor: "pointer",
    },
    submit: {
      flex: 1,
      padding: "11px",
      background: "linear-gradient(135deg, #1E6FD9, #0D4FA8)",
      border: "none",
      color: "#fff",
      borderRadius: 9,
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
    },
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.box} onClick={(e) => e.stopPropagation()}>
        <h2 style={S.title}>Create Account</h2>

        <label style={S.label}>Quick select</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 14,
          }}
        >
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setName(p)}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                cursor: "pointer",
                background:
                  name === p
                    ? "rgba(99,179,255,0.15)"
                    : "rgba(255,255,255,0.05)",
                border:
                  name === p
                    ? "1px solid rgba(99,179,255,0.3)"
                    : "1px solid rgba(255,255,255,0.1)",
                color: name === p ? "#63B3FF" : "rgba(255,255,255,0.4)",
                transition: "all 0.15s",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <label style={S.label}>Account Name</label>
        <input
          style={S.input}
          placeholder="e.g. UPI, Cash, HDFC Savings"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label style={S.label}>Opening Balance (₹)</label>
        <input
          style={S.input}
          type="number"
          placeholder="0.00"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          min="0"
          step="0.01"
        />

        <div style={S.footer}>
          <button style={S.cancel} onClick={onClose}>
            Cancel
          </button>
          <button
            style={S.submit}
            onClick={() => {
              if (!name.trim()) return;
              onSubmit({ name: name.trim(), balance });
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
