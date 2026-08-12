import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Soteria Calculator",
  description:
    "Soteria's internal estimation and pricing tool — scope to cost to price, transparently.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-soteria-bg text-white antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
