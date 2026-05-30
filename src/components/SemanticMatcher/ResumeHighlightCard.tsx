import { forwardRef } from "react";
import { motion } from "framer-motion";
import { highlightCardVariants } from "./matchVariants";
import type { ResumeHighlight } from "@/types";

/**
 * One auto-extracted résumé sentence (left panel). The parent observes these
 * via the forwarded ref; `data-keyword` tells the scroll-sync which pill to
 * light up when this card enters the viewport. `active` reflects the reverse —
 * it brightens while its keyword is the highlighted one.
 */
export const ResumeHighlightCard = forwardRef<
  HTMLDivElement,
  { highlight: ResumeHighlight; active: boolean }
>(({ highlight, active }, ref) => {
  return (
    <motion.div
      ref={ref}
      data-keyword={highlight.linkedKeywords[0] ?? ""}
      variants={highlightCardVariants}
      className="glass rounded-2xl p-5 transition-colors duration-300"
      style={{
        borderColor: active ? "rgba(0,255,178,0.45)" : "rgba(0,255,178,0.08)",
      }}
    >
      <p className="font-body text-sm leading-relaxed text-void-text">
        {highlight.text}
      </p>
      {highlight.linkedKeywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {highlight.linkedKeywords.map((k) => (
            <span
              key={k}
              className="rounded-full border border-bio-green/25 px-2 py-0.5 text-[10px] uppercase tracking-wide text-bio-green/80"
            >
              {k}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
});

ResumeHighlightCard.displayName = "ResumeHighlightCard";
