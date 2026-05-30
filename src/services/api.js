import axios from 'axios';

// Base URL - change this to your deployed backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

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
// Add this to api.js
export const recurringAPI = {
    getAll:    ()       => api.get("/recurring"),
    create:    (data)   => api.post("/recurring", data),
    toggle:    (id)     => api.patch(`/recurring/${id}/toggle`),
    runNow:    (id)     => api.post(`/recurring/${id}/run`),
    delete:    (id)     => api.delete(`/recurring/${id}`),
};
// Add to src/services/api.js
export const categoryAPI = {
  getAll:           ()              => api.get("/categories"),
  getByType:        (type)          => api.get(`/categories/by-type?type=${type}`),
  create:           (data)          => api.post("/categories", data),
  addSubCategory:   (id, name)      => api.post(`/categories/${id}/subcategories`, { name }),
  removeSubCategory:(id, subName)   => api.delete(`/categories/${id}/subcategories/${subName}`),
  delete:           (id)            => api.delete(`/categories/${id}`),
};
// Add this to your existing api.js file
export const authAPI = {
  forgotPassword: (email) => 
    api.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp, newPassword) => 
    api.post('/auth/reset-password', { email, otp, newPassword }),
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
};
// Add this at the bottom of api.js — AFTER the api instance is created

api.interceptors.response.use(
  response => response,   // pass through successful responses
  error => {
    // If token expired or invalid → auto logout everywhere
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      window.location.href = "/";   // force full reload back to login
    }
    return Promise.reject(error);
  }
);
export default api;
