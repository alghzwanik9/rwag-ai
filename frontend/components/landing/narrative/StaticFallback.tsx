'use client';

import Link from 'next/link';
import { ACT_COPY, COST_ITEMS, COST_TOTAL, CTA } from './config';

/**
 * Reduced-motion version: no canvas, no animation — all copy stacked
 * vertically with the cost breakdown and final total rendered statically.
 */
export default function StaticFallback() {
  const [hero, ...rest] = ACT_COPY;

  return (
    <div dir="rtl" className="min-h-[100svh] bg-ink text-chalk">
      <main className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
        <p dir="ltr" className="mb-4 text-end font-plex-mono text-[11px] tracking-[0.28em] text-brass">
          {hero.tag}
        </p>
        <h1 className="font-kufi text-4xl font-bold leading-snug sm:text-5xl">{hero.titleAr}</h1>
        <p className="mt-5 max-w-xl font-plex-arabic text-lg leading-8 text-slate">{hero.bodyAr}</p>
        <Link
          href={CTA.primaryHref}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-brass px-7 py-3.5 font-plex-arabic text-base font-medium text-ink"
        >
          {CTA.primaryAr}
        </Link>

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
            {COST_ITEMS.map((item) => (
              <li key={item.nameAr} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-plex-arabic text-sm">{item.nameAr}</span>
                  <span className="block font-plex-mono text-[10px] tracking-wide text-slate">{item.supplier}</span>
                </span>
                <span dir="ltr" className="font-plex-mono">
                  {item.price.toLocaleString('en-US')}
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
        </section>
      </main>
    </div>
  );
}
