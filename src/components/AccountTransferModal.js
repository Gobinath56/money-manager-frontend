import React, { useState, useEffect } from 'react';
import { FaTimes, FaExchangeAlt } from 'react-icons/fa';
import { accountAPI } from '../services/api';

const AccountTransferModal = ({ isOpen, onClose, onSuccess }) => {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      const response = await accountAPI.getAllAccounts();
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.fromAccountId === formData.toAccountId) {
      alert('Cannot transfer to the same account!');
      return;
    }

    setLoading(true);
    try {
      await accountAPI.transfer(formData);
      alert('Transfer successful!');
      setFormData({ fromAccountId: '', toAccountId: '', amount: '' });
      onSuccess();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || 'Transfer failed. Please try again.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-slide-down">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaExchangeAlt className="text-primary-600" />
            Transfer Between Accounts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* From Account */}
          <div>
            <label className="label">
              From Account <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.fromAccountId}
              onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
              className="input-field"
            >
              <option value="">Select source account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (${account.balance?.toFixed(2) || '0.00'})
                </option>
              ))}
            </select>
          </div>

          {/* To Account */}
          <div>
            <label className="label">
              To Account <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.toAccountId}
              onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
              className="input-field"
            >
              <option value="">Select destination account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (${account.balance?.toFixed(2) || '0.00'})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="label">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-field pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Processing...' : '💸 Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountTransferModal;
