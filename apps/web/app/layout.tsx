import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Netrunner MVP 0.1",
  description: "Private Netrunner MVP 0.1 demo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
