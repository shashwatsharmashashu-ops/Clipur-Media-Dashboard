import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clipur · Media Command",
  description: "Internal output tracker for the Clipur media team.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
