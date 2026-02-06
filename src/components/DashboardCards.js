import React from 'react';
import { formatCurrency } from '../utils/helpers';
import { FaArrowTrendUp, FaArrowTrendDown, FaWallet } from 'react-icons/fa6';

const DashboardCard = ({ title, income, expenditure, balance, bgGradient, icon: Icon }) => {
  return (
    <div className={`${bgGradient} rounded-xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Icon className="text-3xl opacity-80" />
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaArrowTrendUp className="text-green-200" />
            <span className="text-sm opacity-90">Income</span>
          </div>
          <span className="text-xl font-bold">{formatCurrency(income)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaArrowTrendDown className="text-red-200" />
            <span className="text-sm opacity-90">Expense</span>
          </div>
          <span className="text-xl font-bold">{formatCurrency(expenditure)}</span>
        </div>
        
        <div className="border-t border-white border-opacity-30 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FaWallet className="text-yellow-200" />
              <span className="text-sm font-medium">Balance</span>
            </div>
            <span className={`text-2xl font-bold ${balance < 0 ? 'text-red-200' : ''}`}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCards = ({ dashboardData }) => {
  if (!dashboardData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <DashboardCard
        title="Monthly Overview"
        income={dashboardData.monthlySummary?.income}
        expenditure={dashboardData.monthlySummary?.expenditure}
        balance={dashboardData.monthlySummary?.balance}
        bgGradient="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"
        icon={FaWallet}
      />
      
      <DashboardCard
        title="Weekly Overview"
        income={dashboardData.weeklySummary?.income}
        expenditure={dashboardData.weeklySummary?.expenditure}
        balance={dashboardData.weeklySummary?.balance}
        bgGradient="bg-gradient-to-br from-green-500 via-green-600 to-green-700"
        icon={FaWallet}
      />
      
      <DashboardCard
        title="Yearly Overview"
        income={dashboardData.yearlySummary?.income}
        expenditure={dashboardData.yearlySummary?.expenditure}
        balance={dashboardData.yearlySummary?.balance}
        bgGradient="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700"
        icon={FaWallet}
      />
    </div>
  );
};

export default DashboardCards;
