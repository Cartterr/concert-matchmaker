import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concert Matchmaker",
  description: "Match a Spotify artist catalog against nearby concerts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
