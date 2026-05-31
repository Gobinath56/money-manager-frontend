import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { register as registerSW } from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// ── Register Service Worker ──────────────────────────────────────────────────
// Only active in production builds (Vercel deployment).
// API calls (/api/**) are never cached — see public/sw.js for routing strategy.
registerSW({
  onSuccess: (registration) => {
    console.log("[CoinWise] App ready for offline use.");
  },
  onUpdate: (registration) => {
    // A new version of CoinWise is available.
    // The app will update automatically on next page load.
    console.log("[CoinWise] New version available. Refresh to update.");
  },
});
