import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
//  API CLIENT
//
//  Single source of truth for every HTTP call in the app.
//  Handles: auth headers, token expiry, rate limiting, retries, timeouts.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8081/api";

// ── How many times to retry a failed request before giving up ────────────────
const MAX_RETRIES = 2;

// ── Which HTTP status codes are safe to retry ────────────────────────────────
// 429 = rate limited (wait then retry)
// 502/503/504 = server temporarily unavailable
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  // Fail fast instead of hanging forever.
  // 15 s is generous — most endpoints respond in < 500 ms.
  timeout: 15000,
});

// ─────────────────────────────────────────────────────────────────────────────
//  REQUEST INTERCEPTOR
//  Attaches the JWT on every outgoing request so callers never have to
//  remember to pass it manually.
// ─────────────────────────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Stamp the initial attempt count so the response interceptor can retry
    config._retryCount = config._retryCount ?? 0;
    return config;
  },
  (error) => Promise.reject(normalizeError(error)),
);

// ─────────────────────────────────────────────────────────────────────────────
//  RESPONSE INTERCEPTOR
//  Central place for:
//    401 → token expired / invalid → clear storage and redirect to login
//    429 → rate limited → wait, then retry (up to MAX_RETRIES times)
//    502/503/504 → server blip → retry with exponential back-off
//    Network error → offline or backend unreachable → readable message
//    Everything else → normalize into a consistent error shape
// ─────────────────────────────────────────────────────────────────────────────
api.interceptors.response.use(
  // Success — pass through unchanged
  (response) => response,

  async (error) => {
    const config = error.config;
    const status = error.response?.status;

    // ── 401: token expired or invalid ──────────────────────────────────────
    // Guard: only redirect if we actually had a token. This prevents a
    // redirect loop when the /login endpoint itself returns 401 on bad creds
    // (the login request is made without a token, so we should NOT redirect).
    if (status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      window.location.href = "/";
      return Promise.reject(normalizeError(error));
    }

    // ── Retry logic for transient failures ─────────────────────────────────
    // Don't retry if:
    //   - Status isn't in the retryable set
    //   - We've already hit the retry limit
    //   - The original request was a mutation that could have side effects
    //     (POST/PUT/DELETE) — only retry safe read operations (GET/HEAD)
    const isSafeMethod = ["get", "head"].includes(
      config?.method?.toLowerCase(),
    );
    const shouldRetry =
      config &&
      RETRYABLE_STATUSES.has(status) &&
      config._retryCount < MAX_RETRIES &&
      isSafeMethod;

    if (shouldRetry) {
      config._retryCount += 1;

      // Exponential back-off: 1 s, 2 s, 4 s …
      // For 429 specifically, honour the Retry-After header if present.
      const retryAfterHeader = error.response?.headers?.["retry-after"];
      const backoffMs = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1000
        : Math.pow(2, config._retryCount - 1) * 1000;

      await sleep(backoffMs);
      return api(config);
    }

    // ── Everything else — normalize and reject ──────────────────────────────
    return Promise.reject(normalizeError(error));
  },
);

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts any axios error into a consistent shape so every component
 * can safely read `err.message` and `err.status` without null-checking.
 *
 * Before: callers wrote `err.response?.data?.message || "Something went wrong"`
 * After:  callers just write `err.message`
 */
function normalizeError(error) {
  // Already normalized (e.g. re-thrown from a retry)
  if (error._normalized) return error;

  const status = error.response?.status;
  const data = error.response?.data;

  // Pick the most useful message in priority order
  const message =
    data?.message || // backend sent { message: "..." }
    data?.error || // backend sent { error: "..." }
    error.message || // axios built-in (e.g. timeout)
    "Something went wrong. Please try again.";

  // Human-readable override for common cases
  const friendlyMessage = getFriendlyMessage(status, message, error);

  const normalized = new Error(friendlyMessage);
  normalized.status = status;
  normalized.originalMessage = message;
  normalized.response = error.response;
  normalized._normalized = true;

  return normalized;
}

function getFriendlyMessage(status, originalMessage, error) {
  // Network error — no response at all (offline, CORS, backend down)
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please check your connection and try again.";
    }
    return "Unable to reach the server. Please check your internet connection.";
  }

  switch (status) {
    case 400:
      return originalMessage || "Invalid request. Please check your input.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return (
        originalMessage || "A conflict occurred. Please refresh and try again."
      );
    case 429:
      return (
        originalMessage ||
        "Too many requests. Please wait a moment and try again."
      );
    case 500:
      return "Server error. Please try again in a moment.";
    case 502:
    case 503:
    case 504:
      return "The server is temporarily unavailable. Please try again shortly.";
    default:
      return originalMessage || "Something went wrong. Please try again.";
  }
}

/**
 * Strips undefined/null values from a params object so they don't get
 * serialized as the string "undefined" in query strings.
 *
 * e.g. { type: "INCOME", division: undefined }
 *   → { type: "INCOME" }
 */
function cleanParams(params) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH SERVICE HELPERS
//  Called from authService.js — kept here so the token is wired into
//  Axios immediately after login without a second import chain.
// ─────────────────────────────────────────────────────────────────────────────

export function setAuthHeader(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}

export function clearAuthHeader() {
  delete api.defaults.headers.common["Authorization"];
}

// ─────────────────────────────────────────────────────────────────────────────
//  TRANSACTION API
// ─────────────────────────────────────────────────────────────────────────────

export const transactionAPI = {
  /** Full dashboard payload: totals, period summaries, all transactions */
  getDashboardData: () => api.get("/transactions/dashboard"),

  /** Create a new transaction and update account balance */
  createTransaction: (data) => api.post("/transactions", data),

  /** Update an existing transaction (reverses old balance, applies new) */
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),

  /** Delete a transaction and reverse its balance effect */
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),

  /**
   * Server-side filtered transactions.
   * Undefined/null params are stripped so the query string stays clean.
   */
  getFilteredTransactions: (params) =>
    api.get("/transactions/filter", { params: cleanParams(params) }),
};

// ─────────────────────────────────────────────────────────────────────────────
//  ACCOUNT API
// ─────────────────────────────────────────────────────────────────────────────

export const accountAPI = {
  /** Returns all accounts belonging to the current user */
  getAllAccounts: () => api.get("/accounts"),

  /** Create a new named account with an opening balance */
  createAccount: (data) => api.post("/accounts", data),

  /** Delete an account (backend verifies ownership) */
  deleteAccount: (id) => api.delete(`/accounts/${id}`),

  /** Transfer between two of the user's own accounts */
  transfer: (data) => api.post("/accounts/transfer", data),
};

// ─────────────────────────────────────────────────────────────────────────────
//  RECURRING TRANSACTION API
// ─────────────────────────────────────────────────────────────────────────────

export const recurringAPI = {
  /** List all recurring transactions for the current user */
  getAll: () => api.get("/recurring"),

  /** Create a new recurring transaction template */
  create: (data) => api.post("/recurring", data),

  /** Toggle a recurring transaction between active and paused */
  toggle: (id) => api.patch(`/recurring/${id}/toggle`),

  /** Manually trigger one immediate run of a recurring transaction */
  runNow: (id) => api.post(`/recurring/${id}/run`),

  /** Permanently remove a recurring transaction (does not affect past records) */
  delete: (id) => api.delete(`/recurring/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORY API
// ─────────────────────────────────────────────────────────────────────────────

export const categoryAPI = {
  /** All categories (both INCOME and EXPENSE) for the current user */
  getAll: () => api.get("/categories"),

  /** Categories filtered by type: "INCOME" or "EXPENSE" */
  getByType: (type) => api.get("/categories/by-type", { params: { type } }),

  /** Create a custom category with optional subcategories */
  create: (data) => api.post("/categories", data),

  /** Append a subcategory name to an existing category */
  addSubCategory: (id, name) =>
    api.post(`/categories/${id}/subcategories`, { name }),

  /** Remove a specific subcategory by name */
  removeSubCategory: (id, subName) =>
    api.delete(`/categories/${id}/subcategories/${subName}`),

  /** Delete a custom category (default categories are protected server-side) */
  delete: (id) => api.delete(`/categories/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH API
//  Unauthenticated endpoints — no token required.
// ─────────────────────────────────────────────────────────────────────────────

export const authAPI = {
  /** Send a 6-digit OTP to the given email for password reset */
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),

  /** Verify OTP and set a new password */
  resetPassword: (email, otp, newPassword) =>
    api.post("/auth/reset-password", { email, otp, newPassword }),

  /** Change password for the currently logged-in user (requires JWT) */
  changePassword: (currentPassword, newPassword) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};
// ADD this block to src/services/api.js
// Place it after the categoryAPI block and before `export default api`

// ─────────────────────────────────────────────────────────────────────────────
//  BUDGET API
//  FIX #18 — Budget limits now synced to MongoDB via the backend.
//  Previously everything was localStorage-only.
// ─────────────────────────────────────────────────────────────────────────────

export const budgetAPI = {
  /** All budgets for the current user */
  getAll: () => api.get("/budgets"),

  /**
   * Create or update a budget limit.
   * Uses PUT because the operation is an upsert — safe to call multiple times.
   *
   * @param {string} categoryName  - e.g. "FOOD", "FUEL"
   * @param {number} limitAmount   - spending limit in rupees
   * @param {string} resetType     - "MONTHLY" | "FIXED"
   */
  upsert: (categoryName, limitAmount, resetType) =>
    api.put("/budgets", { categoryName, limitAmount, resetType }),

  /** Delete budget by document ID */
  delete: (id) => api.delete(`/budgets/${id}`),

  /**
   * Delete by category name — avoids a round-trip GET just to find the ID.
   * The BudgetCard only knows the category name, not the MongoDB _id.
   */
  deleteByCategory: (categoryName) =>
    api.delete(`/budgets/category/${categoryName}`),
};

export default api;
