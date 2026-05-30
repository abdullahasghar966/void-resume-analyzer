/**
 * Three-dot "thinking" pulse shown until the first token arrives. Pure CSS
 * keyframes (scale + opacity), staggered 0.2s apart — compositor-only.
 */
export function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1" aria-label="Coach is thinking">
      {[0, 0.2, 0.4].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-thinking-dot rounded-full bg-indigo-pulse"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}
