import React from "react";

// ── Bottom navigation — mobile only ───────────────────────────────────────
// Shown on screens < 769px via CSS media query.
// Mimics native mobile app navigation (like Instagram, Google Maps).
// Each item taps to switch the active page.

const NAV = [
  { id: "dashboard",    icon: "▦", label: "Home"     },
  { id: "transactions", icon: "↕", label: "History"  },
  { id: "analytics",   icon: "◉", label: "Analytics" },
  { id: "budget",      icon: "◎", label: "Budget"    },
  { id: "recurring",   icon: "↺", label: "Recurring" },
];

export default function BottomNav({ activePage, setActivePage, onAddTransaction }) {
  return (
    <>
      {/* ── The nav bar ── */}
      <div className="bottom-nav">

        {NAV.map((item, i) => {
          // Insert the FAB (floating add button) in the middle position
          const isMiddle = i === 2;
          const isActive = activePage === item.id;

          return (
            <React.Fragment key={item.id}>
              {/* FAB — Add transaction button in the centre */}
              {isMiddle && (
                <button
                  className="bottom-nav-fab"
                  onClick={onAddTransaction}
                  aria-label="Add transaction"
                >
                  +
                </button>
              )}

              {/* Nav item */}
              <button
                className={`bottom-nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActivePage(item.id)}
                aria-label={item.label}
              >
                <span className="bottom-nav-icon">{item.icon}</span>
                <span className="bottom-nav-label">{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Styles ── */}
      <style>{`
        .bottom-nav {
          display: none; /* hidden on desktop */
        }

        @media (max-width: 768px) {
          .bottom-nav {
            display: flex;
            align-items: center;
            justify-content: space-around;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            height: 60px;
            background: #0D1117;
            border-top: 1px solid rgba(255,255,255,0.08);
            z-index: 150;
            padding: 0 4px;
            padding-bottom: env(safe-area-inset-bottom); /* iPhone notch support */
          }

          /* Each nav item */
          .bottom-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            flex: 1;
            height: 100%;
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px 0;
            transition: color 0.15s;
            color: rgba(255,255,255,0.35);
            font-family: 'DM Sans', 'Segoe UI', sans-serif;
          }

          .bottom-nav-item.active {
            color: #63B3FF;
          }

          .bottom-nav-icon {
            font-size: 16px;
            line-height: 1;
          }

          .bottom-nav-label {
            font-size: 9px;
            font-weight: 500;
            letter-spacing: 0.03em;
            text-transform: uppercase;
          }

          /* FAB — the blue + button in the centre */
          .bottom-nav-fab {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #1E6FD9, #0D4FA8);
            border: none;
            color: #fff;
            font-size: 26px;
            line-height: 1;
            cursor: pointer;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(30,111,217,0.4);
            margin-bottom: 8px; /* lifts it above the bar */
            transition: transform 0.15s;
          }

          .bottom-nav-fab:active {
            transform: scale(0.92);
          }
        }
      `}</style>
    </>
  );
}