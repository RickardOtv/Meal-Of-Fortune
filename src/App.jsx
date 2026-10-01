import { useEffect, useState, useRef, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import confetti from "canvas-confetti";
import "./index.css";
import Wheel from "./components/Wheel";
import Map from "./components/Map";
import Sidebar from "./components/Sidebar";
import FilterModal from "./components/FilterModal";
import { FilterIcon, SearchIcon, PlusIcon, MinusIcon } from "./components/icons";
import { DEFAULT_FILTERS } from "./filters";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Brand colors (keep in sync with index.css)
const WINE_700 = "#63001e";
const WINE_900 = "#3d0012";
const WINE_500 = "#8f2a45";
const GOLD = "#b8955a";
const GOLD_LIGHT = "#d4b98a";
const CREAM = "#fbf8f3";
const SAND = "#cdb79b";
const SAND_DARK = "#a98f71";
const CONFETTI_COLORS = [GOLD, GOLD_LIGHT, CREAM, WINE_500, WINE_700];

// Places are teardrop pins; "you are here" is a ringed dot with a halo, so the
// two never read alike regardless of color.
const PIN_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

function pinIcon(fillColor, strokeColor, scale = 1.4, strokeWeight = 1.5) {
  return {
    path: PIN_PATH,
    fillColor,
    fillOpacity: 1,
    strokeColor,
    strokeWeight,
    scale,
    anchor: new window.google.maps.Point(12, 22),
  };
}

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
    const saved = JSON.parse(localStorage.getItem("mof-filters"));
    if (saved) {
      // Older saves stored a single cuisineType string
      const { cuisineType, ...rest } = saved;
      const migrated = cuisineType ? { cuisineTypes: [cuisineType] } : {};
      return { ...DEFAULT_FILTERS, ...rest, ...migrated };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_FILTERS };
}

// Lightly warmed map, close to Google's default colors: soft warm-grey land,
// fresh green parks, blue water, pale yellow highways, white streets. Business
// POIs and all icons are hidden so they do not compete with the restaurant pins.
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f1ece3" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5a4046" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f8f5ef" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#cfc3b3" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#8a6f74" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#ebe6da" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e8e2d3" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#93817c" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#c5dcb0" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#4b7b3a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e6dfd3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f7dd8e" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e8c86f" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#f2c069" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry.stroke", stylers: [{ color: "#dfae57" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#806b63" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e2dccd" }] },
  { featureType: "transit.line", elementType: "labels.text.fill", stylers: [{ color: "#8f7d77" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#e2dccd" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#a8cde0" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5f7f8f" }] },
];

export default function App() {
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);
  const wheelRotationRef = useRef(0);
  const isSpinningRef = useRef(false);
  const selectedIndexesRef = useRef([]);

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
    (filters.cuisineTypes?.length || 0) > 0,
  ].filter(Boolean).length;

  useEffect(() => {
    try { localStorage.setItem("mof-filters", JSON.stringify(filters)); } catch { /* ignore */ }
  }, [filters]);

  // Keep ref in sync so marker click handlers read the latest selection,
  // and recolor markers whenever selection changes.
  useEffect(() => {
    selectedIndexesRef.current = selectedIndexes;
    markersRef.current.forEach((marker, idx) => {
      const isSelected = selectedIndexes.includes(idx);
      marker.setIcon(
        isSelected ? pinIcon(WINE_700, CREAM) : pinIcon(SAND, SAND_DARK)
      );
    });
  }, [selectedIndexes]);

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
        styles: MAP_STYLE,
        gestureHandling: "greedy",
      });

      // Soft halo under a ringed dot, the universal "you are here" signal
      new google.maps.Marker({
        map: mapRef.current,
        position: loc,
        clickable: false,
        zIndex: 1,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: WINE_700,
          fillOpacity: 0.16,
          strokeWeight: 0,
          scale: 24,
        },
      });
      new google.maps.Marker({
        map: mapRef.current,
        position: loc,
        title: "You are here",
        clickable: false,
        zIndex: 2,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: WINE_700,
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: "#ffffff",
          scale: 8,
        },
      });

      infoWindowRef.current = new InfoWindow({ maxWidth: 280 });

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

  // One paginated Text Search request; includedType narrows it to a cuisine.
  async function fetchPlaces(rectangle, textQuery, includedType) {
    const places = [];
    let pageToken = null;

    do {
      const body = {
        textQuery,
        locationRestriction: { rectangle },
        ...(includedType && { includedType }),
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
      places.push(...(data.places || []));
      pageToken = data.nextPageToken;

      if (pageToken) await new Promise((r) => setTimeout(r, 200));
    } while (pageToken);

    return places;
  }

  async function fetchRestaurants(bounds, appliedFilters) {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const rectangle = {
      low: { latitude: sw.lat(), longitude: sw.lng() },
      high: { latitude: ne.lat(), longitude: ne.lng() },
    };

    const queryParts = [];
    if (appliedFilters.isRestaurant) queryParts.push("restaurant");
    if (appliedFilters.isCafe) queryParts.push("cafe");
    const textQuery = queryParts.length > 0 ? queryParts.join(" ") : "restaurant";

    // The API takes a single includedType, so run one search per selected
    // cuisine in parallel and merge the results, de-duplicated by place id.
    const cuisineTypes = appliedFilters.cuisineTypes?.length ? appliedFilters.cuisineTypes : [null];
    const results = await Promise.all(
      cuisineTypes.map((type) => fetchPlaces(rectangle, textQuery, type))
    );
    const seen = new Set();
    const allPlaces = results.flat().filter((place) => {
      if (seen.has(place.id)) return false;
      seen.add(place.id);
      return true;
    });

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
        ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${GOOGLE_MAPS_API_KEY}&maxHeightPx=320&maxWidthPx=480`
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
    items.forEach((r, idx) => {
      if (!r.location) return;
      const marker = new google.maps.Marker({
        map: mapRef.current,
        position: r.location,
        title: r.name,
        icon: pinIcon(WINE_700, CREAM),
        anchorPoint: new google.maps.Point(0, -30),
      });

      const buildContent = () => {
        const isSelected = selectedIndexesRef.current.includes(idx);
        const price = priceToSymbols(r.priceLevel);
        const meta = [
          r.rating ? `<span class="iw-rating">★ ${r.rating.toFixed(1)}</span>` : "",
          price ? `<span>${price}</span>` : "",
          r.isOpen ? `<span class="iw-open">Open now</span>` : "",
        ].filter(Boolean).join('<span class="iw-dot"></span>');
        const div = document.createElement("div");
        div.className = "iw";
        div.innerHTML = `
          ${r.photoUrl ? `<img class="iw-photo" src="${r.photoUrl}" alt="" />` : `<div class="iw-photo-empty"></div>`}
          <div class="iw-body">
            <div class="iw-name">${r.name}</div>
            ${meta ? `<div class="iw-meta">${meta}</div>` : ""}
            <div class="iw-address">${r.address}</div>
            <button type="button" data-toggle class="iw-toggle${isSelected ? " on" : ""}" aria-pressed="${isSelected}">
              <span class="iw-check"></span>${isSelected ? "In the wheel" : "Add to the wheel"}
            </button>
            ${r.mapsUrl ? `<a class="iw-link" href="${r.mapsUrl}" target="_blank" rel="noopener noreferrer">Open in Google Maps<span aria-hidden="true"> ↗</span></a>` : ""}
          </div>
        `;
        div.querySelector("[data-toggle]")?.addEventListener("click", () => {
          handleCheckboxChange(idx);
          setTimeout(() => {
            iw.setContent(buildContent());
          }, 0);
        });
        return div;
      };

      marker.addListener("click", () => {
        iw.setContent(buildContent());
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

    // Ensure we start from a clean rotation:0 with no transition,
    // then force a reflow so the browser commits that state
    // before we apply the spin transition. This avoids the browser
    // coalescing updates and skipping the animation.
    wheelEl.style.transition = "none";
    wheelEl.style.transform = "rotate(0deg)";
    wheelRotationRef.current = 0;
    // eslint-disable-next-line no-unused-expressions
    wheelEl.offsetWidth;

    wheelRotationRef.current = degrees;
    wheelEl.style.transition = "transform 2.6s cubic-bezier(0.17, 0.67, 0.2, 1)";
    wheelEl.style.transform = `rotate(${degrees}deg)`;

    setTimeout(() => {
      // Snap wheel back to 0 instantly so the winner text is readable.
      wheelEl.style.transition = "none";
      wheelEl.style.transform = "rotate(0deg)";
      wheelRotationRef.current = 0;
      // eslint-disable-next-line no-unused-expressions
      wheelEl.offsetWidth;

      setWheelText(chosen.name);

      if (mapRef.current && chosen.location) {
        mapRef.current.panTo(chosen.location);
        mapRef.current.setZoom(16);
      }

      markersRef.current.forEach((marker, idx) => {
        const isWinner = idx === chosenIndex;
        marker.setIcon(
          isWinner ? pinIcon(GOLD, WINE_900, 1.9, 2) : pinIcon(WINE_700, CREAM)
        );
        marker.setZIndex(isWinner ? window.google.maps.Marker.MAX_ZINDEX + 1 : null);
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
          colors: CONFETTI_COLORS,
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
          colors: CONFETTI_COLORS,
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

  function zoomBy(delta) {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(map.getZoom() + delta);
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

      <div className="map-zoom" role="group" aria-label="Map zoom">
        <button type="button" className="map-zoom-btn" onClick={() => zoomBy(1)} aria-label="Zoom in">
          <PlusIcon />
        </button>
        <button type="button" className="map-zoom-btn" onClick={() => zoomBy(-1)} aria-label="Zoom out">
          <MinusIcon />
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
            <FilterIcon />
            {activeFilterCount > 0 && <span className="pill-badge">{activeFilterCount}</span>}
          </button>
          <div className="search-wrapper">
            <SearchIcon className="search-icon" />
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
