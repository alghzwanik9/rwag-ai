'use client';

import Link from 'next/link';
import { ACT_COPY, COST_TOTAL, CTA, FURNISHINGS } from './config';

/**
 * Reduced-motion version: no canvas, no animation — all copy stacked
 * vertically with the cost breakdown and final total rendered statically.
 */
export default function StaticFallback() {
  const [hero, ...rest] = ACT_COPY;

  return (
    <div dir="rtl" className="min-h-[100svh] bg-ink text-chalk">
      <header className="border-b border-slate/20 bg-night/60">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-10">
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
              className="rounded-full border border-slate/30 bg-ink/70 px-3.5 py-1.5 font-plex-arabic text-xs font-medium text-sand transition-colors hover:border-brass/60 hover:text-chalk sm:px-4 sm:text-sm"
            >
              معرض الغرف
            </Link>
            <Link
              href="/library"
              className="rounded-full border border-slate/30 bg-ink/70 px-3.5 py-1.5 font-plex-arabic text-xs font-medium text-sand transition-colors hover:border-brass/60 hover:text-chalk sm:px-4 sm:text-sm"
            >
              المعايير المعمارية
            </Link>
            <Link
              href={CTA.primaryHref}
              className="rounded-full border border-brass/50 bg-brass/15 px-3.5 py-1.5 font-plex-arabic text-xs font-medium text-brass transition-colors hover:bg-brass hover:text-ink sm:px-4 sm:text-sm"
            >
              الاستوديو
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
        <p dir="ltr" className="mb-4 text-end font-plex-mono text-[11px] tracking-[0.28em] text-brass">
          {hero.tag}
        </p>
        <h1 className="font-kufi text-4xl font-bold leading-snug sm:text-5xl">{hero.titleAr}</h1>
        <p className="mt-5 max-w-xl font-plex-arabic text-lg leading-8 text-slate">{hero.bodyAr}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={CTA.primaryHref}
            className="inline-flex items-center justify-center rounded-full bg-brass px-7 py-3.5 font-plex-arabic text-base font-medium text-ink transition-opacity hover:opacity-90"
          >
            {CTA.primaryAr}
          </Link>
          <Link
            href="/maarad"
            className="inline-flex items-center justify-center rounded-full border border-slate/40 px-6 py-3.5 font-plex-arabic text-sm font-medium text-sand transition-colors hover:border-brass/60 hover:text-chalk sm:text-base"
          >
            معرض الغرف
          </Link>
          <Link
            href="/library"
            className="inline-flex items-center justify-center rounded-full border border-slate/40 px-6 py-3.5 font-plex-arabic text-sm font-medium text-sand transition-colors hover:border-brass/60 hover:text-chalk sm:text-base"
          >
            المعايير المعمارية
          </Link>
        </div>

        <div className="mt-16 space-y-12">
          {rest.map((act) => (
            <section key={act.id}>
              <p dir="ltr" className="mb-2 text-end font-plex-mono text-[10px] tracking-[0.24em] text-brass/80">
                {act.tag}
              </p>
              <h2 className="font-kufi text-2xl font-bold">{act.titleAr}</h2>
              <p className="mt-3 max-w-xl font-plex-arabic leading-8 text-slate">{act.bodyAr}</p>
            </section>
          ))}
        </div>

        <section className="mt-16 max-w-sm rounded-2xl border border-slate/25 bg-night p-6">
          <ul className="divide-y divide-slate/15">
            {FURNISHINGS.map((piece) => (
              <li key={piece.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-plex-arabic text-sm">{piece.labelAr}</span>
                  <span className="block font-plex-mono text-[10px] tracking-wide text-slate">{piece.supplier}</span>
                </span>
                <span dir="ltr" className="font-plex-mono">
                  {piece.price.toLocaleString('en-US')}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-brass/40 pt-4">
            <span className="font-plex-arabic text-sm text-slate">الإجمالي</span>
            <span dir="ltr" className="font-plex-mono text-2xl font-medium text-brass">
              {COST_TOTAL.toLocaleString('en-US')} <span className="text-sm">SAR</span>
            </span>
          </div>
          <Link
            href={CTA.primaryHref}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brass px-6 py-3 font-plex-arabic text-base font-medium text-ink transition-opacity hover:opacity-90"
          >
            {CTA.primaryAr}
          </Link>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/maarad"
              className="inline-flex items-center justify-center rounded-full border border-slate/30 bg-ink/50 px-3 py-2 font-plex-arabic text-xs font-medium text-sand transition-colors hover:border-brass/60 hover:text-chalk"
            >
              معرض الغرف
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center justify-center rounded-full border border-slate/30 bg-ink/50 px-3 py-2 font-plex-arabic text-xs font-medium text-sand transition-colors hover:border-brass/60 hover:text-chalk"
            >
              المعايير المعمارية
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
