import { useEffect } from "react";

export default function Wheel({ wheelText, spinWheel, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="wheel-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Spin the wheel"
    >
      <div className="wheel-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="wheel-modal-close"
          onClick={onClose}
          type="button"
          aria-label="Close wheel"
        >
          ×
        </button>
        <div className="wheel-modal-title">Wheel of Fortune</div>
        <div
          id="wheel"
          onClick={spinWheel}
          role="button"
          tabIndex={0}
          aria-label="Spin the wheel"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              spinWheel();
            }
          }}
        >
          {wheelText}
        </div>
        <div className="wheel-modal-hint">Tap the wheel to spin</div>
      </div>
    </div>
  );
}
