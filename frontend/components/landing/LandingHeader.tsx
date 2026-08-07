'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { BRAND, NAV_LINKS } from '@/lib/landing-data';
import { SupabaseStatusBadge } from './StatusIndicators';

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  // Condense the header into frosted glass once the hero starts scrolling away.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy so the nav always reflects the section in view.
  useEffect(() => {
    const ids = NAV_LINKS.filter((link) => link.href.startsWith('#')).map((link) => link.href.slice(1));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);

    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Trap the page behind the mobile sheet and allow Escape to dismiss it.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled
          ? 'border-b border-white/[0.07] bg-rwaq-slate/72 backdrop-blur-2xl backdrop-saturate-150'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        {/* Brand */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3"
          aria-label={`${BRAND.nameAr} — ${BRAND.nameEn}`}
        >
          <span
            className="text-2xl font-bold leading-none text-rwaq-gold transition-[text-shadow] duration-500 sm:text-[26px]"
            style={{ textShadow: '0 0 22px rgba(232,196,136,0.34)' }}
          >
            {BRAND.nameAr}
          </span>
          <span className="hidden h-5 w-px bg-white/12 sm:block" />
          <span className="hidden font-tech text-[11px] uppercase tracking-[0.22em] text-rwaq-ink-faint sm:block">
            Rwaq AI
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="التنقل الرئيسي" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === `#${activeId}`;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? 'true' : undefined}
                    className={`relative block rounded-lg px-3.5 py-2 text-[15px] transition-colors duration-300 ${
                      isActive ? 'text-rwaq-ink' : 'text-rwaq-ink-muted hover:text-rwaq-ink'
                    }`}
                  >
                    {link.labelAr}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-3.5 -bottom-0.5 h-px origin-center bg-gradient-to-r from-transparent via-rwaq-gold to-transparent transition-transform duration-500 ${
                        isActive ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Status + CTA */}
        <div className="flex items-center gap-3">
          {/* Wrapped rather than given a `hidden` class: the badge sets its own
              `inline-flex`, and two display utilities in one class list resolve
              by stylesheet order, not by the order written here. */}
          <div className="hidden md:block">
            <SupabaseStatusBadge />
          </div>

          <Link
            href="/studio"
            className="rwaq-sweep relative hidden overflow-hidden rounded-pill border border-rwaq-gold/35 bg-rwaq-gold/[0.07] px-5 py-2.5 text-sm font-medium text-rwaq-gold transition-all duration-300 hover:border-rwaq-gold/70 hover:bg-rwaq-gold/[0.13] sm:inline-flex sm:items-center sm:gap-2"
          >
            <span>دخول الأستوديو 3D</span>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="rwaq-mobile-menu"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-rwaq-ink transition-colors hover:bg-white/[0.08] lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet — full height below the bar so page content never shows
          through behind the menu. */}
      <div
        id="rwaq-mobile-menu"
        hidden={!menuOpen}
        className="fixed inset-x-0 bottom-0 top-[72px] overflow-y-auto border-t border-white/[0.07] bg-rwaq-slate lg:hidden"
      >
        <nav aria-label="التنقل للجوال" className="px-5 py-5 sm:px-8">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-baseline justify-between rounded-xl px-3 py-3.5 text-lg text-rwaq-ink transition-colors hover:bg-white/[0.05]"
                >
                  <span>{link.labelAr}</span>
                  <span className="font-tech text-[11px] uppercase tracking-[0.16em] text-rwaq-ink-faint">
                    {link.labelEn}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.07] pt-5">
            <Link
              href="/studio"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-pill border border-rwaq-gold/40 bg-rwaq-gold/10 px-5 py-3.5 text-base font-medium text-rwaq-gold"
            >
              <span>دخول الأستوديو 3D</span>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="self-start md:hidden">
              <SupabaseStatusBadge />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
