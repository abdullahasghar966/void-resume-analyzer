import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useResumeStore } from "@/store/resumeStore";
import { pillVariants } from "./matchVariants";

export type PillKind = "matched" | "missing" | "partial";

const STYLES: Record<PillKind, { bg: string; border: string; color: string; icon: string }> = {
  matched: { bg: "rgba(0,255,178,0.12)", border: "#00FFB2", color: "#00FFB2", icon: "✓" },
  missing: { bg: "rgba(255,71,87,0.10)", border: "#FF4757", color: "#FF4757", icon: "✗" },
  partial: { bg: "rgba(255,211,42,0.10)", border: "#FFD32A", color: "#FFD32A", icon: "≈" },
};

/**
 * A single keyword pill.
 *
 * Layering keeps transforms from colliding:
 *  · OUTER motion.div  → AnimatePresence enter/exit (x offset + scale + opacity)
 *  · INNER motion.div  → magnetic cursor repulsion (x/y springs) + scroll-sync
 *                        flash (scale keyframes via animation controls)
 *
 * Magnetic math: within 80px of the pill centre, push AWAY from the cursor by
 * up to 35% of the offset, scaled by proximity → a springy "repulsion".
 */
export function KeywordPill({
  label,
  kind,
  index,
}: {
  label: string;
  kind: PillKind;
  index: number;
}) {
  const reduce = useReducedMotion();
  const innerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const highlighted = useResumeStore((s) => s.highlightedKeyword);

  const s = STYLES[kind];

  // Magnetic repulsion offsets (raw → spring-smoothed).
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 500, damping: 14 });
  const sy = useSpring(y, { stiffness: 500, damping: 14 });

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = innerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    if (dist < 80) {
      const force = (80 - dist) / 80; // 0 at edge → 1 at centre
      x.set((e.clientX - cx) * -0.35 * force);
      y.set((e.clientY - cy) * -0.35 * force);
    } else {
      x.set(0);
      y.set(0);
    }
  };

  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Scroll-sync: when this pill's keyword is the active one, flash + reveal.
  useEffect(() => {
    if (!highlighted || highlighted.toLowerCase() !== label.toLowerCase()) return;
    innerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!reduce) {
      void controls.start({
        scale: [1, 1.12, 1],
        transition: { type: "spring", stiffness: 400, damping: 10 },
      });
    }
  }, [highlighted, label, controls, reduce]);

  return (
    <motion.div
      layout
      variants={pillVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      // per-pill stagger on enter (brief: 0.025s each)
      transition={{ type: "spring", stiffness: 340, damping: 22, delay: index * 0.025 }}
    >
      <motion.div
        ref={innerRef}
        animate={controls}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="flex cursor-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
        style={{
          x: reduce ? 0 : sx,
          y: reduce ? 0 : sy,
          background: s.bg,
          borderColor: s.border,
          color: s.color,
        }}
      >
        <span aria-hidden>{s.icon}</span>
        <span>{label}</span>
      </motion.div>
    </motion.div>
  );
}
