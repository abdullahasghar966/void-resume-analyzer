import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Void Bioluminescence channels.
const BIO = "0,255,178";
const INDIGO = "123,97,255";

interface Star {
  x: number; y: number; r: number; vx: number; vy: number;
  a: number; tw: number; tp: number;
}
interface Orb {
  x: number; y: number; r: number; vx: number; vy: number;
  hue: string; pulse: number; ps: number;
}
interface Glyph {
  x: number; y: number; r: number; rot: number; vr: number;
  vx: number; vy: number; hue: string; a: number; kind: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Deep-ocean bioluminescence rendered on a single 2D canvas — drifting plankton
 * (stars), glowing orbs linked by faint constellation lines, and slow-rotating
 * "creature" doodles. Replaces the Three.js/drei background: no heavy deps, no
 * dynamic-import fragility, ~218KB lighter, and genuinely alive.
 *
 * Compositor-friendly: one canvas layer, a single rAF loop, dpr capped at 1.5.
 * Honours prefers-reduced-motion by painting one static frame and stopping.
 */
export function LivingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let orbs: Orb[] = [];
    let glyphs: Glyph[] = [];
    const mouse = { x: -9999, y: -9999 };

    const init = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = w * h;

      stars = Array.from({ length: Math.min(130, Math.round(area / 13000)) }, () => ({
        x: rand(0, w), y: rand(0, h), r: rand(0.4, 1.5),
        vx: rand(-0.05, 0.05), vy: rand(-0.04, 0.04),
        a: rand(0.2, 0.7), tw: rand(0.005, 0.02), tp: rand(0, Math.PI * 2),
      }));

      orbs = Array.from({ length: Math.min(16, Math.max(6, Math.round(area / 95000))) }, () => ({
        x: rand(0, w), y: rand(0, h), r: rand(1.6, 4),
        vx: rand(-0.15, 0.15), vy: rand(-0.12, 0.12),
        hue: Math.random() > 0.5 ? BIO : INDIGO,
        pulse: rand(0, Math.PI * 2), ps: rand(0.01, 0.03),
      }));

      glyphs = Array.from({ length: 6 }, () => ({
        x: rand(0, w), y: rand(0, h), r: rand(14, 34),
        rot: rand(0, Math.PI * 2), vr: rand(-0.003, 0.003),
        vx: rand(-0.08, 0.08), vy: rand(-0.06, 0.06),
        hue: Math.random() > 0.5 ? BIO : INDIGO,
        a: rand(0.05, 0.11), kind: Math.floor(rand(0, 3)),
      }));
    };

    const wrap = (p: { x: number; y: number }) => {
      if (p.x < -40) p.x = w + 40;
      else if (p.x > w + 40) p.x = -40;
      if (p.y < -40) p.y = h + 40;
      else if (p.y > h + 40) p.y = -40;
    };

    const draw = (animate: boolean) => {
      ctx.clearRect(0, 0, w, h);

      // ── plankton / stars ──
      for (const s of stars) {
        if (animate) {
          s.x += s.vx; s.y += s.vy; s.tp += s.tw; wrap(s);
        }
        const a = s.a + (animate ? Math.sin(s.tp) * 0.25 : 0);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,214,232,${Math.max(0.05, a)})`;
        ctx.fill();
      }

      // ── creature doodles (arcs / radials) ──
      for (const g of glyphs) {
        if (animate) {
          g.x += g.vx; g.y += g.vy; g.rot += g.vr; wrap(g);
        }
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.rot);
        ctx.strokeStyle = `rgba(${g.hue},${g.a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (g.kind === 0) {
          ctx.arc(0, 0, g.r, 0, Math.PI * 1.4);
        } else if (g.kind === 1) {
          ctx.arc(0, 0, g.r, 0, Math.PI * 2);
          ctx.moveTo(-g.r - 4, 0); ctx.lineTo(g.r + 4, 0);
          ctx.moveTo(0, -g.r - 4); ctx.lineTo(0, g.r + 4);
        } else {
          for (let i = 0; i < 5; i++) {
            const an = (i / 5) * Math.PI * 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(an) * g.r, Math.sin(an) * g.r);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // ── constellation links between orbs ──
      for (let i = 0; i < orbs.length; i++) {
        for (let j = i + 1; j < orbs.length; j++) {
          const a = orbs[i];
          const b = orbs[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 175) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,255,178,${(1 - d / 175) * 0.12})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // ── glowing orbs ──
      for (const o of orbs) {
        if (animate) {
          o.x += o.vx; o.y += o.vy; o.pulse += o.ps; wrap(o);
          const dx = o.x - mouse.x;
          const dy = o.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 130 && d > 0.01) {
            const f = ((130 - d) / 130) * 0.5; // soft cursor repulsion
            o.x += (dx / d) * f;
            o.y += (dy / d) * f;
          }
        }
        const pr = Math.max(0.5, o.r + (animate ? Math.sin(o.pulse) * 0.8 : 0));
        ctx.beginPath();
        ctx.arc(o.x, o.y, pr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${o.hue},0.9)`;
        ctx.shadowBlur = 16;
        ctx.shadowColor = `rgba(${o.hue},0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    init();

    let raf = 0;
    if (reduce) {
      draw(false);
    } else {
      const loop = () => {
        draw(true);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        init();
        if (reduce) draw(false);
      }, 200);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    };
  }, [reduce]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ display: "block" }}
    />
  );
}
