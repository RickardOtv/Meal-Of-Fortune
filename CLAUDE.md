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
- **Wheel.jsx** - Fortune wheel modal: pointer, segmented wheel, cream hub that shows the result
- **Map.jsx** - Simple container for the Google Maps div (actual map logic is in App)
- **Sidebar.jsx** - Restaurant list with checkboxes for selection, search/spin footer, mobile bottom-sheet drag
- **FilterModal.jsx** - Filter dialog (open now, establishment, price, cuisine, rating)
- **icons.jsx** - Inline SVG icon components; use these instead of emoji or ad-hoc SVGs

### Google Maps Integration

The app uses `@googlemaps/js-api-loader` to load the Maps SDK. The map is initialized in `initMap()` and stored in `mapRef.current`. Restaurant markers are managed in `markersRef.current` and cleared/recreated on each search.

### Places API

Uses the new Places API (`places.googleapis.com/v1/places:searchText`) with `locationRestriction` to search within the visible map bounds. Supports pagination via `nextPageToken`.

## Styling

All styles are in [index.css](src/index.css). Design tokens live in `:root`; use them instead of raw hex values.

- **Palette**: bordeaux primary (`--wine-700` #63001e, darker `--wine-900`/`--wine-950` for text), beige/cream surfaces (`--beige-100` #f6efe6 ground, `--cream` #fbf8f3), muted antique gold accent (`--gold` #b8955a) only for ratings, badges, the wheel rim and the user-location dot. No cool greys.
- **Type**: Inter (`--font-ui`) for UI text, Fraunces (`--font-display`) for the brand name, panel/modal titles and wheel text.
- **Surfaces**: translucent beige glass (`--surface` + `--blur`), wine-tinted borders and shadows, large radii (`--r-md` to `--r-xl`).
- **Map**: warm parchment style in `MAP_STYLE` in App.jsx. Marker and confetti colors are constants at the top of App.jsx and must stay in sync with the CSS tokens.

## Rules

* Always try to keep to the code standard
* Always ask follow up questions of there are any, specially if in plan mode
* Try to keep code clean and following a standard
* Don't over complicate
