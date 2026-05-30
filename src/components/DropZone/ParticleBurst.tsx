import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  hue: string; // "r,g,b" for rgba()
}

/**
 * 24-particle radial burst on a 2D canvas (brief spec):
 *   angle spread 0–360°, velocity 2–6 px/frame, friction 0.96/frame, opacity
 *   fade via `life`. The rAF loop self-terminates once every particle dies, so
 *   the canvas stops repainting even before the parent unmounts it.
 *
 * Canvas (not 24 DOM nodes) keeps this to a single composited layer.
 */
export function ParticleBurst({ onDone }: { onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const COUNT = 24;

    const particles: Particle[] = Array.from({ length: COUNT }, (_, i) => {
      // even angular spread + small jitter so it reads organic, not mechanical
      const angle = (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const velocity = 2 + Math.random() * 4; // 2–6 px/frame
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        hue: Math.random() > 0.5 ? "0,255,178" : "123,97,255",
      };
    });

    let raf = 0;
    let cancelled = false;

    const tick = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      let anyAlive = false;

      for (const p of particles) {
        p.vx *= 0.96; // friction
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.018; // ~55 frames ≈ 0.9s lifespan

        if (p.life > 0) {
          anyAlive = true;
          const a = Math.max(p.life, 0);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.hue},${a})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(${p.hue},${a})`;
          ctx.fill();
        }
      }

      if (anyAlive && !cancelled) {
        raf = requestAnimationFrame(tick);
      } else if (!cancelled) {
        onDone?.();
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
