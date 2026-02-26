import { useEffect, useState } from "react";
import "./Loading.css";

function Loading() {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loader-root">
      <div className="loader-bg" />

      <div className="loader-card">
        {/* Soundwave bars */}
        <div className="loader-bars">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="loader-bar" style={{ "--i": i }} />
          ))}
        </div>

        {/* Spinning vinyl disc */}
        <div className="loader-vinyl">
          <div className="loader-vinyl-inner">
            <div className="loader-vinyl-dot" />
          </div>
        </div>

        <p className="loader-label">
          <span className="loader-dots">{"·".repeat(dots)}</span>
        </p>
      </div>
    </div>
  );
}

export default Loading