import { useState } from "react";

export default function Sidebar({
  restaurants,
  selectedIndexes,
  handleCheckboxChange,
  focusRestaurant,
  selectAllRestaurants,
  deselectAllRestaurants,
  priceToSymbols,
  isSearching,
  hasSearched,
  onSearch,
  onSpin,
}) {
  const [expanded, setExpanded] = useState(false);
  const hasResults = restaurants.length > 0;
  const selectedCount = selectedIndexes.length;

  return (
    <aside className={`restaurants-panel${expanded ? " expanded" : ""}`}>
      <div
        className="panel-handle"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        aria-label={expanded ? "Collapse list" : "Expand list"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <div className="panel-handle-bar" />
      </div>

      <div className="panel-brand">
        <div className="brand-mark" />
        <span>Meal of Fortune</span>
      </div>
      <div className="panel-header">
        <div>
          <div className="panel-title">Restaurants</div>
          <div className="panel-subtitle">
            {isSearching
              ? "Searching nearby..."
              : hasResults
              ? `${restaurants.length} found · ${selectedCount} selected`
              : "Move the map, then search"}
          </div>
        </div>
        {hasResults && !isSearching && (
          <div className="panel-select-actions">
            <button type="button" onClick={selectAllRestaurants}>All</button>
            <button type="button" onClick={deselectAllRestaurants}>None</button>
          </div>
        )}
      </div>

      <div className="panel-body">
        {isSearching && (
          <div className="skeleton-list" aria-label="Loading restaurants">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-item">
                <div className="skeleton-box skeleton-check" />
                <div className="skeleton-box skeleton-photo-sk" />
                <div className="skeleton-lines">
                  <div className="skeleton-box skeleton-line" />
                  <div className="skeleton-box skeleton-line short" />
                  <div className="skeleton-box skeleton-line shorter" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isSearching && !hasSearched && !hasResults && (
          <div className="panel-empty">
            <div className="panel-empty-icon">🗺️</div>
            Move the map to where you are, then tap <strong>Search</strong> to find places nearby.
          </div>
        )}

        {!isSearching && hasSearched && !hasResults && (
          <div className="panel-empty">
            <div className="panel-empty-icon">🔎</div>
            No results in this area. Try moving the map or adjusting filters.
          </div>
        )}

        {!isSearching && hasResults && (
          <ul className="restaurant-list">
            {restaurants.map((restaurant, index) => {
              const selected = selectedIndexes.includes(index);
              return (
                <li
                  key={restaurant.id ?? index}
                  className={`restaurant-item${selected ? " selected" : ""}`}
                  onClick={() => focusRestaurant(index, window.google)}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => handleCheckboxChange(index)}
                    className="restaurant-checkbox"
                    aria-label={`Select ${restaurant.name}`}
                  />
                  {restaurant.photoUrl ? (
                    <img
                      src={restaurant.photoUrl}
                      alt={restaurant.name}
                      className="restaurant-photo"
                    />
                  ) : (
                    <div className="restaurant-photo-placeholder">🍽️</div>
                  )}
                  <div className="restaurant-details">
                    <div className="restaurant-name">{restaurant.name}</div>
                    <div className="restaurant-meta">
                      {restaurant.rating && (
                        <>
                          <span className="restaurant-rating">★ {restaurant.rating.toFixed(1)}</span>
                          <span className="dot" />
                        </>
                      )}
                      {priceToSymbols(restaurant.priceLevel) && (
                        <>
                          <span>{priceToSymbols(restaurant.priceLevel)}</span>
                          <span className="dot" />
                        </>
                      )}
                      <span>{restaurant.address}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={`panel-footer${!hasSearched ? " centered" : ""}`}>
        {!hasSearched ? (
          <button
            type="button"
            className="panel-primary-btn attention"
            onClick={onSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <span className="spinner" />
                Searching…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Search this area
              </>
            )}
          </button>
        ) : (
          <div className="panel-footer-row">
            <button
              type="button"
              className="panel-ghost-btn"
              onClick={onSearch}
              disabled={isSearching}
              title="Search this area again"
            >
              {isSearching ? (
                <span className="spinner dark" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                  <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
                </svg>
              )}
              <span>Search again</span>
            </button>
            <button
              type="button"
              className="panel-primary-btn"
              onClick={onSpin}
              disabled={selectedCount === 0}
            >
              {selectedCount > 0 && <span className="spin-cta-icon" />}
              {selectedCount === 0 ? "Select places" : `Spin · ${selectedCount}`}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
