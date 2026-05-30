import { create } from "zustand";
import type { Toast } from "@/types";

interface ToastState {
  toasts: Toast[];
  /** Enqueue a toast and return its generated id (for manual dismissal). */
  push: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
