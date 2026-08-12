import type { Config } from "tailwindcss";

// Palette sourced from Soteria's brand kit (logo + colour references) in
// Bloom. Base hues (bg/navy/teal/gold) are the exact brand values; *Light/
// *Soft variants are computed tints for hover/selected states, not new
// hues — see docs/pricing-model.md's sibling, the brand kit itself, for
// the source images.
const config: Config = {
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
          bg: "#1C1D1E",
          surface: "#242628",
          surfaceHover: "#2C2F31",
          border: "rgba(255,255,255,0.08)",
          borderStrong: "rgba(255,255,255,0.16)",
          ink: "#FFFFFF",
          body: "#C7CDD2",
          muted: "#939CA3",
          faint: "#6B747C",
          navy: "#153A5F",
          navyLight: "#1F5081",
          navySoft: "rgba(21,58,95,0.35)",
          teal: "#0F787A",
          tealLight: "#159C9E",
          tealSoft: "rgba(15,120,122,0.16)",
          gold: "#BC9C62",
          goldLight: "#D4B784",
          goldSoft: "rgba(188,156,98,0.14)",
          warn: "#E2725B",
          warnSoft: "rgba(226,114,91,0.14)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
