'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

/**
 * ConditionalShell renders the navigation chrome (Sidebar + Header)
 * only for non-AR routes. This lets mobile users visiting /ar/[sceneId]
 * see a completely clean full-screen model-viewer without any overlapping
 * navigation elements.
 */
export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isARRoute = pathname?.startsWith('/ar');
  const isLandingPage = pathname === '/';
  // Public marketing pages ship their own dark chrome and must not inherit the
  // light app sidebar/header.
  const isMarketingPage = pathname === '/privacy';
  // The studio owns its full viewport: header, conversation column and scene
  // drawer are all studio-local. The global chrome does not fit around it —
  // the shared Header pins itself to `right-[280px]` while the studio sidebar
  // floats at `right-4`, which is what clipped the header's right edge.
  const isStudioPage = pathname === '/studio';

  // Pages that manage their own layout (they render inside the main content area with pr-[280px])
  // The Sidebar from ConditionalShell will still render for all non-excluded paths
  const hideChrome = isARRoute || isLandingPage || isMarketingPage || isStudioPage;

  return (
    <>
      {!hideChrome && <Sidebar />}
      {!hideChrome && <Header />}
      {children}
    </>
  );
}
