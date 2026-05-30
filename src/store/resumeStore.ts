import { create } from "zustand";
import type {
  AsyncStatus,
  FileMeta,
  MatchResult,
  ScoreResult,
} from "@/types";

/**
 * Single source of truth for the analysis pipeline. Components subscribe to
 * narrow slices (e.g. `useResumeStore(s => s.resumeText)`) so a write to one
 * field never re-renders unrelated subscribers.
 */
interface ResumeState {
  // ── Raw data ──────────────────────────────────────────────────────
  resumeText: string;
  fileName: string;
  fileType: string;
  wordCount: number;
  pageCount: number;
  tokenEstimate: number;
  jobDescription: string;

  // ── Computed ──────────────────────────────────────────────────────
  scores: ScoreResult | null;
  matchResult: MatchResult | null;

  // ── UI / lifecycle ────────────────────────────────────────────────
  parseStatus: AsyncStatus;
  scoreStatus: AsyncStatus;
  matchStatus: AsyncStatus;
  chatOpen: boolean;
  /** Keyword currently highlighted by the matcher's scroll-sync (Module 3). */
  highlightedKeyword: string | null;

  // ── Actions ───────────────────────────────────────────────────────
  setResume: (text: string, meta: FileMeta) => void;
  setJobDescription: (jd: string) => void;
  setScores: (scores: ScoreResult) => void;
  setMatchResult: (result: MatchResult) => void;
  setParseStatus: (s: AsyncStatus) => void;
  setScoreStatus: (s: AsyncStatus) => void;
  setMatchStatus: (s: AsyncStatus) => void;
  setChatOpen: (open: boolean) => void;
  setHighlightedKeyword: (kw: string | null) => void;
  reset: () => void;
}

const initialState = {
  resumeText: "",
  fileName: "",
  fileType: "",
  wordCount: 0,
  pageCount: 0,
  tokenEstimate: 0,
  jobDescription: "",
  scores: null,
  matchResult: null,
  parseStatus: "idle" as AsyncStatus,
  scoreStatus: "idle" as AsyncStatus,
  matchStatus: "idle" as AsyncStatus,
  chatOpen: false,
  highlightedKeyword: null as string | null,
};

export const useResumeStore = create<ResumeState>((set) => ({
  ...initialState,

  setResume: (text, meta) =>
    set((s) => {
      // A genuinely different résumé invalidates any prior analysis, so it
      // never shows stale scores/highlights from the previous file.
      const isNew = text !== s.resumeText;
      return {
        resumeText: text,
        fileName: meta.fileName,
        fileType: meta.fileType,
        wordCount: meta.wordCount,
        pageCount: meta.pageCount,
        tokenEstimate: meta.tokenEstimate,
        parseStatus: "done",
        scores: isNew ? null : s.scores,
        matchResult: isNew ? null : s.matchResult,
        scoreStatus: isNew ? "idle" : s.scoreStatus,
        matchStatus: isNew ? "idle" : s.matchStatus,
        highlightedKeyword: isNew ? null : s.highlightedKeyword,
      };
    }),
  setJobDescription: (jobDescription) => set({ jobDescription }),
  setScores: (scores) => set({ scores, scoreStatus: "done" }),
  setMatchResult: (matchResult) => set({ matchResult, matchStatus: "done" }),
  setParseStatus: (parseStatus) => set({ parseStatus }),
  setScoreStatus: (scoreStatus) => set({ scoreStatus }),
  setMatchStatus: (matchStatus) => set({ matchStatus }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  setHighlightedKeyword: (highlightedKeyword) => set({ highlightedKeyword }),
  reset: () => set({ ...initialState }),
}));
