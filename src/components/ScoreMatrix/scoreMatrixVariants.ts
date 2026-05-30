import type { Variants } from "framer-motion";

// Cascade container: children fly in 0.09s apart, after a 0.2s lead-in (brief).
export const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};

// Each card rises + scales in on a spring (stiffness 260 / damping 24 / mass 0.8).
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 24, mass: 0.8 },
  },
};
