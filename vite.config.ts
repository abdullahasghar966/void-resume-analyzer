import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Single-origin dev: the browser only ever calls /api/* and Vite proxies it to
// the Express backend on :8787 — no CORS preflight friction during development.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Pre-bundle deps in ONE pass on startup so Vite doesn't discover the
  // lazy-loaded Recharts chunk mid-session, re-optimize, and force-reload
  // (which used to 504 in-flight dynamic imports).
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "framer-motion", "zustand", "recharts"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2020",
    sourcemap: true,
  },
});
