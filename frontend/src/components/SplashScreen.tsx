import { useEffect, useState } from "react";
import { motion } from "motion/react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [hasArtwork, setHasArtwork] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1100);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      className={`splash-screen ${hasArtwork ? "splash-screen-artwork" : ""}`}
      role="status"
      aria-label="Loading BIS Assist"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {hasArtwork && (
        <motion.img
          src="/splash-welcome.png"
          alt="Namaste welcome to BIS"
          className="splash-artwork"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          onError={() => setHasArtwork(false)}
        />
      )}
      {!hasArtwork && (
        <motion.div
          className="splash-content"
          initial={{ opacity: 0, y: 18, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="splash-logo-wrap">
            <motion.span className="splash-ring splash-ring-one" aria-hidden="true" animate={{ scale: [0.65, 1.25], opacity: [0.7, 0] }} transition={{ duration: 2.2, repeat: Infinity }} />
            <motion.span className="splash-ring splash-ring-two" aria-hidden="true" animate={{ scale: [0.65, 1.25], opacity: [0.7, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.8 }} />
            <motion.img src="/Bureau_of_Indian_Standards_Logo.svg" alt="Bureau of Indian Standards" className="splash-logo" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
          </div>
          <p className="splash-title">BIS Assist</p>
          <motion.p className="splash-namaste" aria-label="Namaste welcome" animate={{ opacity: [0.65, 1, 0.65], y: [3, 0, 3] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>नमस्ते · Namaste</motion.p>
          <p className="splash-subtitle">Indian Standards · Safer choices</p>
          <motion.span className="splash-loader" aria-hidden="true"><span /></motion.span>
        </motion.div>
      )}
    </motion.div>
  );
}