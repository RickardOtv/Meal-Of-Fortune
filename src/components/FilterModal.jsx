import { useState, useEffect } from "react";
import { SearchIcon } from "./icons";
import { DEFAULT_FILTERS } from "../filters";

const CUISINE_TYPES = [
  { value: "american_restaurant", label: "American" },
  { value: "asian_restaurant", label: "Asian" },
  { value: "barbecue_restaurant", label: "BBQ" },
  { value: "brazilian_restaurant", label: "Brazilian" },
  { value: "breakfast_restaurant", label: "Breakfast" },
  { value: "brunch_restaurant", label: "Brunch" },
  { value: "chinese_restaurant", label: "Chinese" },
  { value: "ethiopian_restaurant", label: "Ethiopian" },
  { value: "fast_food_restaurant", label: "Fast Food" },
  { value: "fine_dining_restaurant", label: "Fine Dining" },
  { value: "french_restaurant", label: "French" },
  { value: "greek_restaurant", label: "Greek" },
  { value: "hamburger_restaurant", label: "Burgers" },
  { value: "indian_restaurant", label: "Indian" },
  { value: "indonesian_restaurant", label: "Indonesian" },
  { value: "italian_restaurant", label: "Italian" },
  { value: "japanese_restaurant", label: "Japanese" },
  { value: "korean_restaurant", label: "Korean" },
  { value: "lebanese_restaurant", label: "Lebanese" },
  { value: "mediterranean_restaurant", label: "Mediterranean" },
  { value: "mexican_restaurant", label: "Mexican" },
  { value: "middle_eastern_restaurant", label: "Middle Eastern" },
  { value: "pizza_restaurant", label: "Pizza" },
  { value: "ramen_restaurant", label: "Ramen" },
  { value: "seafood_restaurant", label: "Seafood" },
  { value: "spanish_restaurant", label: "Spanish" },
  { value: "steak_house", label: "Steak" },
  { value: "sushi_restaurant", label: "Sushi" },
  { value: "thai_restaurant", label: "Thai" },
  { value: "turkish_restaurant", label: "Turkish" },
  { value: "vegan_restaurant", label: "Vegan" },
  { value: "vegetarian_restaurant", label: "Vegetarian" },
  { value: "vietnamese_restaurant", label: "Vietnamese" },
];

// Shown by default; the full list is one tap or a search away.
const POPULAR_CUISINES = new Set([
  "italian_restaurant",
  "japanese_restaurant",
  "chinese_restaurant",
  "mexican_restaurant",
  "indian_restaurant",
  "thai_restaurant",
  "pizza_restaurant",
  "hamburger_restaurant",
  "sushi_restaurant",
  "mediterranean_restaurant",
]);

const PRICE_LEVELS = [
  { value: "PRICE_LEVEL_INEXPENSIVE", label: "$" },
  { value: "PRICE_LEVEL_MODERATE", label: "$$" },
  { value: "PRICE_LEVEL_EXPENSIVE", label: "$$$" },
  { value: "PRICE_LEVEL_VERY_EXPENSIVE", label: "$$$$" },
];

const RATING_OPTIONS = [
  { value: 3, label: "3+" },
  { value: 3.5, label: "3.5+" },
  { value: 4, label: "4+" },
  { value: 4.5, label: "4.5+" },
];

function isDefault(f) {
  return (
    f.isOpen === DEFAULT_FILTERS.isOpen &&
    f.isRestaurant === DEFAULT_FILTERS.isRestaurant &&
    f.isCafe === DEFAULT_FILTERS.isCafe &&
    (f.priceLevels || []).length === 0 &&
    !f.minRating &&
    (f.cuisineTypes || []).length === 0
  );
}

function toggleIn(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`filter-chip${active ? " active" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Section({ label, count = 0, aside, children }) {
  return (
    <div className="filter-section">
      <div className="filter-section-head">
        <span className="filter-section-label">
          {label}
          {count > 0 && <span className="filter-section-count">{count}</span>}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}

export default function FilterModal({ filters, onApply, onClose }) {
  // Work on a local copy so changes can be discarded
  const [draft, setDraft] = useState({ ...filters });
  const [cuisineQuery, setCuisineQuery] = useState("");
  const [showAllCuisines, setShowAllCuisines] = useState(false);

  // Sync if parent filters change while open
  useEffect(() => {
    setDraft({ ...filters });
  }, [filters]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const priceLevels = draft.priceLevels || [];
  const cuisineTypes = draft.cuisineTypes || [];

  // Keep at least one place type on, otherwise the search silently
  // falls back to "restaurant" which would be confusing.
  function toggleType(key) {
    const other = key === "isRestaurant" ? "isCafe" : "isRestaurant";
    if (draft[key] && !draft[other]) return;
    update({ [key]: !draft[key] });
  }

  const togglePriceLevel = (level) => update({ priceLevels: toggleIn(priceLevels, level) });
  const toggleCuisine = (value) => update({ cuisineTypes: toggleIn(cuisineTypes, value) });

  const query = cuisineQuery.trim().toLowerCase();
  const visibleCuisines = query
    ? CUISINE_TYPES.filter((c) => c.label.toLowerCase().includes(query))
    : showAllCuisines
    ? CUISINE_TYPES
    : CUISINE_TYPES.filter((c) => POPULAR_CUISINES.has(c.value) || cuisineTypes.includes(c.value));

  function handleReset() {
    setDraft({ ...DEFAULT_FILTERS });
    setCuisineQuery("");
    setShowAllCuisines(false);
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  return (
    <div className="filter-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search filters">
      <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <button className="filter-modal-close" onClick={onClose} type="button" aria-label="Close filters">×</button>

        <h2 className="filter-modal-title">Filters</h2>

        <div className="filter-modal-content">
          <div className="filter-switch-row">
            <div>
              <div className="filter-switch-label">Open now</div>
              <div className="filter-switch-hint">Only show places that are open right now</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draft.isOpen}
              aria-label="Open now"
              className={`filter-switch${draft.isOpen ? " active" : ""}`}
              onClick={() => update({ isOpen: !draft.isOpen })}
            >
              <span className="filter-switch-knob" />
            </button>
          </div>

          <div className="filter-modal-divider" />

          <div className="filter-modal-row">
            <div className="filter-modal-col">
              <Section label="Place type">
                <div className="filter-chip-group">
                  <Chip active={draft.isRestaurant} onClick={() => toggleType("isRestaurant")}>Restaurants</Chip>
                  <Chip active={draft.isCafe} onClick={() => toggleType("isCafe")}>Cafes</Chip>
                </div>
              </Section>
            </div>

            <div className="filter-modal-col">
              <Section label="Price">
                <div className="filter-chip-group">
                  <Chip active={priceLevels.length === 0} onClick={() => update({ priceLevels: [] })}>Any</Chip>
                  {PRICE_LEVELS.map((p) => (
                    <Chip key={p.value} active={priceLevels.includes(p.value)} onClick={() => togglePriceLevel(p.value)}>
                      {p.label}
                    </Chip>
                  ))}
                </div>
              </Section>
            </div>
          </div>

          <div className="filter-modal-divider" />

          <Section label="Minimum rating">
            <div className="filter-chip-group">
              <Chip active={!draft.minRating} onClick={() => update({ minRating: 0 })}>Any</Chip>
              {RATING_OPTIONS.map((r) => (
                <Chip key={r.value} active={draft.minRating === r.value} onClick={() => update({ minRating: r.value })}>
                  ★ {r.label}
                </Chip>
              ))}
            </div>
          </Section>

          <div className="filter-modal-divider" />

          <Section
            label="Cuisine"
            count={cuisineTypes.length}
            aside={
              <div className="filter-search">
                <SearchIcon size={14} />
                <input
                  type="text"
                  value={cuisineQuery}
                  onChange={(e) => setCuisineQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && visibleCuisines.length === 1) {
                      toggleCuisine(visibleCuisines[0].value);
                      setCuisineQuery("");
                    }
                  }}
                  placeholder="Search cuisines"
                  aria-label="Search cuisines"
                  autoComplete="off"
                />
                {cuisineQuery && (
                  <button type="button" className="filter-search-clear" onClick={() => setCuisineQuery("")} aria-label="Clear search">
                    ×
                  </button>
                )}
              </div>
            }
          >
            <div className="filter-chip-group">
              {!query && (
                <Chip active={cuisineTypes.length === 0} onClick={() => update({ cuisineTypes: [] })}>Any</Chip>
              )}
              {visibleCuisines.map((c) => (
                <Chip key={c.value} active={cuisineTypes.includes(c.value)} onClick={() => toggleCuisine(c.value)}>
                  {c.label}
                </Chip>
              ))}
              {!query && (
                <button
                  type="button"
                  className="filter-chip ghost"
                  aria-expanded={showAllCuisines}
                  onClick={() => setShowAllCuisines((v) => !v)}
                >
                  {showAllCuisines ? "Show fewer" : `All ${CUISINE_TYPES.length} cuisines`}
                </button>
              )}
            </div>
            {query && visibleCuisines.length === 0 && (
              <div className="filter-empty">No cuisines match “{cuisineQuery.trim()}”</div>
            )}
          </Section>
        </div>

        <div className="filter-modal-footer">
          <button type="button" className="filter-reset-btn" onClick={handleReset} disabled={isDefault(draft)}>
            Reset
          </button>
          <button type="button" className="filter-apply-btn" onClick={handleApply}>
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}
