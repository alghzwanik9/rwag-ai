import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import ConditionalShell from "@/components/ConditionalShell";
import { ClerkProvider } from '@clerk/nextjs';
import { arSA } from '@clerk/localizations';

// Landing typography: Kufi for headings, Plex Sans Arabic for body,
// Plex Mono for every numeral/measurement/Latin label.
const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["700", "800"],
  variable: "--font-kufi",
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500"],
  variable: "--font-plex-arabic",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "رواق - Rwaq AI",
  description: "AI-driven interior design assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${kufi.variable} ${plexArabic.variable} ${plexMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-surface overflow-x-hidden min-h-screen">
        <ClerkProvider localization={arSA}>
          <ConditionalShell>{children}</ConditionalShell>
        </ClerkProvider>
      </body>
    </html>
  );
}
