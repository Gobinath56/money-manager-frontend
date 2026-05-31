import React, { useState, useEffect } from "react";
import { accountAPI } from "../services/api";
import { formatCurrency } from "../utils/helpers";

const AccountTransferModal = ({ isOpen, onClose, onSuccess }) => {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      setError("");
      setFormData({ fromAccountId: "", toAccountId: "", amount: "" });
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      const response = await accountAPI.getAllAccounts();
      setAccounts(response.data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.fromAccountId === formData.toAccountId) {
      setError("Cannot transfer to the same account.");
      return;
    }

    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    const fromAcc = accounts.find((a) => a.id === formData.fromAccountId);
    if (fromAcc && amt > fromAcc.balance) {
      setError(
        `Insufficient balance. ${fromAcc.name} has ${formatCurrency(fromAcc.balance)}.`,
      );
      return;
    }

    setLoading(true);
    try {
      await accountAPI.transfer(formData);
      onSuccess();
      onClose();
    } catch (error) {
      setError(
        error.response?.data?.message || "Transfer failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // ── Shared overlay wrapper used for both states ──────────────────────────
  const Overlay = ({ children }) => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 500,
        padding: "0 16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0D1117",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 420,
          padding: "28px 24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  // ── Not enough accounts ──────────────────────────────────────────────────
  if (accounts.length < 2) {
    return (
      <Overlay>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <p
            style={{
              color: "#F0F4FF",
              fontWeight: 500,
              marginBottom: 8,
              fontSize: 15,
            }}
          >
            You need at least 2 accounts to transfer
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              marginBottom: 20,
              lineHeight: 1.6,
            }}
          >
            Create another account first (e.g. Savings, Cash) to enable
            transfers between them.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: 9,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Close
          </button>
        </div>
      </Overlay>
    );
  }

  const S = {
    label: {
      display: "block",
      fontSize: 10,
      fontWeight: 500,
      color: "rgba(255,255,255,0.35)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      marginBottom: 7,
    },
    select: {
      width: "100%",
      background: "#161D2A",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 9,
      padding: "11px 13px",
      color: "#F0F4FF",
      fontSize: 14,
      outline: "none",
      marginBottom: 14,
      cursor: "pointer",
      fontFamily: "inherit",
      boxSizing: "border-box",
    },
    input: {
      width: "100%",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 9,
      padding: "11px 13px 11px 36px",
      color: "#F0F4FF",
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
  };

  return (
    <Overlay>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <h2
          style={{ fontSize: 16, fontWeight: 600, color: "#F0F4FF", margin: 0 }}
        >
          Transfer Between Accounts
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)",
            borderRadius: 8,
            width: 28,
            height: 28,
            cursor: "pointer",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 9,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "#FCA5A5",
            lineHeight: 1.5,
          }}
        >
          ✕ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* From */}
        <label style={S.label}>From account *</label>
        <select
          required
          style={S.select}
          value={formData.fromAccountId}
          onChange={(e) =>
            setFormData({ ...formData, fromAccountId: e.target.value })
          }
        >
          <option value="">Select source account</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} — {formatCurrency(acc.balance)}
            </option>
          ))}
        </select>

        {/* To */}
        <label style={S.label}>To account *</label>
        <select
          required
          style={S.select}
          value={formData.toAccountId}
          onChange={(e) =>
            setFormData({ ...formData, toAccountId: e.target.value })
          }
        >
          <option value="">Select destination account</option>
          {accounts
            .filter((a) => a.id !== formData.fromAccountId)
            .map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} — {formatCurrency(acc.balance)}
              </option>
            ))}
        </select>

        {/* Amount */}
        <label style={S.label}>Amount *</label>
        <div style={{ position: "relative", marginBottom: 20 }}>
          <span
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.3)",
              fontSize: 14,
            }}
          >
            ₹
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            style={S.input}
            placeholder="0.00"
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.55)",
              borderRadius: 9,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: "11px",
              background: loading
                ? "rgba(30,111,217,0.3)"
                : "linear-gradient(135deg, #1E6FD9, #0D4FA8)",
              border: "1px solid rgba(30,111,217,0.4)",
              color: "#fff",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? "Transferring…" : "Transfer ₹"}
          </button>
        </div>
      </form>
    </Overlay>
  );
};

export default AccountTransferModal;
