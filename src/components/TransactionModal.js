import React, { useState, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaTimes } from "react-icons/fa";

const TransactionModal = ({ isOpen, onClose, onSubmit, editTransaction }) => {
  const [activeTab, setActiveTab] = useState("income");
  const [formData, setFormData] = useState({
    type: "INCOME",
    amount: "",
    description: "",
    category: "",
    division: "PERSONAL",
    date: new Date(),
  });

  const incomeCategories = ["SALARY", "FREELANCE", "INVESTMENT", "OTHER"];
  const expenseCategories = [
    "FUEL",
    "MOVIE",
    "FOOD",
    "LOAN",
    "MEDICAL",
    "OTHER",
  ];

  // Define resetForm BEFORE using it in useEffect
  const resetForm = useCallback(() => {
    setFormData({
      type: activeTab === "income" ? "INCOME" : "EXPENSE",
      amount: "",
      description: "",
      category: "",
      division: "PERSONAL",
      date: new Date(),
    });
  }, [activeTab]);

  // Now useEffect can safely use resetForm
  useEffect(() => {
    if (editTransaction) {
      setFormData({
        type: editTransaction.type,
        amount: editTransaction.amount,
        description: editTransaction.description,
        category: editTransaction.category,
        division: editTransaction.division,
        date: new Date(editTransaction.date),
      });
      setActiveTab(editTransaction.type === "INCOME" ? "income" : "expense");
    } else {
      resetForm();
    }
  }, [editTransaction, isOpen, resetForm]);

  useEffect(() => {
    if (!editTransaction) {
      setFormData((prev) => ({
        ...prev,
        type: activeTab === "income" ? "INCOME" : "EXPENSE",
        category: "",
      }));
    }
  }, [activeTab, editTransaction]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const categories =
    activeTab === "income" ? incomeCategories : expenseCategories;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-slide-down">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {editTransaction ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        {/* Tabs */}
        {!editTransaction && (
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-4 text-center font-semibold transition-all duration-200 ${
                activeTab === "income"
                  ? "bg-success-500 text-white border-b-4 border-success-600"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("income")}
            >
              💰 Income
            </button>
            <button
              className={`flex-1 py-4 text-center font-semibold transition-all duration-200 ${
                activeTab === "expense"
                  ? "bg-danger-500 text-white border-b-4 border-danger-600"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("expense")}
            >
              💸 Expense
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="label">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 font-semibold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="input-field pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field"
              placeholder="Enter description"
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="input-field"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Division */}
          <div>
            <label className="label">
              Division <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, division: "OFFICE" })}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all duration-200 ${
                  formData.division === "OFFICE"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                🏢 Office
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, division: "PERSONAL" })
                }
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all duration-200 ${
                  formData.division === "PERSONAL"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                👤 Personal
              </button>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="label">
              Date & Time <span className="text-red-500">*</span>
            </label>
            <DatePicker
              selected={formData.date}
              onChange={(date) => setFormData({ ...formData, date })}
              showTimeSelect
              dateFormat="Pp"
              maxDate={new Date()}
              className="input-field"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 ${
                activeTab === "income" || formData.type === "INCOME"
                  ? "btn-success"
                  : "btn-danger"
              }`}
            >
              {editTransaction ? "✓ Update" : "+ Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
