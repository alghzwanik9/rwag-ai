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
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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
