import { useCallback, useRef, useState } from "react";
import type {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  PointerEvent,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useResumeStore } from "@/store/resumeStore";
import { useFileParser } from "./useFileParser";
import { ScanBeam } from "./ScanBeam";
import { ParticleBurst } from "./ParticleBurst";
import { TerminalLog } from "./TerminalLog";
import { cardDropVariants } from "./dropZoneVariants";
import type { DropPhase } from "./dropzone.types";

// Tilt spring (brief: stiffness 280 / damping 28 / mass 0.6). Soft, weighty.
const TILT_SPRING = { stiffness: 280, damping: 28, mass: 0.6 };

export function DropZone() {
  const reduce = useReducedMotion();
  const { phase, terminalLines, handleFile } = useFileParser();
  const fileName = useResumeStore((s) => s.fileName);
  const wordCount = useResumeStore((s) => s.wordCount);
  const pageCount = useResumeStore((s) => s.pageCount);
  const tokenEstimate = useResumeStore((s) => s.tokenEstimate);

  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [hovered, setHovered] = useState(false);

  // ── 3D mouse parallax ──────────────────────────────────────────────
  // Pointer position normalised to [-0.5, 0.5] across the card, stored as
  // MotionValues so pointer moves never trigger React re-renders.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // rotateX driven by vertical pointer, rotateY by horizontal (inverted) —
  // ranges from the brief. Spring-smoothed so it eases rather than snaps.
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [12, -12]),
    TILT_SPRING
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-12, 12]),
    TILT_SPRING
  );

  // Three depth layers read the SAME pointer at different multipliers
  // (0.4× / 0.8× / 1.4×) → genuine parallax separation. The differential
  // translation reads as depth even where overflow-hidden flattens translateZ.
  const bgX = useTransform(mouseX, (v) => v * 0.4 * 20);
  const bgY = useTransform(mouseY, (v) => v * 0.4 * 20);
  const fgX = useTransform(mouseX, (v) => v * 1.4 * 24);
  const fgY = useTransform(mouseY, (v) => v * 1.4 * 24);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (reduce) return;
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
      mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [mouseX, mouseY, reduce]
  );

  const onPointerLeave = useCallback(() => {
    // Spring back to rest when the pointer leaves the deck.
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  }, [mouseX, mouseY]);

  // ── drag & drop / file selection ───────────────────────────────────
  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
      e.target.value = ""; // allow re-selecting the same filename
    },
    [handleFile]
  );

  const openDialog = useCallback(() => inputRef.current?.click(), []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDialog();
      }
    },
    [openDialog]
  );

  const isBusy = phase === "dropping";
  const isSuccess = phase === "success";
  const isError = phase === "error";
  const isIdle = phase === "idle" || phase === "dragover";

  // Border brightens on hover / drag-over, locks solid on success (brief).
  const borderColor = dragOver
    ? "rgba(0,255,178,0.35)"
    : isSuccess
      ? "rgba(0,255,178,0.6)"
      : isError
        ? "rgba(255,71,87,0.4)"
        : hovered
          ? "rgba(0,255,178,0.35)"
          : "rgba(0,255,178,0.08)";

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center px-6">
      {/* Hidden, keyboard-reachable via the card's role=button. */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="sr-only"
        onChange={onInputChange}
        tabIndex={-1}
      />

      {/* OUTER WRAPPER — owns the mouse-tilt transform + hover group. */}
      <motion.div
        className="group preserve-3d relative"
        style={{ rotateX: reduce ? 0 : rotateX, rotateY: reduce ? 0 : rotateY }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerEnter={() => setHovered(true)}
      >
        {/* Hover aura — pseudo-ring behind the card. opacity+scale keyframes
            (radial-wave), never a box-shadow loop. Active on hover/drag/busy. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute -inset-6 rounded-[30px] opacity-0 ${
            reduce ? "" : "group-hover:animate-radial-wave"
          } ${(dragOver || isBusy) && !reduce ? "animate-radial-wave" : ""}`}
          style={{
            background:
              "radial-gradient(circle, rgba(0,255,178,0.18), transparent 60%)",
          }}
        />

        {/* INNER CARD — owns flip / success transform + drag handlers. */}
        <motion.div
          ref={cardRef}
          role="button"
          tabIndex={0}
          aria-label="Upload your resume — PDF, DOCX or TXT, up to 5 megabytes. Press Enter to browse files."
          onClick={openDialog}
          onKeyDown={onKeyDown}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          variants={cardDropVariants}
          animate={isSuccess ? "success" : isBusy ? "dropping" : "idle"}
          className="glass preserve-3d relative flex h-[420px] w-[min(90vw,560px)] cursor-none flex-col items-center justify-center overflow-hidden rounded-[24px] px-10 text-center outline-none focus-visible:ring-2 focus-visible:ring-bio-green/60"
          style={{ borderColor, transition: "border-color 220ms ease" }}
        >
          {/* Depth layer 1 — background wash (0.4× parallax). */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              x: reduce ? 0 : bgX,
              y: reduce ? 0 : bgY,
              background:
                "radial-gradient(120% 120% at 50% 0%, rgba(123,97,255,0.10), transparent 60%)",
            }}
          />

          {/* Scan beam + particle burst only while parsing. */}
          {isBusy && !reduce && <ScanBeam />}
          {isBusy && !reduce && <ParticleBurst />}

          {/* Depth layer 2 — card body (0.8× implied via foreground delta). */}
          <div className="preserve-3d relative flex flex-col items-center">
            {/* Depth layer 3 — foreground glyph (1.4× parallax). */}
            <motion.div
              className="mb-5"
              style={{ x: reduce ? 0 : fgX, y: reduce ? 0 : fgY }}
            >
              <UploadGlyph state={phase} />
            </motion.div>

            {isIdle && (
              <>
                <h1 className="font-display text-2xl text-void-text">
                  Drop your resume into the void
                </h1>
                <p className="mt-2 max-w-sm font-body text-sm text-void-muted">
                  PDF · DOCX · TXT — up to 5MB. The terminal will parse,
                  vectorise and score it.
                </p>
                <span className="mt-6 rounded-full border border-bio-green/30 px-4 py-1.5 text-xs uppercase tracking-widest text-bio-green">
                  Browse files
                </span>
              </>
            )}

            {isBusy && <TerminalLog lines={terminalLines} />}

            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="terminal text-bio-green">[INGEST COMPLETE]</div>
                {fileName && (
                  <div className="max-w-[16rem] truncate font-body text-xs text-void-muted">
                    {fileName}
                  </div>
                )}
                <div className="flex gap-6">
                  <Stat label="WORDS" value={wordCount.toLocaleString()} />
                  <Stat label="PAGES" value={String(pageCount)} />
                  <Stat label="~TOKENS" value={tokenEstimate.toLocaleString()} />
                </div>
                <div className="terminal text-xs text-void-muted">
                  scroll to view analysis ↓
                </div>
              </motion.div>
            )}

            {isError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="terminal text-danger-red"
              >
                [ERROR] — drop a valid file to retry
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/** Compact parsed-stat readout for the success state. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-xl text-bio-green">{value}</span>
      <span className="terminal text-[10px] tracking-widest text-void-muted">
        {label}
      </span>
    </div>
  );
}

/** State-reactive upload glyph (idle/success → bio-green, error → red). */
function UploadGlyph({ state }: { state: DropPhase }) {
  const color = state === "error" ? "#FF4757" : "#00FFB2";
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
      <circle
        cx="28"
        cy="28"
        r="26"
        stroke={color}
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      <path
        d="M28 37V19m0 0-7 7m7-7 7 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
