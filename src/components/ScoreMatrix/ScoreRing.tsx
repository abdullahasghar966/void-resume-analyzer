import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

const SIZE = 200;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R; // circumference → the full stroke-dasharray length

function bandColor(v: number): string {
  return v >= 70 ? "#00FFB2" : v >= 45 ? "#FFD32A" : "#FF4757";
}

/**
 * Large ATS ring. A spring (stiffness 80 / damping 12 / restDelta 0.01, per the
 * brief) drives a 0→value MotionValue; strokeDashoffset is derived from it, so
 * the arc sweeps and the centre number counts up in lockstep.
 *
 * The number is written imperatively via useMotionValueEvent → ref.textContent,
 * which avoids ~60 React re-renders during the count-up.
 */
export function ScoreRing({ value, active }: { value: number; active: boolean }) {
  const reduce = useReducedMotion();
  const numRef = useRef<HTMLSpanElement>(null);

  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 12, restDelta: 0.01 });
  // map spring 0..100 → dashoffset C..0 (full gap → no gap = full arc)
  const dashOffset = useTransform(spring, [0, 100], [C, 0]);

  useEffect(() => {
    // Only animate once the ring is in view; reduced-motion shows the value flat.
    if (!active || reduce) return;
    mv.set(value);
  }, [active, value, reduce, mv]);

  useMotionValueEvent(spring, "change", (v) => {
    if (numRef.current) numRef.current.textContent = String(Math.round(v));
  });

  const color = bandColor(value);
  const staticOffset = C - (value / 100) * C;

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        className="-rotate-90"
        role="img"
        aria-label={`ATS score: ${value} out of 100`}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          style={{
            strokeDashoffset: reduce ? staticOffset : dashOffset,
            filter: `drop-shadow(0 0 6px ${color}88)`,
          }}
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-5xl text-void-text">
          <span ref={numRef}>{reduce ? value : 0}</span>
        </div>
        <div className="terminal text-void-muted">ATS SCORE</div>
      </div>
    </div>
  );
}
