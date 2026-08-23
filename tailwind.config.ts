import type { Config } from "tailwindcss";

// Color/shadow/radius values are sourced from the CSS custom properties defined in
// app/globals.css (site/lib/theme.ts toggles `data-theme` + a `.dark`/`.light` class on <html>).
// Keeping the source of truth in CSS means both themes update every Tailwind utility that
// references these tokens without duplicating hex values here.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "accent-primary": "var(--accent-primary)",
        "accent-warn": "var(--accent-warn)",
        "accent-error": "var(--accent-error)",
        "accent-success": "var(--accent-success)",
        "syntax-key": "var(--syntax-key)",
        "syntax-string": "var(--syntax-string)",
        "syntax-number": "var(--syntax-number)",
        "syntax-punctuation": "var(--syntax-punctuation)",
      },
      fontFamily: {
        // --font-mono (JetBrains Mono) and --font-mono-fallback (IBM Plex Mono) are both
        // self-hosted via next/font/google in app/layout.tsx, so this is a real fallback chain,
        // not just a hint that relies on the visitor having either font installed locally.
        mono: ["var(--font-mono)", "var(--font-mono-fallback)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        panel: "6px",
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
      },
      spacing: {
        // 8px base spacing scale (§10) layered on Tailwind's default 4px scale.
        18: "4.5rem",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
      },
      transitionTimingFunction: {
        out: "ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
