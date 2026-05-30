import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { useResumeStore } from "@/store/resumeStore";
import { useMatchEngine } from "./useMatchEngine";
import { KeywordPill, type PillKind } from "./KeywordPill";
import { ResumeHighlightCard } from "./ResumeHighlightCard";

const SAMPLE_JD = `We are looking for a Senior Software Engineer to join our team.

Requirements:
- 5+ years of experience in software development
- Strong proficiency in JavaScript, TypeScript, React, and Node.js
- Experience with cloud platforms (AWS, GCP, or Azure)
- Familiarity with CI/CD pipelines, Docker, and Kubernetes
- Strong understanding of RESTful APIs and microservices architecture
- Experience with SQL and NoSQL databases (PostgreSQL, MongoDB)
- Excellent problem-solving and communication skills
- Bachelor's degree in Computer Science or related field

Nice to have:
- Experience with Python, Go, or Rust
- Knowledge of system design and distributed systems
- Experience with agile methodologies (Scrum, Kanban)
- Contributions to open source projects
- Experience mentoring junior developers`;

const stackVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export function SemanticMatcher({
  scrollRef,
}: {
  scrollRef: RefObject<HTMLElement>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const resumeText = useResumeStore((s) => s.resumeText);
  const jobDescription = useResumeStore((s) => s.jobDescription);
  const setJobDescription = useResumeStore((s) => s.setJobDescription);
  const highlightedKeyword = useResumeStore((s) => s.highlightedKeyword);
  const setHighlightedKeyword = useResumeStore((s) => s.setHighlightedKeyword);

  const { matchResult, status } = useMatchEngine();
  const inView = useInView(sectionRef, { amount: 0.15 });

  // ── Single IntersectionObserver: left cards → highlighted keyword ──
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !matchResult?.resumeHighlights.length) return;
    const els = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const kw = (e.target as HTMLElement).dataset.keyword;
            if (kw) setHighlightedKeyword(kw);
          }
        }
      },
      { root, threshold: 0.4 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [matchResult, scrollRef, setHighlightedKeyword]);

  const pills: { label: string; kind: PillKind }[] = matchResult
    ? [
        ...matchResult.matched.map((l) => ({ label: l, kind: "matched" as const })),
        ...matchResult.partial.map((l) => ({ label: l, kind: "partial" as const })),
        ...matchResult.missing.map((l) => ({ label: l, kind: "missing" as const })),
      ]
    : [];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full px-6 py-20"
    >
      <header className="mb-10 text-center">
        <span className="terminal text-bio-green">MODULE 03 · SEMANTIC MATCHER</span>
        <h2 className="mt-2 font-display text-3xl text-void-text">
          Résumé ↔ Job Description
        </h2>
      </header>

      {!resumeText ? (
        <div className="glass mx-auto max-w-md rounded-2xl px-10 py-16 text-center">
          <p className="font-body text-sm text-void-muted">
            Upload a résumé above, then paste a job description here to see your
            keyword alignment.
          </p>
        </div>
      ) : (
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2">
          {/* divider */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-bio-green/25 md:block" />

          {/* LEFT — résumé highlights */}
          <div className="md:pr-10">
            <div className="terminal mb-4 text-void-muted">RÉSUMÉ HIGHLIGHTS</div>
            {matchResult?.resumeHighlights.length ? (
              <motion.div
                variants={stackVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                className="space-y-4"
              >
                {matchResult.resumeHighlights.map((h, i) => (
                  <ResumeHighlightCard
                    key={i}
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    highlight={h}
                    active={
                      !!highlightedKeyword &&
                      h.linkedKeywords[0]?.toLowerCase() ===
                        highlightedKeyword.toLowerCase()
                    }
                  />
                ))}
              </motion.div>
            ) : (
              <p className="font-body text-sm text-void-muted">
                Paste a job description on the right to surface the résumé lines
                that matter most for the role.
              </p>
            )}
          </div>

          {/* RIGHT — JD input + pills (sticky) */}
          <div className="mt-10 md:mt-0 md:pl-10">
            <div className="space-y-5 md:sticky md:top-24">
              <div>
                <div className="terminal mb-2 flex items-center gap-2 text-void-muted">
                  <span>JOB DESCRIPTION</span>
                  {!jobDescription && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-bio-green/25 bg-bio-green/5 px-2 py-0.5 text-[0.65rem] text-bio-green">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-bio-green" />
                      Paste JD here
                    </span>
                  )}
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here to compare keywords, find gaps, and see your alignment score…"
                  aria-label="Job description"
                  className="glass h-40 w-full resize-none rounded-xl p-4 font-body text-sm text-void-text outline-none placeholder:text-void-muted focus-visible:ring-2 focus-visible:ring-bio-green/50"
                />
                {!jobDescription && (
                  <button
                    type="button"
                    onClick={() => setJobDescription(SAMPLE_JD)}
                    className="mt-2 rounded-lg border border-bio-green/20 bg-bio-green/5 px-3 py-1.5 font-body text-xs text-bio-green transition-colors hover:bg-bio-green/10"
                  >
                    Try Sample JD →
                  </button>
                )}
              </div>

              {status === "scoring" && (
                <div className="flex items-center gap-3 text-void-muted">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-bio-green/30 border-t-bio-green" />
                  <span className="font-body text-sm">Matching…</span>
                </div>
              )}

              {matchResult && (
                <>
                  <div className="flex items-center justify-between rounded-xl border border-bio-green/20 px-4 py-3">
                    <span className="terminal text-void-muted">SEMANTIC MATCH</span>
                    <span className="font-display text-2xl text-bio-green">
                      {matchResult.semanticScore}
                      <span className="text-sm text-void-muted">%</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence mode="popLayout">
                      {pills.map((p, i) => (
                        <KeywordPill
                          key={`${p.kind}:${p.label}`}
                          label={p.label}
                          kind={p.kind}
                          index={i}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-4 font-body text-xs text-void-muted">
                    <span>
                      <span className="text-bio-green">{matchResult.matched.length}</span>{" "}
                      matched
                    </span>
                    <span>
                      <span className="text-warn-amber">{matchResult.partial.length}</span>{" "}
                      partial
                    </span>
                    <span>
                      <span className="text-danger-red">{matchResult.missing.length}</span>{" "}
                      missing
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
