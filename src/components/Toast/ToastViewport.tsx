import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "@/store/toastStore";
import type { Toast, ToastVariant } from "@/types";

const ACCENT: Record<ToastVariant, string> = {
  success: "#00FFB2",
  error: "#FF4757",
  warning: "#FFD32A",
  info: "#7B61FF",
};

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const duration = toast.duration ?? 4000;
  const accent = ACCENT[toast.variant];

  // Self-dismiss after `duration`. Re-runs only if the toast identity changes.
  useEffect(() => {
    const t = window.setTimeout(() => dismiss(toast.id), duration);
    return () => window.clearTimeout(t);
  }, [toast.id, duration, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
        // brief spec: slide in from right, stiffness 400 / damping 28
        transition: { type: "spring", stiffness: 400, damping: 28 },
      }}
      exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.18 } }}
      className="glass relative w-80 overflow-hidden rounded-xl px-4 py-3"
      style={{ borderLeft: `2px solid ${accent}` }}
      role="status"
      aria-live="polite"
    >
      <div className="font-display text-sm" style={{ color: accent }}>
        {toast.title}
      </div>
      {toast.message && (
        <div className="mt-1 break-words font-body text-xs text-void-muted">
          {toast.message}
        </div>
      )}

      {/* progress bar — scaleX (compositor), never width (layout). */}
      <motion.div
        aria-hidden
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left"
        style={{ background: accent }}
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: "linear" }}
      />

      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="absolute right-2 top-1.5 text-base leading-none text-void-muted transition-colors hover:text-void-text"
      >
        ×
      </button>
    </motion.div>
  );
}

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
