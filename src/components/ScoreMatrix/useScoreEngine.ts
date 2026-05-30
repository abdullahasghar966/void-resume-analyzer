import { useEffect, useRef } from "react";
import { useResumeStore } from "@/store/resumeStore";
import { useToastStore } from "@/store/toastStore";
import { scoreResume } from "@/api/scoreClient";

/**
 * Fires scoring whenever the resume (or the job description) changes and the
 * parse is complete. Guards against duplicate calls with a content key, and
 * cancels stale in-flight requests so a fast re-upload can't overwrite a newer
 * score with an older response.
 */
export function useScoreEngine() {
  const resumeText = useResumeStore((s) => s.resumeText);
  const jobDescription = useResumeStore((s) => s.jobDescription);
  const parseStatus = useResumeStore((s) => s.parseStatus);
  const scores = useResumeStore((s) => s.scores);
  const scoreStatus = useResumeStore((s) => s.scoreStatus);
  const setScores = useResumeStore((s) => s.setScores);
  const setScoreStatus = useResumeStore((s) => s.setScoreStatus);
  const pushToast = useToastStore((s) => s.push);

  const lastKey = useRef("");

  useEffect(() => {
    if (parseStatus !== "done" || !resumeText) return;

    const key = `${resumeText.length}:${resumeText.slice(0, 64)}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    let cancelled = false;
    setScoreStatus("scoring");

    scoreResume(resumeText, jobDescription)
      .then((result) => {
        if (!cancelled) setScores(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setScoreStatus("error");
        pushToast({
          variant: "error",
          title: "Scoring failed",
          message:
            err instanceof Error ? err.message : "Could not score the résumé.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    resumeText,
    parseStatus,
    setScores,
    setScoreStatus,
    pushToast,
    jobDescription,
  ]);

  return { scores, status: scoreStatus };
}
