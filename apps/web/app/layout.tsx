import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NETGRID",
  description: "Private NETGRID Spieloberfläche",
  icons: {
    icon: "/brand/netgrid.ico",
    shortcut: "/brand/netgrid.ico"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
