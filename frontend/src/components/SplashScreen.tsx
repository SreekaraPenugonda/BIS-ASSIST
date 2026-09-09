import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="splash-screen" role="status" aria-label="Loading BIS Assist">
      <div className="splash-content">
        <div className="splash-logo-wrap">
          <span className="splash-ring splash-ring-one" aria-hidden="true" />
          <span className="splash-ring splash-ring-two" aria-hidden="true" />
          <img src="/Bureau_of_Indian_Standards_Logo.svg" alt="Bureau of Indian Standards" className="splash-logo" />
        </div>
        <p className="splash-title">BIS Assist</p>
        <p className="splash-subtitle">Indian Standards · Safer choices</p>
        <span className="splash-loader" aria-hidden="true" />
      </div>
    </div>
  );
}