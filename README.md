# 🍽️ Meal of Fortune 🎡

Turn indecision into adventure! Meal of Fortune gamifies the "where should we eat?" question by letting you spin a wheel to randomly select from nearby restaurants. Features live maps, customizable filters, and real-time restaurant data. Let fortune decide your next meal!

🌐 **Live Site**: [meal-of-fortune.com](https://meal-of-fortune.com)

## Features

- **Fortune Wheel**: Spin to randomly select a restaurant from your search results
- **Interactive Map**: View nearby restaurants on an integrated Google Maps interface with custom gothic-themed markers
- **Adjustable Search Radius**: Control the search area from 100m to 1500m
- **Advanced Filters**: Filter by open restaurants, restaurants, and cafes
- **Restaurant Selection**: Choose which restaurants to include in the wheel spin
- **Celebration Effects**: Gothic-themed confetti animation when a winner is chosen
- **Dark Gothic Aesthetic**: Immersive UI with burgundy, gold, and vintage styling

## Setup

### Prerequisites
- Node.js and npm installed
- Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Places API (New)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RickardOtv/Meal-Of-Fortune.git
cd Meal-Of-Fortune
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. Allow location access when prompted (or the app will default to NYC)
2. Adjust the search radius using the slider (100m - 1500m)
3. Click "Filters" to choose restaurant types and whether to show only open restaurants
4. Click "Search" to find nearby restaurants
5. Select/deselect restaurants from the sidebar using checkboxes
6. Click the fortune wheel to spin and discover your meal destiny
7. Click on map markers to view restaurant details

## Tech Stack

- **React** - Frontend framework
- **Vite** - Build tool and dev server
- **Google Maps JavaScript API** - Map integration
- **Google Places API (New)** - Restaurant data
- **canvas-confetti** - Celebration effects
- **Cloudflare Pages** - Hosting and deployment

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

## Author

**Rickard Ötvös**