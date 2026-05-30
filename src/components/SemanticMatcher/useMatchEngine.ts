import { useEffect, useRef } from "react";
import { useResumeStore } from "@/store/resumeStore";
import { useToastStore } from "@/store/toastStore";
import { matchResume } from "@/api/matchClient";

const DEBOUNCE_MS = 650; // wait for the user to stop typing the JD

/**
 * Runs the semantic match whenever both a résumé and a job description exist.
 * JD edits are debounced so we don't fire a request per keystroke, and stale
 * requests are cancelled so the latest JD always wins.
 */
export function useMatchEngine() {
  const resumeText = useResumeStore((s) => s.resumeText);
  const jobDescription = useResumeStore((s) => s.jobDescription);
  const matchResult = useResumeStore((s) => s.matchResult);
  const matchStatus = useResumeStore((s) => s.matchStatus);
  const setMatchResult = useResumeStore((s) => s.setMatchResult);
  const setMatchStatus = useResumeStore((s) => s.setMatchStatus);
  const pushToast = useToastStore((s) => s.push);

  const lastKey = useRef("");

  useEffect(() => {
    const jd = jobDescription.trim();
    if (!resumeText || jd.length < 12) return; // need a real JD to match against

    const key = `${resumeText.length}::${jd}`;
    if (lastKey.current === key) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      lastKey.current = key;
      setMatchStatus("scoring");
      matchResume(resumeText, jd)
        .then((result) => {
          if (!cancelled) setMatchResult(result);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setMatchStatus("error");
          pushToast({
            variant: "error",
            title: "Match failed",
            message:
              err instanceof Error ? err.message : "Could not run the match.",
          });
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [resumeText, jobDescription, setMatchResult, setMatchStatus, pushToast]);

  return { matchResult, status: matchStatus };
}
