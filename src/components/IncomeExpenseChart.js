import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "../utils/helpers";

const IncomeExpenseChart = ({ dashboardData }) => {
  if (!dashboardData) return null;

  const data = [
    {
      name: "Monthly",
      Income: dashboardData.monthlySummary?.income || 0,
      Expense: dashboardData.monthlySummary?.expenditure || 0,
    },
    {
      name: "Weekly",
      Income: dashboardData.weeklySummary?.income || 0,
      Expense: dashboardData.weeklySummary?.expenditure || 0,
    },
    {
      name: "Yearly",
      Income: dashboardData.yearlySummary?.income || 0,
      Expense: dashboardData.yearlySummary?.expenditure || 0,
    },
  ];

  return (
    <div className="card mb-6 animate-slide-down">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        📊 Income vs Expense Comparison
      </h3>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="Income" fill="#22C55E" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Expense" fill="#EF4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeExpenseChart;
