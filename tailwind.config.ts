import type { Config } from "tailwindcss";

// Colour *names* are Soteria's brand kit (logo + colour references) from
// Bloom: teal, navy, gold, charcoal. Actual values are CSS custom
// properties (app/globals.css) so every one of these tokens resolves
// differently under the light theme (:root) vs the dark theme (.dark) —
// components never need a `dark:` prefix, the token itself adapts.
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        soteria: {
          bg: "rgb(var(--soteria-bg) / <alpha-value>)",
          surface: "rgb(var(--soteria-surface) / <alpha-value>)",
          surfaceHover: "rgb(var(--soteria-surfaceHover) / <alpha-value>)",
          border: "var(--soteria-border)",
          borderStrong: "var(--soteria-borderStrong)",
          hoverWash: "var(--soteria-hoverWash)",
          ink: "rgb(var(--soteria-ink) / <alpha-value>)",
          body: "rgb(var(--soteria-body) / <alpha-value>)",
          muted: "rgb(var(--soteria-muted) / <alpha-value>)",
          faint: "rgb(var(--soteria-faint) / <alpha-value>)",
          navy: "rgb(var(--soteria-navy) / <alpha-value>)",
          navyLight: "rgb(var(--soteria-navyLight) / <alpha-value>)",
          navySoft: "var(--soteria-navySoft)",
          teal: "rgb(var(--soteria-teal) / <alpha-value>)",
          tealLight: "rgb(var(--soteria-tealLight) / <alpha-value>)",
          tealSoft: "var(--soteria-tealSoft)",
          gold: "rgb(var(--soteria-gold) / <alpha-value>)",
          goldLight: "rgb(var(--soteria-goldLight) / <alpha-value>)",
          goldSoft: "var(--soteria-goldSoft)",
          warn: "rgb(var(--soteria-warn) / <alpha-value>)",
          warnSoft: "var(--soteria-warnSoft)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
