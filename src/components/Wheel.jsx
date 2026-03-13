import { useState, useRef, useEffect } from "react";

const CUISINE_TYPES = [
  { value: "", label: "Any" },
  { value: "american_restaurant", label: "American" },
  { value: "chinese_restaurant", label: "Chinese" },
  { value: "french_restaurant", label: "French" },
  { value: "greek_restaurant", label: "Greek" },
  { value: "indian_restaurant", label: "Indian" },
  { value: "italian_restaurant", label: "Italian" },
  { value: "japanese_restaurant", label: "Japanese" },
  { value: "korean_restaurant", label: "Korean" },
  { value: "lebanese_restaurant", label: "Lebanese" },
  { value: "mediterranean_restaurant", label: "Mediterranean" },
  { value: "mexican_restaurant", label: "Mexican" },
  { value: "middle_eastern_restaurant", label: "Middle Eastern" },
  { value: "spanish_restaurant", label: "Spanish" },
  { value: "thai_restaurant", label: "Thai" },
  { value: "turkish_restaurant", label: "Turkish" },
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

export default function Wheel({
  wheelText,
  spinWheel,
  searchRestaurants,
  filters,
  setFilters,
  isSearching
}) {
  const [showFilters, setShowFilters] = useState(false);
  const filterDropdownRef = useRef(null);
  const filterButtonRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      const clickedOnButton = filterButtonRef.current?.contains(event.target);
      const clickedOnDropdown = filterDropdownRef.current?.contains(event.target);

      if (!clickedOnButton && !clickedOnDropdown) {
        setShowFilters(false);
      }
    }

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  function togglePriceLevel(level) {
    const current = filters.priceLevels || [];
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    setFilters({ ...filters, priceLevels: updated });
  }

  // Count active filters (beyond defaults)
  const activeFilterCount = [
    (filters.priceLevels?.length || 0) > 0,
    filters.minRating > 0,
    filters.cuisineType !== "",
  ].filter(Boolean).length;

  return (
    <section className="wheel-section">
      <div className="wheel-bg">
        <div id="wheel" onClick={spinWheel} role="button" tabIndex={0} aria-label="Spin the wheel" onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); spinWheel(); } }}>
          {wheelText}
        </div>
        <div className="dragbar-controls">
          <button onClick={searchRestaurants} disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </button>
          <div className="filter-container">
            <button
              ref={filterButtonRef}
              className="filter-toggle-button"
              onClick={() => setShowFilters(!showFilters)}
              type="button"
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`} {showFilters ? "▲" : "▼"}
            </button>
            {showFilters && (
              <div className="filter-dropdown-wheel" ref={filterDropdownRef}>
                {/* Type filters */}
                <div className="filter-section-label">Type</div>
                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.isOpen}
                    onChange={(e) => setFilters({ ...filters, isOpen: e.target.checked })}
                  />
                  <span>Open Now</span>
                </label>
                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.isRestaurant}
                    onChange={(e) => setFilters({ ...filters, isRestaurant: e.target.checked })}
                  />
                  <span>Restaurants</span>
                </label>
                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.isCafe}
                    onChange={(e) => setFilters({ ...filters, isCafe: e.target.checked })}
                  />
                  <span>Cafes</span>
                </label>

                <div className="filter-divider" />

                {/* Cuisine type */}
                <div className="filter-section-label">Cuisine</div>
                <select
                  className="filter-select"
                  value={filters.cuisineType || ""}
                  onChange={(e) => setFilters({ ...filters, cuisineType: e.target.value })}
                >
                  {CUISINE_TYPES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                <div className="filter-divider" />

                {/* Price range */}
                <div className="filter-section-label">Price</div>
                <div className="filter-price-row">
                  {PRICE_LEVELS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      className={`filter-price-btn ${(filters.priceLevels || []).includes(p.value) ? "active" : ""}`}
                      onClick={() => togglePriceLevel(p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="filter-divider" />

                {/* Min rating */}
                <div className="filter-section-label">Min Rating</div>
                <div className="filter-rating-row">
                  {RATING_OPTIONS.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      className={`filter-rating-btn ${filters.minRating === r.value ? "active" : ""}`}
                      onClick={() => setFilters({ ...filters, minRating: r.value })}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
