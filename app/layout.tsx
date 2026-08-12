import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Soteria Calculator",
  description:
    "Soteria's internal estimation and pricing tool — scope to cost to price, transparently.",
};

// Applies the saved (or system) theme before first paint, so switching
// between light and dark doesn't flash the wrong theme on load. Kept as a
// tiny inline script rather than a dependency (e.g. next-themes) — this
// app has exactly one thing to decide (light vs dark) and no other reason
// to run client code before hydration.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("soteria-theme");
    var dark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-soteria-bg text-soteria-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
