import { motion, useReducedMotion, type Variants } from "framer-motion";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

function bandColor(v: number): string {
  return v >= 70 ? "#00FFB2" : v >= 45 ? "#FFD32A" : "#FF4757";
}

/**
 * One sub-score: glassmorphic card, bio-green left accent, a Recharts radial
 * gauge, and the numeric value. Participates in the parent's cascade via
 * `variants`. The idle "breathe" lives on an inner wrapper so its scale never
 * fights the card's entrance transform (both are `transform`, different nodes).
 */
export function SubScoreCard({
  label,
  value,
  variants,
}: {
  label: string;
  value: number;
  variants: Variants;
}) {
  const reduce = useReducedMotion();
  const color = bandColor(value);
  const data = [{ name: label, value }];

  return (
    <motion.div
      variants={variants}
      className="glass relative overflow-hidden rounded-2xl p-5"
    >
      {/* bio-green left accent */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: "#00FFB2" }}
      />

      <div
        className="flex items-center justify-between animate-breathe will-change-transform"
        style={{ animation: reduce ? "none" : undefined }}
      >
        <div>
          <div className="terminal text-void-muted">{label.toUpperCase()}</div>
          <div className="mt-1 font-display text-3xl" style={{ color }}>
            {value}
            <span className="text-sm text-void-muted">/100</span>
          </div>
        </div>

        <div className="relative h-[88px] w-[88px]" aria-hidden>
          <RadialBarChart
            width={88}
            height={88}
            innerRadius="72%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            {/* domain [0,100] makes the bar length a true percentage */}
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              fill={color}
              background={{ fill: "rgba(255,255,255,0.05)" }}
              isAnimationActive={!reduce}
            />
          </RadialBarChart>
        </div>
      </div>
    </motion.div>
  );
}
