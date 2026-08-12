"use client";

import { useEffect, useState } from "react";

/**
 * Toggles `.dark` on <html> and persists the choice. The initial value is
 * applied synchronously before paint by the inline script in
 * app/layout.tsx — this component only needs to read that already-applied
 * state on mount and handle clicks from then on.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("soteria-theme", next ? "dark" : "light");
    } catch {
      // Storage unavailable (private mode, etc.) — theme just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="chip h-7 w-7 shrink-0 justify-center border-soteria-border p-0 transition-colors hover:border-soteria-borderStrong hover:bg-soteria-hoverWash print:hidden"
    >
      {/* Reserve space for both icons so toggling never reflows the button;
          only one is ever visible, chosen once isDark resolves post-mount. */}
      {isDark === null ? null : isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 2.5v1.5" />
        <path d="M10 16v1.5" />
        <path d="M17.5 10H16" />
        <path d="M4 10H2.5" />
        <path d="M15.36 4.64l-1.06 1.06" />
        <path d="M5.7 14.3l-1.06 1.06" />
        <path d="M15.36 15.36l-1.06-1.06" />
        <path d="M5.7 5.7L4.64 4.64" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M17 11.5A7 7 0 118.5 3a5.5 5.5 0 008.5 8.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
