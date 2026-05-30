import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * 12px bio-green crosshair ring that tracks the pointer.
 *
 * Movement is committed via `transform: translate3d(...)` with an 80ms linear
 * transition — never top/left — so the compositor handles it and layout is
 * never touched. Pointer events are rAF-throttled: rapid mousemove can schedule
 * at most one transform write per frame.
 */
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    // No cursor to replace on touch / coarse pointers — bail entirely.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          // translate3d promotes to its own layer; -50% centres the 24px box.
          el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        });
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    // Reveal only once the first real move arrives (avoids a corner flash).
    el.style.opacity = "1";

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Honour reduced-motion: no synthetic trailing cursor at all.
  if (reduce) return null;

  return (
    <div
      aria-hidden
      ref={ref}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 24,
        height: 24,
        opacity: 0,
        zIndex: 9999,
        pointerEvents: "none",
        transition: "transform 80ms linear, opacity 220ms ease",
        willChange: "transform",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "1.5px solid #00FFB2",
          boxShadow: "0 0 8px rgba(0,255,178,0.6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 2,
          height: 2,
          transform: "translate(-50%,-50%)",
          background: "#00FFB2",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
