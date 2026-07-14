import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoreLab OS",
  description: "AI business development operating system for StoreLab.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/pursuit-runtime.js" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
