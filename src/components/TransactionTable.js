import React from 'react';
import { formatDateTime, formatCurrency, capitalize, getCategoryColor } from '../utils/helpers';
import { FaEdit, FaTrash } from 'react-icons/fa';

const TransactionTable = ({ transactions, onEdit, onDelete }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-gray-500 text-lg">No transactions found</p>
        <p className="text-gray-400 text-sm mt-2">Add your first transaction to get started!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Division
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDateTime(transaction.date)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <div className="max-w-xs truncate" title={transaction.description}>
                  {transaction.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`badge ${getCategoryColor(transaction.category)}`}>
                  {capitalize(transaction.category)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`badge ${
                  transaction.division === 'OFFICE' ? 'badge-office' : 'badge-personal'
                }`}>
                  {capitalize(transaction.division)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`badge ${
                  transaction.type === 'INCOME' ? 'badge-income' : 'badge-expense'
                }`}>
                  {transaction.type === 'INCOME' ? '💰 Income' : '💸 Expense'}
                </span>
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                transaction.type === 'INCOME' ? 'text-success-600' : 'text-danger-600'
              }`}>
                {transaction.type === 'INCOME' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(transaction)}
                    className="text-primary-600 hover:text-primary-900 transition-colors p-2 hover:bg-primary-50 rounded"
                    title="Edit Transaction"
                  >
                    <FaEdit className="text-lg" />
                  </button>
                  <button
                    onClick={() => onDelete(transaction.id)}
                    className="text-danger-600 hover:text-danger-900 transition-colors p-2 hover:bg-danger-50 rounded"
                    title="Delete Transaction"
                  >
                    <FaTrash className="text-lg" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
