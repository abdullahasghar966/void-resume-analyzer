import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SPLASH_DURATION = 3400;

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), SPLASH_DURATION);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-void-base"
        >
          {/* Animated glow rings */}
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute h-48 w-48 rounded-full border border-bio-green/20"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.2, 1], opacity: [0, 0.6, 0.2] }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
            <motion.div
              className="absolute h-64 w-64 rounded-full border border-bio-green/10"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.3, 1.1], opacity: [0, 0.4, 0.1] }}
              transition={{ duration: 2.4, delay: 0.2, ease: "easeOut" }}
            />
            <motion.div
              className="absolute h-80 w-80 rounded-full border border-indigo-pulse/10"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.4, 1.2], opacity: [0, 0.3, 0.05] }}
              transition={{ duration: 2.8, delay: 0.4, ease: "easeOut" }}
            />

            {/* Central glow */}
            <motion.div
              className="absolute h-32 w-32 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,255,178,0.15) 0%, rgba(0,255,178,0.03) 50%, transparent 70%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 0.6] }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            />

            {/* Logo mark — stylized V */}
            <motion.svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.path
                d="M20 18 L40 62 L60 18"
                stroke="#00FFB2"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
              />
              <motion.circle
                cx="40"
                cy="62"
                r="3"
                fill="#00FFB2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: [0, 1, 0.7] }}
                transition={{ duration: 0.6, delay: 1.5 }}
              />
              <motion.path
                d="M28 38 L52 38"
                stroke="#7B61FF"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 0.8, delay: 1.2 }}
              />
            </motion.svg>
          </div>

          {/* Title */}
          <motion.div
            className="mt-10 text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          >
            <h1 className="font-display text-2xl tracking-widest text-bio-green text-glow-bio">
              VOID
            </h1>
            <motion.p
              className="mt-2 font-mono text-xs tracking-[0.2em] text-void-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.4 }}
            >
              RESUME INTELLIGENCE TERMINAL
            </motion.p>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            className="mt-8 h-[2px] w-48 overflow-hidden rounded-full bg-void-mid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-bio-green/80 to-indigo-pulse/60"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: SPLASH_DURATION / 1000 - 0.8,
                delay: 0.6,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Floating particles */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-bio-green/40"
              style={{
                left: `${20 + i * 12}%`,
                top: `${30 + (i % 3) * 15}%`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: [0, 0.6, 0],
                y: [20, -30, -50],
              }}
              transition={{
                duration: 2.5,
                delay: 0.5 + i * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
