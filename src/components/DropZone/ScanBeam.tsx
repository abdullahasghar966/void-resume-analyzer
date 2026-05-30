import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Holographic scan line. Sweeps top → bottom of the card once, then fades.
 *
 * The travel distance is the parent's pixel height, measured once in a layout
 * effect (before paint) so the beam never overshoots. Animation touches only
 * `transform: translateY` + `opacity` — compositor-only, zero layout.
 *
 *   times [0, 0.08, 0.875, 1] over 1.6s →
 *     ~130ms fade-in, travel until ~1.4s, ~200ms fade-out (matches the brief).
 */
export function ScanBeam() {
  const ref = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(360);

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (parent) setTravel(parent.offsetHeight - 2);
  }, []);

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
      style={{
        background:
          "linear-gradient(90deg, transparent, #00FFB2 30%, #7B61FF 70%, transparent)",
        boxShadow: "0 0 18px 2px rgba(0,255,178,0.7)",
        willChange: "transform, opacity",
      }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: [0, 0, travel, travel], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.6, times: [0, 0.08, 0.875, 1], ease: "linear" }}
    />
  );
}
