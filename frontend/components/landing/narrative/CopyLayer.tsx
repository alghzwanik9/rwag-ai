'use client';

import Link from 'next/link';
import { ACT_COPY, CTA, FURNISHINGS, type ActCopy, type ActId } from './config';
import type { HudRefs } from './hud';

/** Mono numerals stay LTR inside the RTL layout. */
function Money({ value }: { value: number }) {
  return (
    <span dir="ltr" className="font-plex-mono text-chalk">
      {value.toLocaleString('en-US')}
    </span>
  );
}

function ActSection({ act, index, hud }: { act: ActCopy; index: number; hud: HudRefs }) {
  const Heading = index === 0 ? 'h1' : 'h2';

  return (
    <section className="flex h-[100svh] items-center px-6 sm:px-12 lg:px-24">
      <div className={`w-full max-w-xl ${index === 0 ? '' : 'ms-auto lg:me-24'}`}>
        <p dir="ltr" className="mb-4 text-end font-plex-mono text-[11px] tracking-[0.28em] text-brass">
          {act.tag}
        </p>
        <Heading
          className={`font-kufi font-bold leading-snug text-chalk ${
            index === 0 ? 'text-4xl sm:text-5xl lg:text-6xl' : 'text-3xl sm:text-4xl'
          }`}
        >
          {act.titleAr}
        </Heading>
        <p className="mt-5 max-w-md font-plex-arabic text-base leading-8 text-slate sm:text-lg">
          {act.bodyAr}
        </p>

        {index === 0 && (
          <div className="mt-9 flex flex-col gap-3 sm:flex-row pointer-events-auto">
            <Link
              href={CTA.primaryHref}
              className="inline-flex items-center justify-center rounded-full bg-brass px-7 py-3.5 font-plex-arabic text-base font-medium text-ink transition-opacity hover:opacity-90 cursor-pointer"
            >
              {CTA.primaryAr}
            </Link>
            <button
              type="button"
              onClick={() => {
                const el = hud.scrollEl.current;
                if (el) el.scrollTo({ top: el.clientHeight, behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate/40 px-7 py-3.5 font-plex-arabic text-base text-chalk transition-colors hover:border-brass/60 cursor-pointer"
            >
              {CTA.secondaryAr}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/** Act 5 card: furniture list, live budget counter, closing CTA. */
function CostCard({ hud }: { hud: HudRefs }) {
  const { budgetText } = hud;
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate/25 bg-night/85 p-6 backdrop-blur-sm pointer-events-auto">
      <p dir="ltr" className="mb-4 text-end font-plex-mono text-[10px] tracking-[0.24em] text-slate">
        QUOTE — SAR
      </p>
      <ul className="divide-y divide-slate/15">
        {FURNISHINGS.map((piece) => (
          <li key={piece.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0">
              <span className="block truncate font-plex-arabic text-sm text-chalk">{piece.labelAr}</span>
              <span className="block font-plex-mono text-[10px] tracking-wide text-slate">{piece.supplier}</span>
            </span>
            <Money value={piece.price} />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between border-t border-brass/40 pt-4">
        <span className="font-plex-arabic text-sm text-slate">الإجمالي</span>
        <span dir="ltr" className="font-plex-mono text-2xl font-medium text-brass">
          <span ref={budgetText}>0</span> <span className="text-sm">SAR</span>
        </span>
      </div>
      <Link
        href={CTA.primaryHref}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brass px-6 py-3 font-plex-arabic text-base font-medium text-ink transition-opacity hover:opacity-90"
      >
        {CTA.primaryAr}
      </Link>
    </div>
  );
}

/**
 * The Arabic copy layer rendered inside `<Scroll html>`: one 100svh section
 * per act, scrolling naturally above the canvas.
 */
export default function CopyLayer({ acts, hud }: { acts: readonly ActId[]; hud: HudRefs }) {
  const sections = ACT_COPY.filter((act) => acts.includes(act.id));

  return (
    <div dir="rtl" className="w-screen">
      {sections.map((act, index) =>
        act.id === 'cost' ? (
          <section
            key={act.id}
            className="flex h-[100svh] flex-col items-start justify-center gap-8 px-6 sm:px-12 lg:flex-row lg:items-center lg:justify-between lg:px-24"
          >
            <div className="max-w-md">
              <p dir="ltr" className="mb-4 text-end font-plex-mono text-[11px] tracking-[0.28em] text-brass">
                {act.tag}
              </p>
              <h2 className="font-kufi text-3xl font-bold leading-snug text-chalk sm:text-4xl">{act.titleAr}</h2>
              <p className="mt-5 font-plex-arabic text-base leading-8 text-slate sm:text-lg">{act.bodyAr}</p>
            </div>
            <CostCard hud={hud} />
          </section>
        ) : (
          <ActSection key={act.id} act={act} index={index} hud={hud} />
        ),
      )}
    </div>
  );
}
