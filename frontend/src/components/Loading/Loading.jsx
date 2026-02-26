import { useEffect, useState } from "react";
import "./Loading.css";

function Loading() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loader-root">
      <div className="loader-inner">
        <div className="loader-bars">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="loader-bar" style={{ "--i": i }} />
          ))}
        </div>
        <span className="loader-label">
          {".".repeat(tick)}
        </span>
      </div>
    </div>
  );
}

export default Loading;