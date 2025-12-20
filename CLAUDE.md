# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Environment Setup

Requires a `.env` file with:
```
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

The API key needs Maps JavaScript API and Places API (New) enabled.

## Architecture

This is a React 19 + Vite single-page application for randomly selecting restaurants via a spinning wheel.

### State Management

All state lives in [App.jsx](src/App.jsx) and flows down to components via props:
- `restaurants` - Array of restaurant data from Google Places API
- `selectedIndexes` - Which restaurants are included in the wheel spin
- `filters` - Search filters (isOpen, isRestaurant, isCafe)
- `mapRef`, `markersRef`, `infoWindowRef` - Google Maps instances stored in refs

### Component Structure

- **App.jsx** - Contains all business logic: Google Maps initialization, Places API fetching with pagination (up to 60 results), wheel spin logic, marker management
- **Wheel.jsx** - Fortune wheel UI with filter dropdown, handles click-outside behavior
- **Map.jsx** - Simple container for the Google Maps div (actual map logic is in App)
- **Sidebar.jsx** - Restaurant list with checkboxes for selection

### Google Maps Integration

The app uses `@googlemaps/js-api-loader` to load the Maps SDK. The map is initialized in `initMap()` and stored in `mapRef.current`. Restaurant markers are managed in `markersRef.current` and cleared/recreated on each search.

### Places API

Uses the new Places API (`places.googleapis.com/v1/places:searchText`) with `locationRestriction` to search within the visible map bounds. Supports pagination via `nextPageToken`.

## Styling

All styles are in [index.css](src/index.css) using a dark gothic/academia theme with burgundy (`#6b2d5c`), gold (`#d4af37`), and cream (`#f4e4c1`) colors. Uses the Cinzel font family.

## Rules

* Always try to keep to the code standard
* Always ask follow up questions of there are any, specially if in plan mode
* Try to keep code clean and following a standard
* Don't over complicate
