import { useRef } from "react";
import type { RefObject } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useScoreEngine } from "./useScoreEngine";
import { ScoreRing } from "./ScoreRing";
import { SubScoreCard } from "./SubScoreCard";
import { cardVariants, containerVariants } from "./scoreMatrixVariants";
import type { AsyncStatus } from "@/types";

/** Idle / scoring / error / no-resume states for the dashboard. */
function ScoreMatrixState({
  status,
  hasResume,
}: {
  status: AsyncStatus;
  hasResume: boolean;
}) {
  const message = !hasResume
    ? "Upload a résumé above to generate your ATS report."
    : status === "scoring"
      ? "Analysing résumé…"
      : status === "error"
        ? "Scoring failed — re-upload to retry."
        : "Waiting for analysis…";

  return (
    <div className="glass rounded-2xl px-10 py-16 text-center">
      {status === "scoring" && (
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-bio-green/30 border-t-bio-green" />
      )}
      <p className="font-body text-sm text-void-muted">{message}</p>
    </div>
  );
}

/**
 * Module 2 — scroll-linked ATS dashboard.
 *
 * A single useScroll pass maps the section's transit through the viewport to a
 * fly-IN (scale up + de-blur) and a fly-OUT (scale down + re-blur). Blur is on
 * the OUTER wrapper only (it's a paint trigger) and the scale on an inner node,
 * so the costly filter never shares a layer with the transform.
 */
export function ScoreMatrix({
  scrollRef,
}: {
  scrollRef: RefObject<HTMLElement>;
}) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scores, status } = useScoreEngine();
  const inView = useInView(sectionRef, { amount: 0.3 });

  const { scrollYProgress } = useScroll({
    container: scrollRef,
    target: sectionRef,
    offset: ["start end", "end start"], // 0 = entering bottom, 1 = exited top
  });

  // enter (0→0.25) … hold … exit (0.75→1)
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0, 1, 1, 0.35]);
  const blurPx = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [8, 0, 0, 6]);
  const filter = useTransform(blurPx, (v) => `blur(${v}px)`);
  const scale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.84, 1, 1, 0.92]);

  const outerStyle = reduce ? undefined : { opacity, filter };
  const innerStyle = reduce ? undefined : { scale };

  const ready = status === "done" && scores !== null;

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full items-center justify-center px-6 py-20"
    >
      <motion.div style={outerStyle} className="w-full max-w-5xl">
        <motion.div style={innerStyle} className="preserve-3d">
          <header className="mb-10 text-center">
            <span className="terminal text-bio-green">
              MODULE 02 · SCORE MATRIX
            </span>
            <h2 className="mt-2 font-display text-3xl text-void-text">
              ATS Intelligence Report
            </h2>
          </header>

          {!ready || !scores ? (
            <ScoreMatrixState status={status} hasResume={status !== "idle"} />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]"
            >
              {/* Overall ring */}
              <motion.div
                variants={cardVariants}
                className="glass flex flex-col items-center justify-center rounded-2xl p-8"
              >
                <ScoreRing value={scores.overall} active={inView} />
                <p className="mt-4 text-center font-body text-xs leading-relaxed text-void-muted">
                  {scores.summary}
                </p>
              </motion.div>

              {/* Sub-scores */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <SubScoreCard label="Impact" value={scores.impact} variants={cardVariants} />
                <SubScoreCard label="Keywords" value={scores.keywords} variants={cardVariants} />
                <SubScoreCard label="Formatting" value={scores.formatting} variants={cardVariants} />
                <SubScoreCard label="Completeness" value={scores.completeness} variants={cardVariants} />
              </div>
            </motion.div>
          )}

          {/* Strengths / issues */}
          {ready && scores && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2"
            >
              <motion.div variants={cardVariants} className="glass rounded-2xl p-6">
                <div className="terminal mb-3 text-bio-green">TOP STRENGTHS</div>
                {scores.topStrengths.length > 0 ? (
                  <ul className="space-y-2">
                    {scores.topStrengths.map((s, i) => (
                      <li key={i} className="flex gap-2 font-body text-sm text-void-text">
                        <span className="text-bio-green">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-body text-sm text-void-muted">
                    Strengths surface here once the analysis runs.
                  </p>
                )}
              </motion.div>
              <motion.div variants={cardVariants} className="glass rounded-2xl p-6">
                <div className="terminal mb-3 text-danger-red">TOP ISSUES</div>
                {scores.topIssues.length > 0 ? (
                  <ul className="space-y-2">
                    {scores.topIssues.map((s, i) => (
                      <li key={i} className="flex gap-2 font-body text-sm text-void-text">
                        <span className="text-danger-red">✗</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="flex items-center gap-2 font-body text-sm text-bio-green">
                    <span aria-hidden>✓</span>
                    No major issues flagged — this résumé is in strong shape.
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
