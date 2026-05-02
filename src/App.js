import React, { useState, useEffect } from "react";
import { transactionAPI, accountAPI } from "./services/api";
import { getToken, setAuthHeader, logout } from "./services/authService";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./components/DashboardPage";
import TransactionsPage from "./components/TransactionsPage";
import BudgetPage from "./components/BudgetPage";
import AnalyticsPage from "./components/AnalyticsPage";
import RecurringPage from "./components/RecurringPage";
import TransactionModal from "./components/TransactionModal";
import AccountTransferModal from "./components/AccountTransferModal";
import Toast from "./components/Toast";

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER — decode JWT payload without any library
//  JWT format: "header.payload.signature"
//  payload is base64url-encoded JSON → atob() decodes → JSON.parse() reads it
//  "sub" claim = the email we set in JwtService.generateToken(email)
// ─────────────────────────────────────────────────────────────────────────────
function getEmailFromToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1])).sub;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [userEmail, setUserEmail] = useState(() => {
    const t = getToken();
    return t ? getEmailFromToken(t) : null;
  });

  // ── Navigation ─────────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState("dashboard");

  // ── Data ───────────────────────────────────────────────────────────────────
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  // null = hidden. { message, type } = visible.
  // type is "success" | "error" | "info"
  const [toast, setToast] = useState(null);

  // showToast is passed down to every page as a prop.
  // Pages call showToast("message") instead of window.alert("message").
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Restore Axios header on page refresh ───────────────────────────────────
  // localStorage keeps the token alive across refreshes,
  // but Axios headers reset. This re-attaches it once on mount.
  useEffect(() => {
    const token = getToken();
    if (token) setAuthHeader(token);
  }, []);

  // ── Fetch data once authenticated ──────────────────────────────────────────
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
  };

  const handleLogout = () => {
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
        showToast("Transaction updated successfully");
      } else {
        await transactionAPI.createTransaction(formData);
        showToast("Transaction added successfully");
      }
      setEditTransaction(null);
      setIsTransactionModalOpen(false);
      fetchDashboardData();
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
  //  GATE — show LoginPage if not logged in
  // ─────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PAGE ROUTER
  //  sharedProps is spread into every page component.
  //  Each page only reads what it needs — extras are ignored by React.
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
          <RecurringPage showToast={showToast} onRefresh={fetchDashboardData} />
        );
      default:
        return <DashboardPage {...sharedProps} />;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#080C14",
        fontFamily: "'DM Sans', 'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      {/*
        Fixed left panel — 240px wide.
        Contains: brand, Add Transaction button, nav items, user footer.
        setActivePage is called when user clicks a nav item →
        triggers renderPage() to swap the right panel content.
      */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        userEmail={userEmail}
        onLogout={handleLogout}
        onAddTransaction={() => {
          setEditTransaction(null);
          setIsTransactionModalOpen(true);
        }}
      />

      {/* ── PAGE CONTENT ─────────────────────────────────────────────────── */}
      {/*
        marginLeft: 240 offsets content past the fixed sidebar.
        Without this, content renders UNDER the sidebar (overlapping).
        flex:1 makes it fill remaining horizontal space.
      */}
      <div
        style={{
          flex: 1,
          marginLeft: 240,
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        {renderPage()}
      </div>

      {/* ── TRANSACTION MODAL ────────────────────────────────────────────── */}
      {/*
        Single modal handles both Add and Edit.
        editTransaction=null  → "Add Transaction" mode (empty form)
        editTransaction={obj} → "Edit" mode (form pre-filled with obj data)
        TransactionModal reads editTransaction prop to decide which mode.
      */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditTransaction(null);
        }}
        onSubmit={handleSubmitTransaction}
        editTransaction={editTransaction}
      />

      {/* ── TRANSFER MODAL ───────────────────────────────────────────────── */}
      <AccountTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => {
          fetchAccounts();
          fetchDashboardData();
          showToast("Transfer successful");
        }}
      />

      {/* ── TOAST ────────────────────────────────────────────────────────── */}
      {/*
        HOW TOAST WORKS:
        1. Any page calls showToast("message", "success"|"error"|"info")
        2. showToast() sets toast state → this conditional renders <Toast>
        3. Toast slides in from bottom-right (CSS transition in Toast.js)
        4. After 3.5s, setTimeout clears the state → Toast disappears
        5. User can also click × inside Toast → onClose → setToast(null)

        WHY IT WASN'T WORKING BEFORE:
        The old App.js never imported Toast or defined showToast.
        Pages had no way to trigger it. Now showToast is passed as a
        prop to every page component via sharedProps.
      */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
