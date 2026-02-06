import axios from 'axios';

// Base URL - change this to your deployed backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transaction APIs
export const transactionAPI = {
  // Get all transactions
  getAllTransactions: () => api.get('/transactions'),
  
  // Get transaction by ID
  getTransactionById: (id) => api.get(`/transactions/${id}`),
  
  // Create transaction
  createTransaction: (data) => api.post('/transactions', data),
  
  // Update transaction
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),
  
  // Delete transaction
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  
  // Get filtered transactions
  getFilteredTransactions: (params) => api.get('/transactions/filter', { params }),
  
  // Get dashboard data
  getDashboardData: () => api.get('/transactions/dashboard'),
};

// Account APIs
export const accountAPI = {
  // Get all accounts
  getAllAccounts: () => api.get("/accounts"),

  // Create account
  createAccount: (data) => api.post("/accounts", data),
  
  // Delete account
  deleteAccount: (id) => api.delete(`/accounts/${id}`),

  // Transfer between accounts
  transfer: (data) => api.post("/accounts/transfer", data),
};

export default api;
