# 🍽️ Meal of Fortune 🎡

A dark themed web application that helps you discover your next dining adventure through the spin of a fortune wheel. Built with React and Google Maps API.

## Features

- **Fortune Wheel**: Spin to randomly select a restaurant from your search results
- **Interactive Map**: View nearby restaurants on an integrated Google Maps interface with custom gothic-themed markers
- **Adjustable Search Radius**: Control the search area from 100m to 1500m
- **Restaurant Selection**: Choose which restaurants to include in the wheel spin
- **Celebration Effects**: Gothic-themed confetti animation when a winner is chosen
- **Dark Academia Aesthetic**: Immersive UI with burgundy, gold, and vintage styling

## Setup

### Prerequisites
- Node.js and npm installed
- Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Places API (New)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Meal-Of-Fortune.git
cd Meal-Of-Fortune
```

2. Install dependencies:
```bash
npm install
```

3. Create a `key.jsx` file in the `src` directory:
```javascript
const GOOGLE_MAPS_API_KEY = "YOUR_API_KEY_HERE";
export default GOOGLE_MAPS_API_KEY;
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. Allow location access when prompted (or the app will default to NYC)
2. Adjust the search radius using the slider
3. Click "Search" to find nearby restaurants
4. Select/deselect restaurants from the sidebar
5. Click the fortune wheel to spin and discover your meal destiny

## Tech Stack

- **React** - Frontend framework
- **Vite** - Build tool and dev server
- **Google Maps JavaScript API** - Map integration
- **Google Places API (New)** - Restaurant data
- **canvas-confetti** - Celebration effects

## Project Structure

```
src/
├── components/
│   ├── Map.jsx         # Map container component
│   ├── Sidebar.jsx     # Restaurant list component
│   └── Wheel.jsx       # Fortune wheel component
├── App.jsx             # Main application component
├── index.css           # Global styles with dark academia theme
└── main.jsx            # Application entry point
```