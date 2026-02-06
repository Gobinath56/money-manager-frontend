import React, { useState } from "react";
import { accountAPI } from "../services/api";

const AccountCreateModal = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Account name required");
      return;
    }

    try {
      setLoading(true);

      await accountAPI.createAccount({
        name,
        balance: parseFloat(balance) || 0,
      });

      setName("");
      setBalance("");
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Account Name"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Initial Balance"
            className="w-full border p-2 rounded"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountCreateModal;
