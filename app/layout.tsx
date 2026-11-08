import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AVATAR — The Collection",
  description: "Experience the world of Pandora. James Cameron's Avatar — a cinematic scroll journey.",
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
