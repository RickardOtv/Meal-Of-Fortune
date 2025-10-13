export default function Wheel({ wheelText, spinWheel, radius, handleRadiusChange, searchRestaurants }) {
  return (
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
          <button onClick={searchRestaurants}>Search</button>
        </div>
      </div>
    </section>
  );
}