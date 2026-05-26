import React, { useState, useEffect } from "react";
import { categoryAPI } from "../services/api";

// ─────────────────────────────────────────────────────────────────────────────
//  CategoriesPage
//
//  Layout (top → bottom):
//    1. INCOME / EXPENSE type toggle
//    2. Quick-add chips  — click to add a suggested category with default subs
//    3. Create custom    — one-line form (name + optional subs)
//    4. Your categories  — cards showing subs, with inline add/remove per card
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTIONS = {
  EXPENSE: [
    { name: "FOOD",      icon: "🍔", subs: ["Breakfast","Lunch","Dinner","Snacks","Groceries","Restaurant"] },
    { name: "FUEL",      icon: "⛽", subs: ["Petrol","Diesel","EV Charge","CNG"] },
    { name: "TRIP",      icon: "✈️", subs: ["Travel","Hotel","Food","Activities","Shopping","Transport"] },
    { name: "MEDICAL",   icon: "🏥", subs: ["Medicine","Doctor","Lab Test","Hospital","Insurance"] },
    { name: "MOVIE",     icon: "🎬", subs: ["Cinema","OTT Subscription","Events","Concerts"] },
    { name: "LOAN",      icon: "💳", subs: ["EMI","Interest","Credit Card"] },
    { name: "SHOPPING",  icon: "🛍️", subs: ["Clothes","Electronics","Home","Gifts"] },
    { name: "UTILITIES", icon: "💡", subs: ["Electricity","Water","Internet","Mobile"] },
    { name: "RENT",      icon: "🏠", subs: ["House Rent","Maintenance","Parking"] },
    { name: "FITNESS",   icon: "💪", subs: ["Gym","Supplements","Equipment","Sports"] },
    { name: "EDUCATION", icon: "📚", subs: ["Fees","Books","Online Course","Stationery"] },
    { name: "OTHER",     icon: "📦", subs: [] },
  ],
  INCOME: [
    { name: "SALARY",     icon: "💰", subs: ["Basic Pay","Bonus","Allowance","Overtime"] },
    { name: "FREELANCE",  icon: "💼", subs: ["Project","Consultation","Contract"] },
    { name: "INVESTMENT", icon: "📈", subs: ["Dividend","Interest","Capital Gains","Returns"] },
    { name: "BUSINESS",   icon: "🏢", subs: ["Sales","Commission","Partnership"] },
    { name: "RENTAL",     icon: "🏘️", subs: ["House Rent","Shop Rent","Land"] },
    { name: "OTHER",      icon: "➕", subs: [] },
  ],
};

const ICON_MAP = Object.fromEntries(
  [...SUGGESTIONS.EXPENSE, ...SUGGESTIONS.INCOME].map(s => [s.name, s.icon])
);

// ── Shared style tokens ───────────────────────────────────────────────────
const T = {
  card: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: "16px 18px",
  },
  label: {
    fontSize: 10, fontWeight: 500,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase", letterSpacing: "0.08em",
    marginBottom: 12, display: "block",
  },
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, padding: "9px 12px",
    color: "#E8EDF5", fontSize: 13, outline: "none",
    fontFamily: "inherit",
  },
  pill: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 10px", borderRadius: 20,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: 12, color: "rgba(255,255,255,0.55)",
  },
};

// ── Sub-pill with remove button ───────────────────────────────────────────
function SubPill({ name, onRemove }) {
  return (
    <span style={T.pill}>
      <span>{name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            background: "none", border: "none",
            color: "rgba(239,68,68,0.5)", cursor: "pointer",
            fontSize: 14, lineHeight: 1, padding: "0 1px",
            fontFamily: "inherit", transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(239,68,68,0.5)"}
        >
          ×
        </button>
      )}
    </span>
  );
}

// ── Category card ─────────────────────────────────────────────────────────
function CategoryCard({ cat, accentColor, onAddSub, onRemoveSub, onDelete }) {
  const [subInput, setSubInput] = useState("");
  const icon = ICON_MAP[cat.name] || "📁";
  const display = cat.name.charAt(0) + cat.name.slice(1).toLowerCase();

  function handleAddSub() {
    const val = subInput.trim();
    if (!val) return;
    onAddSub(cat.id, val);
    setSubInput("");
  }

  return (
    <div style={{
      ...T.card,
      borderLeft: `3px solid ${accentColor}`,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#F0F4FF", flex: 1 }}>{display}</span>
        <span style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 20,
          background: cat.custom ? "rgba(99,179,255,0.12)" : "rgba(255,255,255,0.06)",
          color: cat.custom ? "#63B3FF" : "rgba(255,255,255,0.3)",
          border: cat.custom ? "1px solid rgba(99,179,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
        }}>
          {cat.custom ? "Custom" : "Default"}
        </span>
        {cat.custom && (
          <button
            onClick={() => onDelete(cat)}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#EF4444", borderRadius: 6,
              padding: "3px 8px", fontSize: 11,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Remove
          </button>
        )}
      </div>

      {/* Subcategory pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, minHeight: 26 }}>
        {cat.subCategories && cat.subCategories.length > 0
          ? cat.subCategories.map(sub => (
              <SubPill
                key={sub} name={sub}
                onRemove={() => onRemoveSub(cat.id, sub)}
              />
            ))
          : <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No subcategories yet</span>
        }
      </div>

      {/* Add subcategory inline */}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          style={{ ...T.input, flex: 1, fontSize: 12, padding: "6px 10px" }}
          placeholder="Add subcategory…"
          value={subInput}
          onChange={e => setSubInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAddSub()}
        />
        <button
          onClick={handleAddSub}
          style={{
            padding: "6px 12px", borderRadius: 8, cursor: "pointer",
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}44`,
            color: accentColor, fontSize: 12, fontWeight: 500,
            fontFamily: "inherit", whiteSpace: "nowrap",
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// ── Accent colours cycling for category cards ────────────────────────────
const CARD_ACCENTS = [
  "#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6",
  "#EC4899","#14B8A6","#F97316","#6366F1","#84CC16",
];

// ── Main component ────────────────────────────────────────────────────────
export default function CategoriesPage({ showToast }) {
  const [activeType, setActiveType] = useState("EXPENSE");
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Create form
  const [newName, setNewName] = useState("");
  const [newSubs, setNewSubs] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchCategories(); }, []); // eslint-disable-line

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll();
      setCategories(res.data);
    } catch {
      showToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered     = categories.filter(c => c.type === activeType);
  const existingNames = new Set(filtered.map(c => c.name));
  const suggestions  = SUGGESTIONS[activeType];

  // ── Quick-add a suggestion ─────────────────────────────────────────────
  const handleAddSuggestion = async (s) => {
    if (existingNames.has(s.name)) return;
    try {
      await categoryAPI.create({ name: s.name, type: activeType, subCategories: s.subs });
      showToast(`${s.name.charAt(0) + s.name.slice(1).toLowerCase()} added`);
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add category", "error");
    }
  };

  // ── Create custom ──────────────────────────────────────────────────────
  const handleCreate = async () => {
    const name = newName.trim().toUpperCase();
    if (!name) { showToast("Enter a category name", "error"); return; }
    setCreating(true);
    try {
      const subs = newSubs.split(",").map(s => s.trim()).filter(Boolean);
      await categoryAPI.create({ name, type: activeType, subCategories: subs });
      showToast(`${name} created`);
      setNewName(""); setNewSubs("");
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create category", "error");
    } finally {
      setCreating(false);
    }
  };

  // ── Add subcategory ────────────────────────────────────────────────────
  const handleAddSub = async (catId, sub) => {
    try {
      await categoryAPI.addSubCategory(catId, sub);
      fetchCategories();
    } catch { showToast("Failed to add subcategory", "error"); }
  };

  // ── Remove subcategory ─────────────────────────────────────────────────
  const handleRemoveSub = async (catId, sub) => {
    try {
      await categoryAPI.removeSubCategory(catId, sub);
      fetchCategories();
    } catch { showToast("Failed to remove subcategory", "error"); }
  };

  // ── Delete custom category ─────────────────────────────────────────────
  const handleDelete = async (cat) => {
    if (!cat.custom) { showToast("Default categories cannot be deleted", "error"); return; }
    try {
      await categoryAPI.delete(cat.id);
      showToast(`"${cat.name}" removed`);
      fetchCategories();
    } catch { showToast("Failed to delete category", "error"); }
  };

  const expenseColor = "#EF4444";
  const incomeColor  = "#10B981";
  const activeColor  = activeType === "EXPENSE" ? expenseColor : incomeColor;

  return (
    <div className="cat-page-wrap">

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#F0F4FF", margin: "0 0 4px", letterSpacing: "-0.4px" }}>
          Categories
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Organise your transactions with custom income and expense categories.
        </p>
      </div>

      {/* ── Type toggle ── */}
      <div style={{
        display: "flex",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: 4, marginBottom: 28, maxWidth: 340,
      }}>
        {[
          { key: "EXPENSE", label: "💸 Expense", color: expenseColor },
          { key: "INCOME",  label: "💰 Income",  color: incomeColor  },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveType(t.key)}
            style={{
              flex: 1, padding: "9px 0", border: "none", borderRadius: 9,
              fontSize: 13, fontWeight: activeType === t.key ? 500 : 400,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              background: activeType === t.key ? `${t.color}22` : "transparent",
              color: activeType === t.key ? t.color : "rgba(255,255,255,0.35)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════
          SECTION 1 — Quick add chips
      ════════════════════════════ */}
      <div style={{ ...T.card, marginBottom: 16 }}>
        <span style={T.label}>Quick add — click to add with default subcategories</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {suggestions.map(s => {
            const added = existingNames.has(s.name);
            return (
              <button
                key={s.name}
                disabled={added}
                onClick={() => handleAddSuggestion(s)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "6px 14px", borderRadius: 20, cursor: added ? "default" : "pointer",
                  fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                  transition: "all 0.15s",
                  background: added ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
                  border: added ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.1)",
                  color: added ? "#10B981" : "rgba(255,255,255,0.6)",
                  opacity: added ? 0.8 : 1,
                }}
              >
                <span>{s.icon}</span>
                <span>{s.name.charAt(0) + s.name.slice(1).toLowerCase()}</span>
                {added && <span style={{ fontSize: 11, opacity: 0.7 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════
          SECTION 2 — Create custom
      ════════════════════════════ */}
      <div style={{ ...T.card, marginBottom: 24 }}>
        <span style={T.label}>Create a custom category</span>
        <div className="create-form-row">
          <input
            style={{ ...T.input, flex: 2 }}
            placeholder={activeType === "EXPENSE" ? "Name — e.g. PETS, PARTY" : "Name — e.g. ROYALTIES"}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
          <input
            style={{ ...T.input, flex: 3 }}
            placeholder="Subcategories (comma-separated, optional)"
            value={newSubs}
            onChange={e => setNewSubs(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: "9px 20px", borderRadius: 8, cursor: "pointer",
              background: `linear-gradient(135deg, ${activeColor}, ${activeColor}BB)`,
              border: "none", color: "#fff", fontSize: 13, fontWeight: 500,
              fontFamily: "inherit", opacity: creating ? 0.6 : 1, whiteSpace: "nowrap",
            }}
          >
            {creating ? "Adding…" : "+ Create"}
          </button>
        </div>
      </div>

      {/* ════════════════════════════
          SECTION 3 — Your categories
      ════════════════════════════ */}
      <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={T.label}>
          Your {activeType.toLowerCase()} categories
        </span>
        <span style={{
          fontSize: 11, padding: "2px 8px", borderRadius: 20,
          background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)",
          marginTop: -10,
        }}>
          {filtered.length}
        </span>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <div style={{ width: 24, height: 24, border: "2px solid rgba(99,179,255,0.15)", borderTopColor: "#63B3FF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          background: "#0D1117", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, color: "rgba(255,255,255,0.2)", fontSize: 13,
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
          <p>No {activeType.toLowerCase()} categories yet.</p>
          <p style={{ marginTop: 4 }}>Click a chip above to add one, or create a custom category.</p>
        </div>
      ) : (
        <div className="cat-cards-grid">
          {filtered.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              accentColor={CARD_ACCENTS[i % CARD_ACCENTS.length]}
              onAddSub={handleAddSub}
              onRemoveSub={handleRemoveSub}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <style>{`
        .cat-page-wrap {
          padding: 16px;
          min-height: 100vh;
          color: #E8EDF5;
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
        }
        .create-form-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .create-form-row input {
          width: 100%;
          box-sizing: border-box;
        }
        .cat-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 600px) {
          .create-form-row {
            flex-direction: row;
          }
          .create-form-row input {
            width: auto;
          }
        }
        @media (min-width: 640px) {
          .cat-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .cat-page-wrap { padding: 36px 40px; }
          .cat-cards-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}