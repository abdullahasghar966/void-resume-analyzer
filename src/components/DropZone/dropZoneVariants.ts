import type { Variants } from "framer-motion";

/**
 * Card flip-back on drop. rotateX 0 → -25 → 0 governed by a spring
 * (stiffness 180 / damping 18) per the brief — the array makes it a two-phase
 * flip that springs between each waypoint. Success morph scales 1 → 0.96 → 1.
 *
 * NOTE: this drives the *inner* card. The mouse-tilt rotateX/rotateY lives on
 * the outer wrapper so the two never write the same transform channel.
 */
export const cardDropVariants: Variants = {
  idle: { rotateX: 0, scale: 1 },
  dropping: {
    rotateX: [0, -25, 0],
    transition: { type: "spring", stiffness: 180, damping: 18, mass: 0.9 },
  },
  success: {
    scale: [1, 0.96, 1],
    transition: { duration: 0.5, times: [0, 0.4, 1], ease: "easeOut" },
  },
};

/**
 * Each terminal line owns its own char-stagger so appending a new line never
 * re-animates the lines already printed. 0.04s per character (brief spec).
 */
export const terminalLineVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

export const charVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
};
