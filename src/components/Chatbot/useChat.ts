import { useCallback, useRef, useState } from "react";
import { useResumeStore } from "@/store/resumeStore";
import { streamChat, type ChatContext } from "@/api/chatClient";
import type { ChatMessage } from "@/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m_${Date.now()}_${Math.random().toString(36).slice(2)}`;

/**
 * Owns the conversation. Each send appends a user message + an empty assistant
 * message, flips to "thinking" until the first token, then streams tokens into
 * that assistant message. The request is abortable (new send / unmount), and
 * context (résumé, JD, scores, missing keywords) is pulled fresh from the store
 * so the coach always reasons about the latest analysis.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [thinking, setThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg: ChatMessage = { id: uid(), role: "user", content };
      const assistantId = uid();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      // Snapshot history (excluding the empty placeholder) for the API.
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setThinking(true);
      setStreaming(true);

      // Pull the latest analysis straight from the store.
      const st = useResumeStore.getState();
      const context: ChatContext = {
        resumeText: st.resumeText,
        jobDescription: st.jobDescription,
        scores: st.scores,
        missingKeywords: st.matchResult?.missing ?? [],
      };

      try {
        await streamChat(
          { messages: history, context },
          (token) => {
            setThinking(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + token } : m
              )
            );
          },
          controller.signal
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        const msg =
          err instanceof Error ? err.message : "The coach is unavailable.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content || `⚠ ${msg}` }
              : m
          )
        );
      } finally {
        if (!controller.signal.aborted) {
          setThinking(false);
          setStreaming(false);
        }
      }
    },
    [messages, streaming]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
    setThinking(false);
  }, []);

  return { messages, streaming, thinking, send, reset };
}
