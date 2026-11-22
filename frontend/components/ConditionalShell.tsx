'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sparkles } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

function getMobileRouteTitle(pathname: string | null): string {
  if (!pathname) return 'رواق';
  if (pathname.startsWith('/projects')) return 'مشاريعي';
  if (pathname.startsWith('/assets')) return 'مكتبة الأصول';
  if (pathname.startsWith('/settings')) return 'إعدادات الحساب';
  if (pathname.startsWith('/team')) return 'إدارة الفريق';
  if (pathname.startsWith('/library')) return 'المعايير المعمارية';
  if (pathname.startsWith('/studio2d')) return 'الاستوديو 2D';
  return 'رواق للتصميم';
}

/**
 * ConditionalShell renders the navigation chrome (Sidebar + Header + Mobile Nav Bar)
 * only for app workspace routes. Public marketing pages, AR routes, and the full-viewport
 * 3D studio own their own chrome.
 */
export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Storing the pathname for which the drawer was opened guarantees it closes
  // immediately upon route navigation without extra effects.
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const mobileMenuOpen = openForPath === pathname;

  const isARRoute = pathname?.startsWith('/ar');
  const isLandingPage = pathname === '/';
  // Public marketing pages ship their own dark chrome and must not inherit the
  // light app sidebar/header.
  const isMarketingPage = pathname === '/privacy' || pathname?.startsWith('/maarad');
  // The studio owns its full viewport: header, conversation column and scene
  // drawer are all studio-local.
  const isStudioPage = pathname === '/studio';

  const hideChrome = isARRoute || isLandingPage || isMarketingPage || isStudioPage;

  const toggleMobileMenu = () => {
    setOpenForPath(mobileMenuOpen ? null : pathname);
  };

  return (
    <>
      {!hideChrome && (
        <>
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onClose={() => setOpenForPath(null)}
          />

          {/* Desktop Header */}
          <div className="hidden md:block">
            <Header />
          </div>

          {/* Mobile Header Bar (< md) */}
          <header
            className="md:hidden fixed top-0 inset-x-0 h-[64px] z-40 bg-surface-bright border-b border-outline-variant flex items-center justify-between px-4 gap-3"
            dir="rtl"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={toggleMobileMenu}
                aria-label="فتح قائمة التنقل"
                aria-expanded={mobileMenuOpen}
                className="p-2 -mr-1 rounded-xl text-on-surface hover:bg-surface-container transition-colors shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <span className="block text-[11px] font-bold text-secondary leading-none">رواق</span>
                <span className="block text-sm font-bold text-on-surface truncate leading-tight mt-0.5">
                  {getMobileRouteTitle(pathname)}
                </span>
              </div>
            </div>

            <Link
              href="/studio"
              onClick={() => setOpenForPath(null)}
              className="shrink-0 bg-secondary text-white px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-secondary/90 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              الاستوديو 3D
            </Link>
          </header>
        </>
      )}
      {children}
    </>
  );
}
