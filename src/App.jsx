import { useEffect, useState, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import "./index.css";
import GOOGLE_MAPS_API_KEY from "./key";
import Wheel from "./components/Wheel";
import Map from "./components/Map";
import Sidebar from "./components/Sidebar";

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
  const circleRef = useRef(null);      // Search radius circle
  const infoWindowRef = useRef(null);  // Info window for markers
  const markersRef = useRef([]);       // Restaurant markers

  const [restaurants, setRestaurants] = useState([]); // List of found restaurants
  const [wheelText, setWheelText] = useState("🎡 Spin Me"); // Wheel display text
  const [radius, setRadius] = useState(500);           // Search radius in meters
  const [selectedIndexes, setSelectedIndexes] = useState([]); // Selected restaurants

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

      // "You are here" marker
      new google.maps.Marker({
        map: mapRef.current,
        position: loc,
        title: "You are here",
        icon: { url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" },
      });

      // Search radius circle
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

      // Keep circle centered when map moves
      mapRef.current.addListener("center_changed", () => {
        const c = mapRef.current.getCenter();
        if (c && circleRef.current) circleRef.current.setCenter(c);
      });
    };

    // Try geolocation, fallback to NYC
    navigator.geolocation.getCurrentPosition(
      (pos) => setup({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        alert("Geolocation failed, using NYC fallback.");
        setup({ lat: 40.7128, lng: -74.006 }, 14);
      }
    );
  }

  // ===== Fetch restaurants from Google Places API =====
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
    return (data.places || []).map((place) => ({
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
    }));
  }

  // ===== Search for restaurants and update map =====
  async function searchRestaurants(google) {
    if (!mapRef.current) return;
    const centerObj = mapRef.current.getCenter();
    if (!centerObj) return;

    const centerLiteral = { lat: centerObj.lat(), lng: centerObj.lng() };

    // Update circle position and radius
    if (circleRef.current) {
      circleRef.current.setCenter(centerObj);
      circleRef.current.setRadius(radius);
    }

    // Fetch restaurants
    const items = await fetchRestaurants(centerLiteral, radius);
    setRestaurants(items);
    setWheelText("🎡 Spin Me");
    setSelectedIndexes(items.map((_, i) => i)); // Select all by default

    // Remove old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Add new markers (all red)
    const iw = infoWindowRef.current;
    items.forEach((r) => {
      if (!r.location) return;
      const marker = new google.maps.Marker({
        map: mapRef.current,
        position: r.location,
        title: r.name,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
        }
      });

      marker.addListener("click", () => {
        const div = document.createElement("div");
        div.style.maxWidth = "240px";
        div.innerHTML = `
          <div style="font-weight:bold;">${r.name}</div>
          <div>${r.address}</div>
          ${r.mapsUrl ? `<a href="${r.mapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;">Open in Google Maps</a>` : ""}
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
        // Set all markers to red, winner to green
        markersRef.current.forEach((marker, idx) => {
          marker.setIcon({
            url: idx === chosenIndex
              ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
              : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
          });
        });
      }, 2000);
    }
  }

  // ===== UI Handlers =====
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

  // ===== Render UI =====
  return (
    <div className="app">
      <h1>🍽️ Meal of Fortune 🎡</h1>
      <div className="main-layout">
        <Wheel
          wheelText={wheelText}
          spinWheel={spinWheel}
          radius={radius}
          handleRadiusChange={handleRadiusChange}
          searchRestaurants={() => searchRestaurants(window.google)}
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
    </div>
  );
}
