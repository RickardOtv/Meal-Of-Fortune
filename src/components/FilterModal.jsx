import { useState, useEffect } from "react";

const CUISINE_TYPES = [
  { value: "", label: "Any" },
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

const PRICE_LEVELS = [
  { value: "PRICE_LEVEL_INEXPENSIVE", label: "$" },
  { value: "PRICE_LEVEL_MODERATE", label: "$$" },
  { value: "PRICE_LEVEL_EXPENSIVE", label: "$$$" },
  { value: "PRICE_LEVEL_VERY_EXPENSIVE", label: "$$$$" },
];

const RATING_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 3, label: "3+" },
  { value: 3.5, label: "3.5+" },
  { value: 4, label: "4+" },
  { value: 4.5, label: "4.5+" },
];

const DEFAULT_FILTERS = {
  isOpen: true,
  isRestaurant: true,
  isCafe: false,
  priceLevels: [],
  minRating: 0,
  cuisineType: "",
};

export default function FilterModal({ filters, onApply, onClose }) {
  // Work on a local copy so changes can be discarded
  const [draft, setDraft] = useState({ ...filters });

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

  function togglePriceLevel(level) {
    const current = draft.priceLevels || [];
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    setDraft({ ...draft, priceLevels: updated });
  }

  function handleReset() {
    setDraft({ ...DEFAULT_FILTERS });
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  return (
    <div className="filter-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search filters">
      <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
        <button className="filter-modal-close" onClick={onClose} type="button" aria-label="Close filters">×</button>

        <h2 className="filter-modal-title">Filters</h2>

        <div className="filter-modal-content">
          {/* Open Now toggle */}
          <div className="filter-modal-section">
            <label className="filter-toggle-row">
              <span className="filter-toggle-label">Open Now</span>
              <div className={`filter-toggle-switch ${draft.isOpen ? "active" : ""}`} onClick={() => setDraft({ ...draft, isOpen: !draft.isOpen })}>
                <div className="filter-toggle-knob" />
              </div>
            </label>
          </div>

          <div className="filter-modal-divider" />

          {/* Establishment Type + Price Range side by side */}
          <div className="filter-modal-row">
            <div className="filter-modal-col">
              <div className="filter-modal-section-label">Establishment</div>
              <div className="filter-chip-group">
                <button
                  type="button"
                  className={`filter-chip ${draft.isRestaurant ? "active" : ""}`}
                  onClick={() => setDraft({ ...draft, isRestaurant: !draft.isRestaurant })}
                >
                  Restaurants
                </button>
                <button
                  type="button"
                  className={`filter-chip ${draft.isCafe ? "active" : ""}`}
                  onClick={() => setDraft({ ...draft, isCafe: !draft.isCafe })}
                >
                  Cafes
                </button>
              </div>
            </div>

            <div className="filter-modal-col">
              <div className="filter-modal-section-label">Price Range</div>
              <div className="filter-chip-group">
                {PRICE_LEVELS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    className={`filter-chip ${(draft.priceLevels || []).includes(p.value) ? "active" : ""}`}
                    onClick={() => togglePriceLevel(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-modal-divider" />

          {/* Cuisine */}
          <div className="filter-modal-section">
            <div className="filter-modal-section-label">Cuisine</div>
            <div className="filter-chip-group cuisine-grid">
              {CUISINE_TYPES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`filter-chip ${draft.cuisineType === c.value ? "active" : ""}`}
                  onClick={() => setDraft({ ...draft, cuisineType: c.value })}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-modal-divider" />

          {/* Minimum Rating */}
          <div className="filter-modal-section">
            <div className="filter-modal-section-label">Minimum Rating</div>
            <div className="filter-chip-group">
              {RATING_OPTIONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`filter-chip ${draft.minRating === r.value ? "active" : ""}`}
                  onClick={() => setDraft({ ...draft, minRating: r.value })}
                >
                  {r.value > 0 && "★ "}{r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="filter-modal-footer">
          <button type="button" className="filter-reset-btn" onClick={handleReset}>
            Reset Filters
          </button>
          <button type="button" className="filter-apply-btn" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
