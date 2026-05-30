const PING_INTERVAL_MS = 14 * 60 * 1000;
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8081/api";

let intervalId = null;

async function ping() {
  try {
    await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "keepalive@ping.internal" }),
    });
  } catch {
    // server may be starting up — will retry next interval
  }
}

export function startKeepAlive() {
  if (intervalId) return;
  ping();
  intervalId = setInterval(ping, PING_INTERVAL_MS);
}

export function stopKeepAlive() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
