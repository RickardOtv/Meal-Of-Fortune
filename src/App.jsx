import { useEffect, useState, useRef, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import confetti from "canvas-confetti";
import "./index.css";
import Wheel from "./components/Wheel";
import Map from "./components/Map";
import Sidebar from "./components/Sidebar";
import FilterModal from "./components/FilterModal";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Brand colors (keep in sync with index.css)
const NAVY_900 = "#0b1a33";
const NAVY_500 = "#1e3a6b";
const GOLD = "#c9a348";
const GOLD_LIGHT = "#e4c574";

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

function loadFilters() {
  try {
    const saved = localStorage.getItem("mof-filters");
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {
    isOpen: true,
    isRestaurant: true,
    isCafe: false,
    priceLevels: [],
    minRating: 0,
    cuisineType: "",
  };
}

// Light map style — clean Apple-ish look with enough contrast to read features
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#eef0f4" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4a5568" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d4e3cf" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#4a6b3f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#d8dde5" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#c8ced9" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffe4a8" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#c9a348" }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#a9c8e8" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#1e3a6b" }] },
];

export default function App() {
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);
  const wheelRotationRef = useRef(0);
  const isSpinningRef = useRef(false);

  const [restaurants, setRestaurants] = useState([]);
  const [wheelText, setWheelText] = useState("Spin Me");
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState(loadFilters);
  const [showHelp, setShowHelp] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [toast, setToast] = useState(null);
  const [promptSearch, setPromptSearch] = useState(true);

  const activeFilterCount = [
    (filters.priceLevels?.length || 0) > 0,
    filters.minRating > 0,
    filters.cuisineType !== "",
  ].filter(Boolean).length;

  useEffect(() => {
    try { localStorage.setItem("mof-filters", JSON.stringify(filters)); } catch { /* ignore */ }
  }, [filters]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"],
    });
    loader.load().then((google) => {
      initMap(google);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initMap(google) {
    const { Map, InfoWindow } = await google.maps.importLibrary("maps");

    const setup = (loc, zoom = 15) => {
      mapRef.current = new Map(document.getElementById("map"), {
        center: loc,
        zoom,
        clickableIcons: false,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        styles: MAP_STYLE,
        gestureHandling: "greedy",
      });

      new google.maps.Marker({
        map: mapRef.current,
        position: loc,
        title: "You are here",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: GOLD,
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: NAVY_900,
          scale: 8,
        },
      });

      infoWindowRef.current = new InfoWindow();

      // Location autocomplete — pans map on place selection
      const input = document.getElementById("location-search");
      if (input && google.maps.places?.Autocomplete) {
        const autocomplete = new google.maps.places.Autocomplete(input, {
          fields: ["geometry", "name", "formatted_address"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.viewport) {
            mapRef.current.fitBounds(place.geometry.viewport);
          } else if (place.geometry?.location) {
            mapRef.current.setCenter(place.geometry.location);
            mapRef.current.setZoom(15);
          }
          setPromptSearch(true);
        });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setup({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (error) => {
          console.log("Geolocation error:", error.message);
          setup({ lat: 40.7128, lng: -74.006 }, 14);
          showToast("Could not detect your location. Showing New York City.", "info");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setup({ lat: 40.7128, lng: -74.006 }, 14);
      showToast("Geolocation not supported. Showing New York City.", "info");
    }
  }

  async function fetchRestaurants(bounds, appliedFilters) {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const queryParts = [];
    if (appliedFilters.isRestaurant) queryParts.push("restaurant");
    if (appliedFilters.isCafe) queryParts.push("cafe");
    const textQuery = queryParts.length > 0 ? queryParts.join(" ") : "restaurant";

    let allPlaces = [];
    let pageToken = null;

    do {
      const body = {
        textQuery,
        locationRestriction: {
          rectangle: {
            low: { latitude: sw.lat(), longitude: sw.lng() },
            high: { latitude: ne.lat(), longitude: ne.lng() },
          },
        },
        ...(appliedFilters.cuisineType && { includedType: appliedFilters.cuisineType }),
        ...(pageToken && { pageToken }),
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
      if (data.error) {
        console.error("API Error:", data.error);
        showToast("Search failed: " + (data.error.message || "Unknown error"), "error");
        break;
      }
      allPlaces.push(...(data.places || []));
      pageToken = data.nextPageToken;

      if (pageToken) await new Promise((r) => setTimeout(r, 200));
    } while (pageToken);

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
        ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${GOOGLE_MAPS_API_KEY}&maxHeightPx=120&maxWidthPx=120`
        : null,
      mapsUrl: place.googleMapsUri,
      isOpen: place.currentOpeningHours?.openNow === true,
    }));

    if (appliedFilters.isOpen) {
      places = places.filter((place) => place.isOpen);
    }

    if (appliedFilters.priceLevels && appliedFilters.priceLevels.length > 0) {
      places = places.filter(
        (place) => place.priceLevel && appliedFilters.priceLevels.includes(place.priceLevel)
      );
    }

    if (appliedFilters.minRating > 0) {
      places = places.filter((place) => place.rating && place.rating >= appliedFilters.minRating);
    }

    return places;
  }

  async function searchRestaurants(google) {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;

    setIsSearching(true);
    setPromptSearch(false);
    const items = await fetchRestaurants(bounds, filters);
    setIsSearching(false);
    setHasSearched(true);
    setRestaurants(items);

    if (items.length === 0) {
      showToast("No restaurants found here. Try moving the map or filters.", "info");
    }
    setWheelText("Spin Me");
    setSelectedIndexes(items.map((_, i) => i));

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const iw = infoWindowRef.current;
    items.forEach((r) => {
      if (!r.location) return;
      const marker = new google.maps.Marker({
        map: mapRef.current,
        position: r.location,
        title: r.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: NAVY_500,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
          scale: 7,
        },
      });

      marker.addListener("click", () => {
        const div = document.createElement("div");
        div.style.maxWidth = "260px";
        div.style.padding = "14px 16px";
        div.style.fontFamily = "-apple-system, BlinkMacSystemFont, sans-serif";
        div.innerHTML = `
          <div style="font-weight:700; color:#0b1a33; font-size:15px; margin-bottom:6px; letter-spacing:-0.01em;">${r.name}</div>
          <div style="color:#4a5568; font-size:12px; margin-bottom:10px; line-height:1.5;">${r.address}</div>
          ${r.mapsUrl ? `<a href="${r.mapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; color:#0b1a33; font-weight:600; text-decoration:none; font-size:12px; padding:6px 12px; background:#f0ead9; border-radius:999px;">Open in Google Maps →</a>` : ""}
        `;
        iw.setContent(div);
        iw.open({ map: mapRef.current, anchor: marker });
      });

      markersRef.current.push(marker);
    });
  }

  function openWheel() {
    if (selectedIndexes.length === 0) return;
    setWheelText("Spin Me");
    wheelRotationRef.current = 0;
    isSpinningRef.current = false;
    setShowWheel(true);
  }

  function spinWheel() {
    if (isSpinningRef.current) return;
    if (selectedIndexes.length === 0) {
      setWheelText("Select at least one");
      return;
    }
    const wheelEl = document.getElementById("wheel");
    if (!wheelEl) return;

    isSpinningRef.current = true;
    const chosenIndex = selectedIndexes[Math.floor(Math.random() * selectedIndexes.length)];
    const chosen = restaurants[chosenIndex];

    const spins = Math.floor(Math.random() * 3) + 5;
    const degrees = spins * 360 + Math.floor(Math.random() * 360);
    wheelRotationRef.current += degrees;
    wheelEl.style.transition = "transform 2.6s cubic-bezier(0.17, 0.67, 0.2, 1)";
    wheelEl.style.transform = `rotate(${wheelRotationRef.current}deg)`;

    setTimeout(() => {
      setWheelText(chosen.name);

      if (mapRef.current && chosen.location) {
        mapRef.current.panTo(chosen.location);
        mapRef.current.setZoom(16);
      }

      markersRef.current.forEach((marker, idx) => {
        const isWinner = idx === chosenIndex;
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: isWinner ? GOLD : NAVY_500,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
          scale: isWinner ? 11 : 7,
        });
        if (isWinner) {
          window.google.maps.event.trigger(marker, "click");
        }
      });

      setTimeout(() => {
        setShowWheel(false);
        isSpinningRef.current = false;
      }, 1800);

      const duration = 2000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: [GOLD, GOLD_LIGHT, "#ffffff", NAVY_500, NAVY_900],
          ticks: 200,
          gravity: 0.8,
          decay: 0.94,
          startVelocity: 30,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: [GOLD, GOLD_LIGHT, "#ffffff", NAVY_500, NAVY_900],
          ticks: 200,
          gravity: 0.8,
          decay: 0.94,
          startVelocity: 30,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }, 2600);
  }

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
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  function selectAllRestaurants() {
    setSelectedIndexes(restaurants.map((_, i) => i));
  }

  function deselectAllRestaurants() {
    setSelectedIndexes([]);
  }

  return (
    <div className="app">
      <Map />

      <div className="top-actions">
        <button
          type="button"
          className="icon-button primary"
          onClick={() => setShowHelp(true)}
          aria-label="Help"
          title="Help"
        >
          ?
        </button>
      </div>

      <div className="bottom-controls">
        <div className="search-row">
          <button
            type="button"
            className="icon-button"
            onClick={() => setShowFilterModal(true)}
            aria-label="Filters"
            title="Filters"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="10" y1="18" x2="14" y2="18" />
            </svg>
            {activeFilterCount > 0 && <span className="pill-badge">{activeFilterCount}</span>}
          </button>
          <div className="search-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
            <input
              id="location-search"
              type="text"
              placeholder="Search a city, address, or place…"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert" aria-live="polite">
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)} aria-label="Dismiss notification">×</button>
        </div>
      )}

      <Sidebar
        restaurants={restaurants}
        selectedIndexes={selectedIndexes}
        handleCheckboxChange={handleCheckboxChange}
        focusRestaurant={focusRestaurant}
        selectAllRestaurants={selectAllRestaurants}
        deselectAllRestaurants={deselectAllRestaurants}
        priceToSymbols={priceToSymbols}
        isSearching={isSearching}
        hasSearched={hasSearched}
        onSearch={() => searchRestaurants(window.google)}
        onSpin={openWheel}
      />

      {showWheel && (
        <Wheel
          wheelText={wheelText}
          spinWheel={spinWheel}
          onClose={() => setShowWheel(false)}
        />
      )}

      {showHelp && (
        <div
          className="help-modal-overlay"
          onClick={() => setShowHelp(false)}
          role="dialog"
          aria-modal="true"
          aria-label="How to use"
        >
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="help-modal-close"
              onClick={() => setShowHelp(false)}
              type="button"
              aria-label="Close help"
            >
              ×
            </button>
            <h2>How to use</h2>
            <ol>
              <li>Move the map to where you want to eat.</li>
              <li>Tap <strong>Filters</strong> to narrow by cuisine, price, or rating.</li>
              <li>Tap <strong>Search this area</strong> to find places nearby.</li>
              <li>Uncheck any you don't want in the list.</li>
              <li>Tap <strong>Spin the Wheel</strong> and let fortune decide.</li>
            </ol>
          </div>
        </div>
      )}

      {showFilterModal && (
        <FilterModal
          filters={filters}
          onApply={setFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
}
