import type { Metadata } from "next";
import "./globals.css";
import ConditionalShell from "@/components/ConditionalShell";
import { ClerkProvider } from '@clerk/nextjs';
import { arSA } from '@clerk/localizations';

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
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        {/* Tajawal carries Arabic display/body; Outfit and Inter carry the
            Latin technical labels on the landing page. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&family=Outfit:wght@300..700&family=Inter:wght@400..600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface overflow-x-hidden min-h-screen">
        <ClerkProvider localization={arSA}>
          <ConditionalShell>{children}</ConditionalShell>
        </ClerkProvider>
      </body>
    </html>
  );
}
