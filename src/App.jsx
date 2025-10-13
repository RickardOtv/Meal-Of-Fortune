import { useEffect, useState, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import "./index.css";
import GOOGLE_MAPS_API_KEY from "./key";

export default function App() {
  const mapRef = useRef(null);
  const circleRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);
  const [restaurants, setRestaurants] = useState([]);
  const [wheelText, setWheelText] = useState("🎡 Spin Me");
  const [radius, setRadius] = useState(500);
  const [selectedIndexes, setSelectedIndexes] = useState([]);

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
    });
    loader.load().then((google) => {
      initMap(google);
    });
  }, []);

  async function initMap(google) {
    const { Map, InfoWindow } = await google.maps.importLibrary("maps");

    const setup = (loc, zoom = 15) => {
      mapRef.current = new Map(document.getElementById("map"), {
        center: loc,
        zoom,
      });

      new google.maps.Marker({
        map: mapRef.current,
        position: loc,
        title: "You are here",
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        },
      });

      circleRef.current = new google.maps.Circle({
        map: mapRef.current,
        center: loc,
        radius,
        strokeColor: "#4285F4",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#4285F4",
        fillOpacity: 0.15,
        clickable: false,
      });

      infoWindowRef.current = new InfoWindow();

      mapRef.current.addListener("center_changed", () => {
        const c = mapRef.current.getCenter();
        if (c && circleRef.current) circleRef.current.setCenter(c);
      });
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => setup({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        alert("Geolocation failed, using NYC fallback.");
        setup({ lat: 40.7128, lng: -74.006 }, 14);
      }
    );
  }

  async function fetchRestaurants(centerLiteral, radius) {
    const resp = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.photos,places.googleMapsUri",
        },
        body: JSON.stringify({
          includedPrimaryTypes: ["restaurant"],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: centerLiteral.lat,
                longitude: centerLiteral.lng,
              },
              radius,
            },
          },
        }),
      }
    );

    const data = await resp.json();
    return (data.places || []).map((p) => ({
      id: p.id,
      name: p.displayName?.text || "Unnamed Restaurant",
      address: p.formattedAddress || "",
      location: {
        lat: p.location.latitude,
        lng: p.location.longitude,
      },
      rating: p.rating,
      priceLevel: p.priceLevel,
      photoUrl: p.photos?.[0]
        ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?key=${GOOGLE_MAPS_API_KEY}&maxHeightPx=80&maxWidthPx=80`
        : null,
      mapsUrl: p.googleMapsUri,
    }));
  }

  async function searchRestaurants(google) {
    if (!mapRef.current) return;
    const centerObj = mapRef.current.getCenter();
    if (!centerObj) return;

    const centerLiteral = { lat: centerObj.lat(), lng: centerObj.lng() };

    if (circleRef.current) {
      circleRef.current.setCenter(centerObj);
      circleRef.current.setRadius(radius);
    }

    const items = await fetchRestaurants(centerLiteral, radius);
    setRestaurants(items);
    setWheelText("🎡 Spin Me");
    setSelectedIndexes(items.map((_, i) => i)); // Select all by default

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const iw = infoWindowRef.current;

    items.forEach((r) => {
      if (!r.location) return;
      const marker = new google.maps.Marker({
        map: mapRef.current,
        position: r.location,
        title: r.name,
      });

      marker.addListener("click", () => {
        const div = document.createElement("div");
        div.style.maxWidth = "240px";

        const nameEl = document.createElement("div");
        nameEl.style.fontWeight = "bold";
        nameEl.textContent = r.name;

        const addrEl = document.createElement("div");
        addrEl.textContent = r.address;

        div.append(nameEl, addrEl);

        if (r.mapsUrl) {
          const a = document.createElement("a");
          a.href = r.mapsUrl;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = "Open in Google Maps";
          a.style.display = "inline-block";
          a.style.marginTop = "6px";
          div.appendChild(a);
        }

        iw.setContent(div);
        iw.open({ map: mapRef.current, anchor: marker });
      });

      markersRef.current.push(marker);
    });
  }

  function spinWheel() {
    if (selectedIndexes.length === 0) {
      setWheelText("⚠️ Select at least one!");
      return;
    }

    const wheelEl = document.getElementById("wheel");
    const chosenIndex = selectedIndexes[Math.floor(Math.random() * selectedIndexes.length)];
    const chosen = restaurants[chosenIndex];

    if (wheelEl) {
      const spins = Math.floor(Math.random() * 3) + 5; // 5-7 spins
      const degrees = spins * 360;

      wheelEl.style.transition = "transform 2s ease-out";
      wheelEl.style.transform = `rotate(${degrees}deg)`;

      setTimeout(() => {
        setWheelText(`🎉 ${chosen.name}`);
        wheelEl.style.transition = "none";
        wheelEl.style.transform = "rotate(0deg)";
      }, 2000);
    }
  }

  function handleRadiusChange(e) {
    const r = Number(e.target.value);
    setRadius(r);
    if (circleRef.current) circleRef.current.setRadius(r);
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

  return (
    <div className="app">
      <h1>🍽️ Meal of Fortune 🎡</h1>
      <div className="main-layout">
        {/* Wheel Section - Left */}
        <section className="wheel-section">
          <div className="wheel-bg">
            <div id="wheel" onClick={spinWheel}>
              {wheelText}
            </div>
            <div className="dragbar-controls">
              <label>
                Radius: <strong>{radius} m</strong>
              </label>
              <input
                type="range"
                min="100"
                max="1500"
                step="100"
                value={radius}
                onChange={handleRadiusChange}
                className="radius-slider"
              />
              <button onClick={() => searchRestaurants(window.google)}>Search</button>
            </div>
          </div>
        </section>

        {/* Map Section - Center */}
        <section className="map-section">
          <div className="map-bg">
            <div id="map"></div>
          </div>
        </section>

        {/* Sidebar Section - Right */}
        <aside className="sidebar-bg">
          <div className="sidebar">
            <div className="sidebar-header">
              <h2>Found Restaurants</h2>
            </div>
            {restaurants.length === 0 && (
              <p className="no-results">No results yet. Drag map and press Search.</p>
            )}
            <ul>
              {restaurants.map((r, i) => (
                <li
                  key={r.id ?? i}
                  className="restaurant-item"
                  onClick={() => focusRestaurant(i, window.google)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIndexes.includes(i)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => {
                      handleCheckboxChange(i);
                    }}
                    className="restaurant-checkbox"
                    aria-label={`Select ${r.name}`}
                  />
                  {r.photoUrl && (
                    <img
                      src={r.photoUrl}
                      alt={r.name}
                      className="restaurant-photo"
                    />
                  )}
                  <div className="restaurant-details">
                    <strong>{r.name}</strong>
                    <br />
                    <small>{r.address}</small>
                    <br />
                    <small>{priceToSymbols(r.priceLevel)}</small>
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
      </div>
    </div>
  );
}

// helpers
function priceToSymbols(level) {
  if (!level) return "";
  const map = {
    PRICE_LEVEL_FREE: "Free",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };
  return map[level] || "";
}
