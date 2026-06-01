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
  
  // Pages that manage their own layout (they render inside the main content area with pr-[280px])
  // The Sidebar from ConditionalShell will still render for all non-excluded paths
  const hideChrome = isARRoute || isLandingPage;

  return (
    <>
      {!hideChrome && <Sidebar />}
      {!hideChrome && <Header />}
      {children}
    </>
  );
}
