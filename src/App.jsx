import { useEffect, useState, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import confetti from "canvas-confetti";
import "./index.css";
import Wheel from "./components/Wheel";
import Map from "./components/Map";
import Sidebar from "./components/Sidebar";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Converts Google price level to readable symbols
function priceToSymbols(priceLevel) {
  if (!priceLevel) return "";
  const priceLabels = {
    PRICE_LEVEL_FREE: "Free",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };
  return priceLabels[priceLevel] || "";
}

export default function App() {
  // ===== State and Refs =====
  const mapRef = useRef(null);         // Google Map instance
  const infoWindowRef = useRef(null);  // Info window for markers
  const markersRef = useRef([]);       // Restaurant markers

  const [restaurants, setRestaurants] = useState([]); // List of found restaurants
  const [wheelText, setWheelText] = useState("🎡 Spin Me"); // Wheel display text
  const [selectedIndexes, setSelectedIndexes] = useState([]); // Selected restaurants
  const [isSearching, setIsSearching] = useState(false); // Loading state for search
  const [filters, setFilters] = useState({
    isOpen: true,
    isRestaurant: true,
    isCafe: false,
  });

  // ===== Initialize Google Map on mount =====
  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
    });
    loader.load().then((google) => {
      initMap(google);
    });
  }, []);

  // ===== Map Setup =====
  async function initMap(google) {
    const { Map, InfoWindow } = await google.maps.importLibrary("maps");

    // Setup map and marker at user's location (or fallback)
    const setup = (loc, zoom = 15) => {
      mapRef.current = new Map(document.getElementById("map"), {
        center: loc,
        zoom,
      });

      // "You are here" marker with custom gothic styling
      new google.maps.Marker({
        map: mapRef.current,
        position: loc,
        title: "You are here",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#d4af37",
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: "#2d1b2e",
          scale: 8,
        },
      });

      infoWindowRef.current = new InfoWindow();
    };

    // Try geolocation, fallback to NYC
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setup({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (error) => {
          console.log("Geolocation error:", error.message);
          setup({ lat: 40.7128, lng: -74.006 }, 14);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      console.log("Geolocation not supported");
      setup({ lat: 40.7128, lng: -74.006 }, 14);
    }
  }

  // ===== Fetch restaurants from Google Places API (Text Search with pagination) =====
  async function fetchRestaurants(bounds, appliedFilters) {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // Build text query from filters
    const queryParts = [];
    if (appliedFilters.isRestaurant) queryParts.push("restaurant");
    if (appliedFilters.isCafe) queryParts.push("cafe");
    const textQuery = queryParts.length > 0 ? queryParts.join(" ") : "restaurant";

    let allPlaces = [];
    let pageToken = null;

    // Fetch up to 3 pages (60 results max)
    do {
      const body = {
        textQuery,
        // Use locationRestriction (rectangle) for strict bounds - only returns places within visible area
        locationRestriction: {
          rectangle: {
            low: { latitude: sw.lat(), longitude: sw.lng() },
            high: { latitude: ne.lat(), longitude: ne.lng() }
          }
        },
        ...(pageToken && { pageToken })
      };

      const resp = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.photos,places.googleMapsUri,places.currentOpeningHours,nextPageToken",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await resp.json();
      console.log("API Response:", data);
      if (data.error) {
        console.error("API Error:", data.error);
        break;
      }
      allPlaces.push(...(data.places || []));
      pageToken = data.nextPageToken;

      // Small delay required between pagination requests
      if (pageToken) await new Promise(r => setTimeout(r, 200));
    } while (pageToken);

    console.log(`Total places found: ${allPlaces.length}`);

    // Transform places to app format
    let places = allPlaces.map((place) => ({
      id: place.id,
      name: place.displayName?.text || "Unnamed Restaurant",
      address: place.formattedAddress || "",
      location: {
        lat: place.location.latitude,
        lng: place.location.longitude,
      },
      rating: place.rating,
      priceLevel: place.priceLevel,
      photoUrl: place.photos?.[0]
        ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${GOOGLE_MAPS_API_KEY}&maxHeightPx=80&maxWidthPx=80`
        : null,
      mapsUrl: place.googleMapsUri,
      isOpen: place.currentOpeningHours?.openNow === true,
    }));

    // Apply "Open Now" filter if enabled
    if (appliedFilters.isOpen) {
      places = places.filter(place => place.isOpen);
    }

    return places;
  }

  // ===== Search for restaurants and update map =====
  async function searchRestaurants(google) {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;

    setIsSearching(true);

    // Fetch restaurants within visible map bounds
    const items = await fetchRestaurants(bounds, filters);
    setIsSearching(false);
    setRestaurants(items);
    setWheelText("🎡 Spin Me");
    setSelectedIndexes(items.map((_, i) => i)); // Select all by default

    // Remove old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Add new markers (all burgundy pointers)
    const iw = infoWindowRef.current;
    items.forEach((r) => {
      if (!r.location) return;
      const marker = new google.maps.Marker({
        map: mapRef.current,
        position: r.location,
        title: r.name,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          fillColor: "#6b2d5c",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#2d1b2e",
          scale: 4,
        }
      });

      marker.addListener("click", () => {
        const div = document.createElement("div");
        div.style.maxWidth = "280px";
        div.style.padding = "16px";
        div.style.background = "#f4e4c1";
        div.style.borderRadius = "12px";
        div.style.border = "3px solid #d4af37";
        div.style.position = "relative";
        div.style.margin = "-12px";
        div.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3), 0 0 20px rgba(212,175,55,0.3)";
        div.innerHTML = `
          <span onclick="this.closest('.gm-style-iw-c')?.parentElement?.querySelector('button')?.click()" style="position:absolute; top:10px; right:10px; color:#2d1b2e; font-size:24px; cursor:pointer; line-height:1; opacity:0.5; transition:opacity 0.2s; user-select:none;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='0.5'">×</span>
          <div style="font-weight:bold; color:#000000; font-size:17px; margin-bottom:8px; font-family:'Cinzel', serif; padding-right:30px;">${r.name}</div>
          <div style="color:#1a1a1a; font-size:14px; margin-bottom:10px; line-height:1.5;">${r.address}</div>
          ${r.mapsUrl ? `<a href="${r.mapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; margin-top:4px; color:#8b6914; font-weight:600; text-decoration:none; border-bottom:2px solid #d4af37; font-family:'Cinzel', serif; font-size:13px;">Open in Google Maps →</a>` : ""}
        `;
        iw.setContent(div);
        iw.open({ map: mapRef.current, anchor: marker });
      });

      markersRef.current.push(marker);
    });
  }

  // ===== Spin the wheel and highlight winner =====
  function spinWheel() {
    if (selectedIndexes.length === 0) {
      setWheelText("⚠️ Select at least one!");
      return;
    }
    const wheelEl = document.getElementById("wheel");
    const chosenIndex = selectedIndexes[Math.floor(Math.random() * selectedIndexes.length)];
    const chosen = restaurants[chosenIndex];

    if (wheelEl) {
      const spins = Math.floor(Math.random() * 3) + 5;
      const degrees = spins * 360;
      wheelEl.style.transition = "transform 2s ease-out";
      wheelEl.style.transform = `rotate(${degrees}deg)`;
      setTimeout(() => {
        setWheelText(`🎉 ${chosen.name}`);
        wheelEl.style.transition = "none";
        wheelEl.style.transform = "rotate(0deg)";
        // Set all markers to burgundy, winner to gold
        markersRef.current.forEach((marker, idx) => {
          marker.setIcon({
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: idx === chosenIndex ? "#d4af37" : "#6b2d5c",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#2d1b2e",
            scale: 4,
          });
        });

        // Trigger confetti effect with gothic colors
        const duration = 2000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 60,
            origin: { x: 0 },
            colors: ['#d4af37', '#b8860b', '#f4d03f', '#6b2d5c', '#4a1c40'],
            ticks: 200,
            gravity: 0.8,
            decay: 0.94,
            startVelocity: 30
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 60,
            origin: { x: 1 },
            colors: ['#d4af37', '#b8860b', '#f4d03f', '#6b2d5c', '#4a1c40'],
            ticks: 200,
            gravity: 0.8,
            decay: 0.94,
            startVelocity: 30
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }, 2000);
    }
  }

  // ===== UI Handlers =====
  function focusRestaurant(index, google) {
    const restaurant = restaurants[index];
    if (!restaurant || !mapRef.current) return;
    mapRef.current.setCenter(restaurant.location);
    mapRef.current.setZoom(17);
    if (markersRef.current[index] && infoWindowRef.current && google) {
      google.maps.event.trigger(markersRef.current[index], "click");
    }
  }

  function handleCheckboxChange(idx) {
    setSelectedIndexes((prev) =>
      prev.includes(idx)
        ? prev.filter((i) => i !== idx)
        : [...prev, idx]
    );
  }

  function selectAllRestaurants() {
    setSelectedIndexes(restaurants.map((_, i) => i));
  }

  function deselectAllRestaurants() {
    setSelectedIndexes([]);
  }

  // ===== Render UI =====
  return (
    <div className="app">
      <h1>🍽️ Meal of Fortune 🎡</h1>
      <div className="main-layout">
        <Wheel
          wheelText={wheelText}
          spinWheel={spinWheel}
          searchRestaurants={() => searchRestaurants(window.google)}
          filters={filters}
          setFilters={setFilters}
          isSearching={isSearching}
        />
        <Map />
        <Sidebar
          restaurants={restaurants}
          selectedIndexes={selectedIndexes}
          handleCheckboxChange={handleCheckboxChange}
          focusRestaurant={focusRestaurant}
          selectAllRestaurants={selectAllRestaurants}
          deselectAllRestaurants={deselectAllRestaurants}
          priceToSymbols={priceToSymbols}
        />
      </div>
      <a
        href="https://github.com/RickardOtv"
        target="_blank"
        rel="noopener noreferrer"
        className="github-link"
      >
        Made by RickardOtv
      </a>
    </div>
  );
}
