export default function Wheel({
  wheelText,
  spinWheel,
  searchRestaurants,
  onOpenFilters,
  activeFilterCount,
  isSearching
}) {
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
              className="filter-toggle-button"
              onClick={onOpenFilters}
              type="button"
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
