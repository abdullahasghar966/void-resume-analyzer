import { useCallback, useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/store/resumeStore";
import { useToastStore } from "@/store/toastStore";
import { parseResume } from "@/api/parseClient";
import type { DropPhase, TerminalStep } from "./dropzone.types";

const ACCEPTED_EXT = ["pdf", "docx", "txt"];
const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);
const MAX_BYTES = 5 * 1024 * 1024;

// Choreography from the brief (ms offsets within the dropping phase).
const TERMINAL_SCHEDULE: TerminalStep[] = [
  { at: 600, text: "[PARSING TOKENS...]" },
  { at: 2000, text: "[EXTRACTING SEMANTIC LAYERS...]" },
  { at: 2400, text: "[BUILDING VECTOR INDEX...]" },
];
const MIN_CHOREO_MS = 2800; // hold success until the animation can finish

/**
 * Owns the entire drop→parse lifecycle: client validation, the timed terminal
 * choreography, the network request (in parallel), and reconciliation of the
 * two so a fast network never truncates the animation and a slow one never
 * lies about being done. All timers + the request are cancellable, which is
 * what makes the rapid re-drop edge case safe.
 */
export function useFileParser() {
  const [phase, setPhase] = useState<DropPhase>("idle");
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  const setResume = useResumeStore((s) => s.setResume);
  const setParseStatus = useResumeStore((s) => s.setParseStatus);
  const pushToast = useToastStore((s) => s.push);

  // Imperative handles that must survive across renders and be cancellable.
  const timers = useRef<number[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const startedAt = useRef(0);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const hardReset = useCallback(() => {
    clearTimers();
    abortRef.current?.abort();
    abortRef.current = null;
    setTerminalLines([]);
  }, [clearTimers]);

  // Cancel everything if the component unmounts mid-flight.
  useEffect(() => () => hardReset(), [hardReset]);

  const validate = useCallback((file: File): string | null => {
    const ext = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase();
    const okType = ACCEPTED_MIME.has(file.type) || ACCEPTED_EXT.includes(ext);
    if (!okType) return "Unsupported file type. Use PDF, DOCX, or TXT.";
    if (file.size === 0) return "That file is empty.";
    if (file.size > MAX_BYTES) return "File exceeds the 5 MB limit.";
    return null;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      // Rapid re-drop guard: kill any in-flight choreography + request first.
      hardReset();

      const validationError = validate(file);
      if (validationError) {
        setPhase("error");
        setParseStatus("error");
        pushToast({
          variant: "error",
          title: "Upload rejected",
          message: validationError,
        });
        const t = window.setTimeout(() => setPhase("idle"), 1600);
        timers.current.push(t);
        return;
      }

      setPhase("dropping");
      setParseStatus("parsing");
      setTerminalLines([]);
      startedAt.current = performance.now();

      // Schedule the terminal log lines.
      TERMINAL_SCHEDULE.forEach(({ at, text }) => {
        const t = window.setTimeout(
          () => setTerminalLines((prev) => [...prev, text]),
          at
        );
        timers.current.push(t);
      });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Network runs in parallel with the animation.
        const result = await parseResume(file, controller.signal);

        // Hold success until the choreography minimum elapses, so a fast parse
        // never cuts the scan beam / terminal short.
        const elapsed = performance.now() - startedAt.current;
        const remaining = Math.max(0, MIN_CHOREO_MS - elapsed);
        await new Promise<void>((resolve) => {
          const t = window.setTimeout(resolve, remaining);
          timers.current.push(t);
        });

        if (controller.signal.aborted) return; // superseded by a newer drop

        setResume(result.text, {
          fileName: file.name,
          fileType: result.fileType,
          wordCount: result.wordCount,
          pageCount: result.pageCount,
          tokenEstimate: result.tokenEstimate,
        });
        setPhase("success");
        pushToast({
          variant: "success",
          title: "Resume ingested",
          message: `${result.wordCount.toLocaleString()} words · ~${result.tokenEstimate.toLocaleString()} tokens`,
        });
      } catch (err) {
        // An intentional abort (newer drop / unmount) should stay silent.
        if (controller.signal.aborted) return;
        clearTimers();
        setParseStatus("error");
        setPhase("error");
        const message =
          err instanceof Error
            ? err.message
            : "Parsing failed. Try another file.";
        pushToast({ variant: "error", title: "Parse failed", message });
        const t = window.setTimeout(() => setPhase("idle"), 2200);
        timers.current.push(t);
      }
    },
    [hardReset, validate, clearTimers, setParseStatus, setResume, pushToast]
  );

  return { phase, terminalLines, handleFile };
}
