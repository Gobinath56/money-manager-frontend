import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency, capitalize } from '../utils/helpers';

const COLORS = {
  FUEL: '#FBBF24',
  MOVIE: '#A855F7',
  FOOD: '#FB923C',
  LOAN: '#EF4444',
  MEDICAL: '#EC4899',
  SALARY: '#22C55E',
  FREELANCE: '#3B82F6',
  INVESTMENT: '#6366F1',
  OTHER: '#6B7280',
};

const CategorySummary = ({ categorySummary }) => {
  if (!categorySummary || Object.keys(categorySummary).length === 0) {
    return null;
  }

  const chartData = Object.entries(categorySummary)
    .map(([category, amount]) => ({
      name: capitalize(category),
      value: amount,
      color: COLORS[category] || COLORS.OTHER,
    }))
    .filter(item => item.value > 0);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="card mb-6 animate-slide-down">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        📊 Expense by Category
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category List */}
        <div className="space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="font-medium text-gray-700">{item.name}</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategorySummary;
