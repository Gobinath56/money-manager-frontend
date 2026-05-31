// ─────────────────────────────────────────────────────────────────────────────
//  CoinWise Service Worker Registration
//  Place this file at: src/serviceWorkerRegistration.js
// ─────────────────────────────────────────────────────────────────────────────

const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
  window.location.hostname === "[::1]" ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,
  ),
);

/**
 * Call this from src/index.js to register the service worker.
 * Pass a config object with optional callbacks:
 *   onSuccess(registration) — called when SW is installed and content is cached
 *   onUpdate(registration)  — called when a new SW is waiting to activate
 */
export function register(config) {
  if (process.env.NODE_ENV !== "production") {
    // Don't register SW in development — causes confusing caching behaviour
    console.log("[CoinWise SW] Skipping registration in development mode.");
    return;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn(
      "[CoinWise SW] Service workers not supported in this browser.",
    );
    return;
  }

  window.addEventListener("load", () => {
    const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

    if (isLocalhost) {
      // On localhost, verify the SW still exists (dev server might have restarted)
      checkValidServiceWorker(swUrl, config);
      navigator.serviceWorker.ready.then(() => {
        console.log(
          "[CoinWise SW] App is being served cache-first by a service worker.",
        );
      });
    } else {
      registerValidSW(swUrl, config);
    }
  });
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // ── Check for updates every time the page loads ────────────────────
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              // New SW installed, old content still served until page reload
              console.log(
                "[CoinWise SW] New content available. Will update on next visit.",
              );
              if (config?.onUpdate) config.onUpdate(registration);
            } else {
              // First time install — content cached for offline use
              console.log("[CoinWise SW] Content cached for offline use.");
              if (config?.onSuccess) config.onSuccess(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error("[CoinWise SW] Registration failed:", error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { "Service-Worker": "script" } })
    .then((response) => {
      const contentType = response.headers.get("content-type");
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf("javascript") === -1)
      ) {
        // SW not found — reload to get a fresh page without SW
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => window.location.reload());
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        "[CoinWise SW] No internet connection. App running in offline mode.",
      );
    });
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => console.error(error.message));
  }
}
