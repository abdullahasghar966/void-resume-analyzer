import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useResumeStore } from "@/store/resumeStore";
import { useChat } from "./useChat";
import { ThinkingDots } from "./ThinkingDots";
import { CHAT_MACROS } from "./chatMacros";
import type { ChatMessage } from "@/types";

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 font-body text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-pulse/20 text-void-text"
            : "glass text-void-text"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export function Chatbot() {
  const reduce = useReducedMotion();
  const open = useResumeStore((s) => s.chatOpen);
  const setOpen = useResumeStore((s) => s.setChatOpen);
  const resumeText = useResumeStore((s) => s.resumeText);

  const { messages, streaming, thinking, send } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the transcript pinned to the latest token (transform-free: scrollTop).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const submit = () => {
    const text = input;
    setInput("");
    void send(text);
  };

  // Animating width/height/borderRadius here is deliberate and safe: the panel
  // is position:fixed (out of normal flow), so its resize never reflows the
  // page — only its own subtree. Spring values per the brief.
  const sizeTransition = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 32, mass: 1.1 };

  const visibleMessages = messages.filter((m) => m.content !== "");

  return (
    <motion.div
      className="glass-deep fixed bottom-6 right-6 z-50 overflow-hidden shadow-2xl"
      initial={false}
      animate={
        open
          ? { width: 420, height: 560, borderRadius: "20px 20px 8px 20px" }
          : { width: 72, height: 72, borderRadius: "50%" }
      }
      transition={sizeTransition}
      style={{ maxWidth: "calc(100vw - 2rem)", maxHeight: "calc(100dvh - 2rem)" }}
    >
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: reduce ? 0 : 0.12 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="absolute inset-0 flex flex-col"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-indigo-pulse/15 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-pulse" />
                <span className="font-display text-sm text-void-text">AI Coach</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close coach"
                className="text-void-muted transition-colors hover:text-void-text"
              >
                ✕
              </button>
            </div>

            {/* transcript */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
              aria-live="polite"
            >
              {visibleMessages.length === 0 ? (
                <div className="space-y-4">
                  <p className="font-body text-sm text-void-muted">
                    {resumeText
                      ? "I've analysed your résumé. Ask me anything, or start here:"
                      : "Upload a résumé above and I'll coach you on it. Or ask a general question:"}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {CHAT_MACROS.map((macro) => (
                      <motion.button
                        key={macro}
                        type="button"
                        onClick={() => void send(macro)}
                        whileHover={{
                          scale: 1.08,
                          transition: { type: "spring", stiffness: 400, damping: 10 },
                        }}
                        whileTap={{ scale: 0.96 }}
                        className="rounded-xl border border-indigo-pulse/25 bg-indigo-pulse/5 px-3 py-2 text-left font-body text-xs text-void-text"
                      >
                        {macro}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                visibleMessages.map((m) => <Bubble key={m.id} message={m} />)
              )}

              {thinking && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl">
                    <ThinkingDots />
                  </div>
                </div>
              )}
            </div>

            {/* composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="flex items-center gap-2 border-t border-indigo-pulse/15 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  resumeText ? "Ask about your résumé…" : "Ask the coach…"
                }
                aria-label="Message the coach"
                className="flex-1 rounded-full bg-void-mid px-4 py-2 font-body text-sm text-void-text outline-none placeholder:text-void-muted focus-visible:ring-2 focus-visible:ring-indigo-pulse/50"
              />
              <motion.button
                type="submit"
                disabled={streaming || !input.trim()}
                whileTap={{ scale: 0.92 }}
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-pulse text-void-base disabled:opacity-40"
              >
                ↑
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <motion.button
            key="pill"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            onClick={() => setOpen(true)}
            aria-label="Open AI Coach"
            className="absolute inset-0 flex items-center justify-center"
          >
            <span
              aria-hidden
              className="absolute inset-0 animate-radial-wave rounded-full border border-indigo-pulse/40"
            />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3C7 3 3 6.6 3 11c0 2.3 1.1 4.3 2.9 5.7L5 21l4.4-1.6c.8.2 1.7.3 2.6.3 5 0 9-3.6 9-8s-4-8-9-8Z"
                stroke="#7B61FF"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
