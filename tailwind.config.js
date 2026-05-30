/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          base: "#060A10",
          deep: "#03050A",
          mid: "#0E1520",
          surface: "#141D2E",
          text: "#C8D6E8",
          muted: "#4A5E78",
        },
        bio: {
          green: "#00FFB2",
          "green-dim": "rgba(0,255,178,0.125)",
        },
        indigo: {
          pulse: "#7B61FF",
          dim: "rgba(123,97,255,0.094)",
        },
        danger: { red: "#FF4757" },
        warn: { amber: "#FFD32A" },
      },
      fontFamily: {
        display: ["'Space Mono'", "ui-monospace", "monospace"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      keyframes: {
        breathe: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.004)" },
        },
        "radial-wave": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.12)", opacity: "0" },
        },
        "thinking-dot": {
          "0%,80%,100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        breathe: "breathe 4s ease-in-out infinite",
        "radial-wave": "radial-wave 1.8s ease-out infinite",
        "thinking-dot": "thinking-dot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
