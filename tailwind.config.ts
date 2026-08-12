import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        soteria: {
          ink: "#0f172a",
          slate: "#334155",
          line: "#e2e8f0",
          accent: "#0f766e",
          accentSoft: "#ecfdf5",
          warn: "#b45309",
          warnSoft: "#fffbeb",
        },
      },
    },
  },
  plugins: [],
};

export default config;
