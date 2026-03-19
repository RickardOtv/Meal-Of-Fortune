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
}) {
  return (
    <aside className="sidebar-bg">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Found Restaurants</h2>
        </div>

        {/* Skeleton loader overlaid while searching */}
        {isSearching && (
          <div className="skeleton-list" aria-label="Loading restaurants">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-item">
                <div className="skeleton-checkbox" />
                <div className="skeleton-photo" />
                <div className="skeleton-details">
                  <div className="skeleton-line skeleton-line-name" />
                  <div className="skeleton-line skeleton-line-addr" />
                  <div className="skeleton-line skeleton-line-price" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state: not searched yet */}
        {!isSearching && !hasSearched && restaurants.length === 0 && (
          <p className="no-results">
            Move the map, then press <strong>Search</strong>.
          </p>
        )}

        {/* Empty state: searched but no results */}
        {!isSearching && hasSearched && restaurants.length === 0 && (
          <p className="no-results">
            No results found. Try moving the map or changing filters.
          </p>
        )}

        {/* Restaurant list - always mounted to preserve scroll position */}
        <ul style={{ display: !isSearching && restaurants.length > 0 ? undefined : 'none' }}>
          {restaurants.map((restaurant, index) => (
            <li
              key={restaurant.id ?? index}
              className="restaurant-item"
              onClick={() => focusRestaurant(index, window.google)}
            >
              <input
                type="checkbox"
                checked={selectedIndexes.includes(index)}
                onClick={(event) => event.stopPropagation()}
                onChange={() => handleCheckboxChange(index)}
                className="restaurant-checkbox"
                aria-label={`Select ${restaurant.name}`}
              />
              {restaurant.photoUrl && (
                <img
                  src={restaurant.photoUrl}
                  alt={restaurant.name}
                  className="restaurant-photo"
                />
              )}
              <div className="restaurant-details">
                <strong>{restaurant.name}</strong>
                <br />
                <small>{restaurant.address}</small>
                <br />
                <small>{priceToSymbols(restaurant.priceLevel)}</small>
              </div>
            </li>
          ))}
        </ul>

        <div className="select-controls-bottom">
          <button type="button" onClick={selectAllRestaurants}>
            Select All
          </button>
          <button type="button" onClick={deselectAllRestaurants}>
            Deselect All
          </button>
        </div>
      </div>
    </aside>
  );
}
