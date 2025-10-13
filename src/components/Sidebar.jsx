export default function Sidebar({
  restaurants,
  selectedIndexes,
  handleCheckboxChange,
  focusRestaurant,
  selectAllRestaurants,
  deselectAllRestaurants,
  priceToSymbols,
}) {
  return (
    <aside className="sidebar-bg">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Found Restaurants</h2>
        </div>
        {restaurants.length === 0 && (
          <p className="no-results">
            No results yet. Drag map and press Search.
          </p>
        )}
        <ul>
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