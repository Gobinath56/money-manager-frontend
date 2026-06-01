// src/services/keepAlive.js
//
// FIX #13: Was hitting /api/auth/forgot-password every 14 minutes.
// That endpoint creates a PasswordResetToken document in MongoDB on every call,
// so 10 logged-in users × 14 min interval × 8 hours = ~340 ghost tokens/day.
//
// Now hits GET /api/health instead:
//   - No database writes at all (pure in-memory response)
//   - No token required (publicly accessible)
//   - Tiny 2-field JSON response — minimal bandwidth
//   - Still keeps the free-tier server (Render/Railway) from sleeping

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8081/api";

let intervalId = null;

async function ping() {
  try {
    await fetch(`${API_BASE}/health`, {
      method: "GET",
      // No body, no auth header — just a lightweight GET
    });
  } catch {
    // Server may be starting up — will retry on next interval.
    // Silently swallow network errors so the app doesn't log noise.
  }
}

export function startKeepAlive() {
  if (intervalId) return; // already running — don't double-start
  ping(); // fire immediately so the server is warm right away
  intervalId = setInterval(ping, PING_INTERVAL_MS);
}

export function stopKeepAlive() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
