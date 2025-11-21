import { useState, useRef, useEffect } from "react";

export default function Wheel({
  wheelText,
  spinWheel,
  radius,
  handleRadiusChange,
  searchRestaurants,
  filters,
  setFilters
}) {
  const [showFilters, setShowFilters] = useState(false);
  const filterContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterContainerRef.current && !filterContainerRef.current.contains(event.target)) {
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

  return (
    <section className="wheel-section">
      <div className="wheel-bg">
        <div id="wheel" onClick={spinWheel}>
          {wheelText}
        </div>
        <div className="dragbar-controls">
          <label>
            Radius: <strong>{radius} m</strong>
          </label>
          <input
            type="range"
            min="100"
            max="1500"
            step="100"
            value={radius}
            onChange={handleRadiusChange}
            className="radius-slider"
          />
          <button onClick={searchRestaurants}>Search</button>
          <div className="filter-container" ref={filterContainerRef}>
            <button
              className="filter-toggle-button"
              onClick={() => setShowFilters(!showFilters)}
              type="button"
            >
              Filters {showFilters ? "▲" : "▼"}
            </button>
            {showFilters && (
              <div className="filter-dropdown-wheel">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}