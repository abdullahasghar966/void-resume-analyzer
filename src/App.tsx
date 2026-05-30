import { lazy, Suspense, useRef, useState } from "react";
import { CustomCursor } from "@/components/Cursor/CustomCursor";
import { LivingBackground } from "@/components/Background/LivingBackground";
import { DropZone } from "@/components/DropZone/DropZone";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Chatbot } from "@/components/Chatbot/Chatbot";
import { ToastViewport } from "@/components/Toast/ToastViewport";
import { SplashScreen } from "@/components/SplashScreen/SplashScreen";

// Code-split heavy, below-the-fold work out of the initial chunk:
//  · Score Matrix (Recharts, only needed once a résumé exists)
const ScoreMatrix = lazy(() =>
  import("@/components/ScoreMatrix/ScoreMatrix").then((m) => ({
    default: m.ScoreMatrix,
  }))
);
const SemanticMatcher = lazy(() =>
  import("@/components/SemanticMatcher/SemanticMatcher").then((m) => ({
    default: m.SemanticMatcher,
  }))
);

/** Reserves a viewport of height while a lazy section's chunk loads. */
function SectionLoading() {
  return (
    <section className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-bio-green/30 border-t-bio-green" />
    </section>
  );
}

/**
 * App shell — 3 Z-levels:
 *   z-0  WebGL star field (fixed, pointer-events:none, lazy)
 *   z-10 the scroll container holding each module
 *   z-50 chatbot · z-60 toasts (fixed foreground)
 * `scrollRef` is the scroll container; modules pass it to useScroll so their
 * scroll-linked animations track this element, not the window.
 */
export default function App() {
  const scrollRef = useRef<HTMLElement>(null);
  const [splashDone, setSplashDone] = useState(false);

  return (
    <div className="perspective-deck relative h-full w-full overflow-hidden bg-void-base">
      {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
      <LivingBackground />
      <CustomCursor />

      <main
        ref={scrollRef}
        className="preserve-3d relative z-10 h-full w-full overflow-y-auto overflow-x-hidden"
      >
        <DropZone />

        <ErrorBoundary label="ScoreMatrix">
          <Suspense fallback={<SectionLoading />}>
            <ScoreMatrix scrollRef={scrollRef} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary label="SemanticMatcher">
          <Suspense fallback={<SectionLoading />}>
            <SemanticMatcher scrollRef={scrollRef} />
          </Suspense>
        </ErrorBoundary>
      </main>

      <Chatbot />
      <ToastViewport />
    </div>
  );
}
