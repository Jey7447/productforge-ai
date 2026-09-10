import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProductForge — Find the gap. Build the product.",
  description: "Research-backed digital product opportunity discovery, validation, product building and launch guidance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
