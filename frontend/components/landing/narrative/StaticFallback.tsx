'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, ShieldCheck, Smartphone } from 'lucide-react';
import { ACT_COPY, COST_TOTAL, CTA, FURNISHINGS } from './config';

/**
 * Reduced-motion / WebGL fallback version: preserves the complete 5-Act
 * Rwaq AI narrative, SBC 201 certification summary, and clean SAR BOQ card
 * with a single focused CTA.
 */
export default function StaticFallback() {
  const [hero, ...rest] = ACT_COPY;

  return (
    <div dir="rtl" className="min-h-[100svh] bg-ink text-chalk">
      <header className="border-b border-slate/20 bg-night/70">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-10">
          <Link
            href="/"
            className="inline-flex items-baseline gap-2.5 text-chalk transition-opacity hover:opacity-90"
          >
            <span className="font-kufi text-lg font-bold tracking-tight">رواق</span>
            <span dir="ltr" className="font-plex-mono text-[10px] tracking-[0.26em] text-brass">
              RWAQ AI
            </span>
          </Link>
          <nav aria-label="التنقل الرئيسي" className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/maarad"
              className="rounded-pill border border-slate/30 bg-ink/70 px-3.5 py-1.5 font-plex-arabic text-xs font-medium text-sand transition-colors hover:border-brass/60 hover:text-chalk sm:px-4 sm:text-sm"
            >
              معرض الغرف
            </Link>
            <Link
              href="/library"
              className="rounded-pill border border-slate/30 bg-ink/70 px-3.5 py-1.5 font-plex-arabic text-xs font-medium text-sand transition-colors hover:border-brass/60 hover:text-chalk sm:px-4 sm:text-sm"
            >
              المعايير المعمارية
            </Link>
            <Link
              href={CTA.primaryHref}
              className="rounded-pill border border-brass/50 bg-brass/15 px-3.5 py-1.5 font-plex-arabic text-xs font-medium text-brass transition-colors hover:bg-brass hover:text-ink sm:px-4 sm:text-sm"
            >
              الاستوديو
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:px-10 sm:py-20">
        <p dir="ltr" className="mb-4 text-end font-plex-mono text-[11px] tracking-[0.28em] text-brass">
          {hero.tag}
        </p>
        <h1 className="font-kufi text-4xl font-bold leading-snug sm:text-5xl">{hero.titleAr}</h1>
        <p className="mt-5 max-w-2xl font-plex-arabic text-lg leading-8 text-sand/85">{hero.bodyAr}</p>
        <div className="mt-8">
          <Link
            href={CTA.primaryHref}
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-brass px-7 py-3.5 font-plex-arabic text-base font-semibold text-ink transition-opacity hover:opacity-90"
          >
            <span>{CTA.primaryAr}</span>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-16 space-y-10">
          {rest.map((act) => (
            <section
              key={act.id}
              className="rounded-xl border border-slate/20 bg-night/60 p-6"
            >
              <p dir="ltr" className="mb-2 text-end font-plex-mono text-[10px] tracking-[0.24em] text-brass">
                {act.tag}
              </p>
              <h2 className="font-kufi text-2xl font-bold">{act.titleAr}</h2>
              <p className="mt-3 max-w-2xl font-plex-arabic leading-8 text-sand/85">{act.bodyAr}</p>
              {act.id === 'audit' && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-sm border border-emerald-400/35 bg-emerald-400/10 px-3 py-1.5 font-plex-arabic text-xs text-emerald-300">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  معتمد وفق كود البناء السعودي SBC 201 ومعايير Neufert (ممرات ≥ 0.90م)
                </div>
              )}
            </section>
          ))}
        </div>

        <section className="mt-14 max-w-md rounded-xl border border-brass/35 bg-night p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-plex-arabic text-xs text-sand">جدول الكميات والتسعير</span>
            <span dir="ltr" className="font-plex-mono text-[10px] tracking-[0.24em] text-brass">
              LIVE BOQ — SAR
            </span>
          </div>
          <ul className="divide-y divide-slate/15">
            {FURNISHINGS.map((piece) => (
              <li key={piece.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-plex-arabic text-sm">{piece.labelAr}</span>
                  <span className="block font-plex-mono text-[10px] tracking-wide text-slate">
                    {piece.supplier}
                  </span>
                </span>
                <span dir="ltr" className="font-plex-mono text-sm">
                  {piece.price.toLocaleString('en-US')}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-brass/40 pt-4">
            <span className="font-plex-arabic text-sm text-sand">الإجمالي التقديري</span>
            <span dir="ltr" className="font-plex-mono text-2xl font-medium text-brass">
              {COST_TOTAL.toLocaleString('en-US')} <span className="text-sm">SAR</span>
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate/25 bg-ink/70 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
              <span className="font-plex-arabic text-[11px] text-chalk">تقرير PDF BOQ</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate/25 bg-ink/70 px-3 py-2">
              <Smartphone className="h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
              <span className="font-plex-arabic text-[11px] text-chalk">معاينة الواقع المعزز AR</span>
            </div>
          </div>
          <Link
            href={CTA.primaryHref}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-pill bg-brass px-6 py-3.5 font-plex-arabic text-base font-semibold text-ink transition-opacity hover:opacity-90"
          >
            <span>{CTA.primaryAr}</span>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}
