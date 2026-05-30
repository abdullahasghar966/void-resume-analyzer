import { motion } from "framer-motion";
import { charVariants, terminalLineVariants } from "./dropZoneVariants";

/** One printed line — animates its own characters on mount (0.04s stagger). */
function TerminalLine({ text }: { text: string }) {
  return (
    <motion.div
      className="flex flex-wrap text-bio-green/90"
      variants={terminalLineVariants}
      initial="hidden"
      animate="visible"
    >
      {text.split("").map((ch, j) => (
        <motion.span key={j} variants={charVariants}>
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </motion.div>
  );
}

/**
 * Append-only terminal. Because each line self-animates on mount, adding a new
 * line never restarts the stagger on lines already printed. aria-live keeps
 * screen readers in step with the parse progress.
 */
export function TerminalLog({ lines }: { lines: string[] }) {
  return (
    <div className="terminal mt-6 space-y-1 text-left" aria-live="polite">
      {lines.map((line, i) => (
        <TerminalLine key={i} text={line} />
      ))}
    </div>
  );
}
