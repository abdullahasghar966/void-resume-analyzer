import type { Variants } from "framer-motion";

/**
 * Pill enter/exit for AnimatePresence. Per-pill stagger is applied by the
 * parent via a delay derived from index (0.025s each), since AnimatePresence
 * doesn't drive staggerChildren.
 */
export const pillVariants: Variants = {
  initial: { opacity: 0, x: -16, scale: 0.88 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 16, scale: 0.88, transition: { duration: 0.15 } },
};

export const highlightCardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 240, damping: 26 },
  },
};
