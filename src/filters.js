// Shared filter defaults. App seeds its state from these and FilterModal
// resets to them, so keep this the single source of truth.
export const DEFAULT_FILTERS = {
  isOpen: true,
  isRestaurant: true,
  isCafe: false,
  priceLevels: [],
  minRating: 0,
  cuisineTypes: [],
};
