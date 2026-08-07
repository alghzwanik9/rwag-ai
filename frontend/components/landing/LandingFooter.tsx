'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { BRAND, FOOTER_GROUPS } from '@/lib/landing-data';
import { ServerHealthIndicator } from './StatusIndicators';

export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-rwaq-slate-deep">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rwaq-gold/35 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(80% 60% at 78% 0%, rgba(164,142,116,0.10), transparent 62%)',
        }}
      />

      <div className="relative mx-auto max-w-[1180px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          {/* Brand + mission */}
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span
                className="text-2xl font-bold text-rwaq-gold"
                style={{ textShadow: '0 0 22px rgba(232,196,136,0.3)' }}
              >
                {BRAND.nameAr}
              </span>
              <span className="h-5 w-px bg-white/12" />
              <span className="font-tech text-[11px] uppercase tracking-[0.22em] text-rwaq-ink-faint">
                {BRAND.nameEn}
              </span>
            </div>
            <p className="mt-5 text-[14px] leading-[1.9] text-rwaq-ink-muted">{BRAND.missionAr}</p>

            <a
              href={`mailto:${BRAND.email}`}
              className="mt-6 inline-flex items-center gap-2.5 rounded-pill border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[14px] text-rwaq-ink transition-colors duration-300 hover:border-rwaq-gold/35 hover:text-rwaq-gold"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span className="font-tech">{BRAND.email}</span>
            </a>
          </div>

          {/* Link groups */}
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.titleAr} aria-label={group.titleAr}>
              <h2 className="text-[13px] font-medium text-rwaq-ink">{group.titleAr}</h2>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={`${group.titleAr}-${link.labelAr}`}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-[14px] text-rwaq-ink-muted transition-colors duration-300 hover:text-rwaq-ink"
                    >
                      <span>{link.labelAr}</span>
                      <ArrowLeft
                        className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-60"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Status + entry point */}
          <div>
            <h2 className="text-[13px] font-medium text-rwaq-ink">حالة المنصة</h2>
            <div className="mt-4">
              <ServerHealthIndicator />
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-rwaq-ink-faint">
              نراقب توفّر خدمات التوليد ومطابقة الموردين على مدار الساعة.
            </p>

            <Link
              href="/studio"
              className="mt-6 inline-flex items-center gap-2 rounded-pill border border-rwaq-gold/35 bg-rwaq-gold/[0.07] px-4 py-2.5 text-[14px] text-rwaq-gold transition-colors duration-300 hover:border-rwaq-gold/70 hover:bg-rwaq-gold/[0.13]"
            >
              <span>دخول الأستوديو 3D</span>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Legal bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-white/[0.07] pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-rwaq-ink-faint">
            © {year} {BRAND.nameAr} — {BRAND.nameEn}. جميع الحقوق محفوظة.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 text-[13px] text-rwaq-ink-muted transition-colors duration-300 hover:text-rwaq-ink"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>سياسة الخصوصية</span>
            </Link>
            <a
              href={`mailto:${BRAND.email}`}
              className="text-[13px] text-rwaq-ink-muted transition-colors duration-300 hover:text-rwaq-ink"
            >
              تواصل معنا
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
