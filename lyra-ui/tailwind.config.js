// Single source of truth for every consumer's color token map — see
// tailwind-tokens.cjs's own doc comment for why this is a plain `require`
// of a shared file rather than each project (including this one) keeping
// its own hand-copied object. Tailwind's own config loader already
// tolerates `require` inside this ESM file (see the plugins line below,
// which has always used it for `tailwindcss-animate`).
const lyraColors = require("./tailwind-tokens.cjs");

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/components/__stories__/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      /* ── Lyra Spacing Scale (4px base unit) ── */
      spacing: {
        "lyra-0": "var(--lyra-spacing-0)",
        "lyra-1": "var(--lyra-spacing-1)",
        "lyra-2": "var(--lyra-spacing-2)",
        "lyra-3": "var(--lyra-spacing-3)",
        "lyra-4": "var(--lyra-spacing-4)",
        "lyra-5": "var(--lyra-spacing-5)",
        "lyra-6": "var(--lyra-spacing-6)",
        "lyra-7": "var(--lyra-spacing-7)",
        "lyra-8": "var(--lyra-spacing-8)",
        "lyra-9": "var(--lyra-spacing-9)",
      },
      /* ── Lyra Colors ── */
      // Sourced from tailwind-tokens.cjs (see its own doc comment) — the
      // single object every consumer's tailwind.config.js pulls from,
      // rather than each one (including this file, previously) keeping its
      // own hand-copied list that can silently drift out of sync.
      colors: {
        ...lyraColors,
        "cxone-navy": "#2a2d32",
      },
      /* ── Lyra Border Radius ── */
      borderRadius: {
        "lyra-none":  "var(--lyra-radius-none)",
        "lyra-xs":    "var(--lyra-radius-xs)",
        "lyra-sm":    "var(--lyra-radius-sm)",
        "lyra-md":    "var(--lyra-radius-md)",
        "lyra-lg":    "var(--lyra-radius-lg)",
        "lyra-xl":    "var(--lyra-radius-xl)",
        "lyra-round": "var(--lyra-radius-round)",
      },
      /* ── Font Family ── */
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
