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
  fallback: ["system-ui", "sans-serif"],
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500"],
  variable: "--font-plex-arabic",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

/**
 * Offline-resilient fallback rules for Material Symbols Outlined:
 * keeps icon spans constrained to glyph bounds so blocked/offline Google Fonts
 * never expand buttons horizontally with raw ligature strings.
 */
const MATERIAL_SYMBOLS_FALLBACK_CSS = `
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined', system-ui, sans-serif;
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  vertical-align: middle;
  max-width: 1.5em;
  overflow: hidden;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  flex-shrink: 0;
  font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}
`;

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
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <style>{MATERIAL_SYMBOLS_FALLBACK_CSS}</style>
      </head>
      <body className="bg-surface text-on-surface overflow-x-hidden min-h-screen">
        <ClerkProvider localization={arSA}>
          <ConditionalShell>{children}</ConditionalShell>
        </ClerkProvider>
      </body>
    </html>
  );
}
