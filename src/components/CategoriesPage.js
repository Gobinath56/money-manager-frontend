import React, { useState, useEffect } from "react";
import { categoryAPI } from "../services/api";

// ── Suggested categories shown to every user ───────────────────────────────
// These are displayed as quick-pick chips before the user has created anything.
// Clicking one adds it to their account with default subcategories.
const SUGGESTIONS = {
  EXPENSE: [
    {
      name: "FOOD",
      icon: "🍔",
      subs: [
        "Breakfast",
        "Lunch",
        "Dinner",
        "Snacks",
        "Groceries",
        "Restaurant",
      ],
    },
    {
      name: "FUEL",
      icon: "⛽",
      subs: ["Petrol", "Diesel", "EV Charge", "CNG"],
    },
    {
      name: "TRIP",
      icon: "✈️",
      subs: ["Travel", "Hotel", "Food", "Activities", "Shopping", "Transport"],
    },
    {
      name: "MEDICAL",
      icon: "🏥",
      subs: ["Medicine", "Doctor", "Lab Test", "Hospital", "Insurance"],
    },
    {
      name: "MOVIE",
      icon: "🎬",
      subs: ["Cinema", "OTT", "Events", "Concerts"],
    },
    { name: "LOAN", icon: "💳", subs: ["EMI", "Interest", "Credit Card"] },
    {
      name: "SHOPPING",
      icon: "🛍️",
      subs: ["Clothes", "Electronics", "Home", "Gifts"],
    },
    {
      name: "EDUCATION",
      icon: "📚",
      subs: ["Fees", "Books", "Online Course", "Stationery"],
    },
    {
      name: "UTILITIES",
      icon: "💡",
      subs: ["Electricity", "Water", "Internet", "Mobile"],
    },
    {
      name: "RENT",
      icon: "🏠",
      subs: ["House Rent", "Maintenance", "Parking"],
    },
    {
      name: "FITNESS",
      icon: "💪",
      subs: ["Gym", "Supplements", "Equipment", "Sports"],
    },
    { name: "OTHER", icon: "📦", subs: [] },
  ],
  INCOME: [
    {
      name: "SALARY",
      icon: "💰",
      subs: ["Basic Pay", "Bonus", "Allowance", "Overtime"],
    },
    {
      name: "FREELANCE",
      icon: "💼",
      subs: ["Project", "Consultation", "Contract"],
    },
    {
      name: "INVESTMENT",
      icon: "📈",
      subs: ["Dividend", "Interest", "Capital Gains", "Returns"],
    },
    {
      name: "BUSINESS",
      icon: "🏢",
      subs: ["Sales", "Commission", "Partnership"],
    },
    { name: "RENTAL", icon: "🏘️", subs: ["House Rent", "Shop Rent", "Land"] },
    { name: "OTHER", icon: "➕", subs: [] },
  ],
};

// ── Colour for each type tab ───────────────────────────────────────────────
const TYPE_COLOR = { INCOME: "#10B981", EXPENSE: "#EF4444" };

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  page: {
    padding: "20px 16px",
    color: "#E8EDF5",
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: "#F0F4FF",
    margin: "0 0 4px",
    letterSpacing: "-0.4px",
  },
  sub: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 24 },

  // Tab row — INCOME / EXPENSE switcher
  tabs: {
    display: "flex",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    maxWidth: 320,
  },
  tab: (active, color) => ({
    flex: 1,
    padding: "9px 0",
    border: "none",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    cursor: "pointer",
    background: active ? color + "22" : "transparent",
    color: active ? color : "rgba(255,255,255,0.35)",
    transition: "all 0.15s",
  }),

  // Section card
  card: {
    background: "#0D1117",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "20px 22px",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 14,
  },

  // Suggestion chips
  chipGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: (added) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.15s",
    background: added ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
    border: added
      ? "1px solid rgba(16,185,129,0.3)"
      : "1px solid rgba(255,255,255,0.1)",
    color: added ? "#10B981" : "rgba(255,255,255,0.6)",
  }),
  chipIcon: { fontSize: 14 },

  // User's category cards grid
  catGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 12,
  },
  catCard: (color) => ({
    background: "#0D1117",
    border: `1px solid ${color}22`,
    borderLeft: `3px solid ${color}`,
    borderRadius: 14,
    padding: "16px 18px",
  }),
  catHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  catName: { fontSize: 15, fontWeight: 500, color: "#F0F4FF" },
  catBadge: (isCustom) => ({
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 10,
    background: isCustom ? "rgba(99,179,255,0.15)" : "rgba(255,255,255,0.06)",
    color: isCustom ? "#63B3FF" : "rgba(255,255,255,0.3)",
    border: isCustom
      ? "1px solid rgba(99,179,255,0.25)"
      : "1px solid rgba(255,255,255,0.08)",
  }),

  // Subcategory pills inside a category card
  subWrap: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  subPill: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 10px",
    borderRadius: 20,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  subDel: {
    background: "none",
    border: "none",
    color: "rgba(239,68,68,0.5)",
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
    lineHeight: 1,
  },

  // Add subcategory inline input
  addSubRow: { display: "flex", gap: 6, marginTop: 4 },
  addSubInput: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "6px 10px",
    color: "#E8EDF5",
    fontSize: 12,
    outline: "none",
  },
  addSubBtn: (color) => ({
    background: color + "22",
    border: `1px solid ${color}44`,
    color,
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 500,
    whiteSpace: "nowrap",
  }),
  deleteBtn: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#EF4444",
    borderRadius: 8,
    padding: "5px 10px",
    fontSize: 11,
    cursor: "pointer",
    marginTop: 8,
  },

  // Create new category form
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9,
    padding: "10px 13px",
    color: "#F0F4FF",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 10,
  },
  label: {
    display: "block",
    fontSize: 10,
    fontWeight: 500,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 6,
  },
  createBtn: (color) => ({
    padding: "10px 20px",
    background: `linear-gradient(135deg, ${color}, ${color}CC)`,
    border: "none",
    borderRadius: 9,
    color: "#fff",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  }),
  spinner: {
    width: 20,
    height: 20,
    border: "2px solid rgba(99,179,255,0.2)",
    borderTopColor: "#63B3FF",
    borderRadius: "50%",
    margin: "20px auto",
    animation: "spin 0.8s linear infinite",
  },
};

export default function CategoriesPage({ showToast }) {
  const [activeType, setActiveType] = useState("EXPENSE");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [newCatName, setNewCatName] = useState("");
  const [newCatSubs, setNewCatSubs] = useState(""); // comma-separated
  const [creating, setCreating] = useState(false);

  // Per-card "add subcategory" input state: { [categoryId]: inputValue }
  const [subInputs, setSubInputs] = useState({});

  // ── Fetch categories on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Filter by active type tab ──────────────────────────────────────────────
  const filtered = categories.filter((c) => c.type === activeType);

  // Names of categories the user already has (to mark suggestion chips)
  const existingNames = new Set(filtered.map((c) => c.name));

  // ── Add a suggestion chip ─────────────────────────────────────────────────
  // When user clicks a suggestion, create it with its default subcategories
  const handleAddSuggestion = async (suggestion) => {
    if (existingNames.has(suggestion.name)) return; // already added
    try {
      await categoryAPI.create({
        name: suggestion.name,
        type: activeType,
        subCategories: suggestion.subs,
      });
      showToast(`${suggestion.name} added`);
      fetchCategories();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to add category",
        "error",
      );
    }
  };

  // ── Create a brand new custom category ───────────────────────────────────
  const handleCreate = async () => {
    if (!newCatName.trim()) {
      showToast("Enter a category name", "error");
      return;
    }
    setCreating(true);
    try {
      // Parse comma-separated subcategories: "Travel, Hotel, Food" → ["Travel", "Hotel", "Food"]
      const subs = newCatSubs
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await categoryAPI.create({
        name: newCatName.trim().toUpperCase(),
        type: activeType,
        subCategories: subs,
      });
      showToast(`Category "${newCatName.toUpperCase()}" created`);
      setNewCatName("");
      setNewCatSubs("");
      fetchCategories();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create category",
        "error",
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Add a subcategory to an existing category ─────────────────────────────
  const handleAddSub = async (catId, subName) => {
    if (!subName?.trim()) return;
    try {
      await categoryAPI.addSubCategory(catId, subName.trim());
      // Clear that card's input
      setSubInputs((prev) => ({ ...prev, [catId]: "" }));
      fetchCategories();
    } catch {
      showToast("Failed to add subcategory", "error");
    }
  };

  // ── Remove a subcategory ──────────────────────────────────────────────────
  const handleRemoveSub = async (catId, subName) => {
    try {
      await categoryAPI.removeSubCategory(catId, subName);
      fetchCategories();
    } catch {
      showToast("Failed to remove subcategory", "error");
    }
  };

  // ── Delete a custom category ──────────────────────────────────────────────
  const handleDeleteCategory = async (cat) => {
    if (!cat.custom) {
      showToast("Default categories cannot be deleted", "error");
      return;
    }
    try {
      await categoryAPI.delete(cat.id);
      showToast(`"${cat.name}" deleted`);
      fetchCategories();
    } catch {
      showToast("Failed to delete category", "error");
    }
  };

  const color = TYPE_COLOR[activeType];
  const suggestions = SUGGESTIONS[activeType];

  return (
    <div style={S.page}>
      <h1 style={S.title}>Categories</h1>
      <p style={S.sub}>
        Customise your income and expense categories and subcategories
      </p>

      {/* ── Type tab switcher ── */}
      <div style={S.tabs}>
        {["EXPENSE", "INCOME"].map((t) => (
          <button
            key={t}
            style={S.tab(activeType === t, TYPE_COLOR[t])}
            onClick={() => setActiveType(t)}
          >
            {t === "EXPENSE" ? "💸 Expense" : "💰 Income"}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          SUGGESTIONS — quick pick chips
          Marked as ✓ if already in user's list
      ════════════════════════════════════════ */}
      <div style={S.card}>
        <div style={S.cardTitle}>Suggested categories — click to add</div>
        <div style={S.chipGrid}>
          {suggestions.map((s) => {
            const added = existingNames.has(s.name);
            return (
              <button
                key={s.name}
                style={S.chip(added)}
                onClick={() => handleAddSuggestion(s)}
                disabled={added}
                title={added ? "Already added" : `Add ${s.name}`}
              >
                <span style={S.chipIcon}>{s.icon}</span>
                {s.name.charAt(0) + s.name.slice(1).toLowerCase()}
                {added && " ✓"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════
          CREATE NEW CUSTOM CATEGORY
      ════════════════════════════════════════ */}
      <div style={S.card}>
        <div style={S.cardTitle}>Create a new custom category</div>

        <label style={S.label}>Category name</label>
        <input
          style={S.input}
          placeholder={
            activeType === "EXPENSE"
              ? "e.g. PARTY, PETS, HOBBY"
              : "e.g. SIDE HUSTLE, GIFT"
          }
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />

        <label style={S.label}>
          Subcategories (optional — comma separated)
        </label>
        <input
          style={S.input}
          placeholder={
            activeType === "EXPENSE"
              ? "e.g. Birthday, Anniversary, Get-together"
              : "e.g. YouTube, Instagram, Podcast"
          }
          value={newCatSubs}
          onChange={(e) => setNewCatSubs(e.target.value)}
        />

        <button
          style={S.createBtn(color)}
          onClick={handleCreate}
          disabled={creating}
        >
          {creating
            ? "Creating…"
            : `+ Create ${activeType.toLowerCase()} category`}
        </button>
      </div>

      {/* ════════════════════════════════════════
          USER'S CATEGORIES
          Shows all categories with their subcategories.
          Each subcategory has a × to remove it.
          Each category has an input to add more subcategories.
      ════════════════════════════════════════ */}
      <div
        style={{
          ...S.card,
          background: "transparent",
          border: "none",
          padding: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 14,
          }}
        >
          Your {activeType.toLowerCase()} categories ({filtered.length})
        </div>

        {loading ? (
          <div style={S.spinner} />
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 0",
              color: "rgba(255,255,255,0.2)",
              fontSize: 13,
            }}
          >
            No categories yet — add from suggestions above or create a custom
            one
          </div>
        ) : (
          <div style={S.catGrid}>
            {filtered.map((cat) => (
              <div key={cat.id} style={S.catCard(color)}>
                {/* Category header */}
                <div style={S.catHeader}>
                  <div>
                    <div style={S.catName}>
                      {/* Show emoji if it matches a suggestion */}
                      {suggestions.find((s) => s.name === cat.name)?.icon ||
                        "📁"}{" "}
                      {cat.name.charAt(0) + cat.name.slice(1).toLowerCase()}
                    </div>
                  </div>
                  <span style={S.catBadge(cat.custom)}>
                    {cat.custom ? "Custom" : "Default"}
                  </span>
                </div>

                {/* Subcategory pills */}
                {cat.subCategories && cat.subCategories.length > 0 ? (
                  <div style={S.subWrap}>
                    {cat.subCategories.map((sub) => (
                      <div key={sub} style={S.subPill}>
                        <span>{sub}</span>
                        <button
                          style={S.subDel}
                          onClick={() => handleRemoveSub(cat.id, sub)}
                          title={`Remove ${sub}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.2)",
                      marginBottom: 10,
                    }}
                  >
                    No subcategories yet
                  </div>
                )}

                {/* Add subcategory inline */}
                <div style={S.addSubRow}>
                  <input
                    style={S.addSubInput}
                    placeholder="Add subcategory…"
                    value={subInputs[cat.id] || ""}
                    onChange={(e) =>
                      setSubInputs((prev) => ({
                        ...prev,
                        [cat.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        handleAddSub(cat.id, subInputs[cat.id]);
                    }}
                  />
                  <button
                    style={S.addSubBtn(color)}
                    onClick={() => handleAddSub(cat.id, subInputs[cat.id])}
                  >
                    + Add
                  </button>
                </div>

                {/* Delete button — only for custom categories */}
                {cat.custom && (
                  <button
                    style={S.deleteBtn}
                    onClick={() => handleDeleteCategory(cat)}
                  >
                    Delete category
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
