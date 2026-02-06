import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-slide-down">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <FaExclamationTriangle className="text-red-500 text-2xl" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>

        {/* Body */}
        <div className="p-6 text-gray-600">{message}</div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="btn-danger">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
