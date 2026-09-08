import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProductForge AI",
  description: "Research-backed digital product opportunity discovery.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
