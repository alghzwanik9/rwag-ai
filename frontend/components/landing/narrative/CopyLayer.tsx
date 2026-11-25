'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileText, Play, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { ACT_COPY, CTA, FURNISHINGS, type ActCopy, type ActId } from './config';
import type { HudRefs } from './hud';

/** Mono numerals stay LTR inside the RTL layout. */
function Money({ value }: { value: number }) {
  return (
    <span dir="ltr" className="font-plex-mono text-sm text-chalk">
      {value.toLocaleString('en-US')}
    </span>
  );
}

/** Fixed top navigation bar with protective top gradient scrim. */
function LandingHeader() {
  return (
    <header className="pointer-events-auto fixed inset-x-0 top-0 z-40 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-ink/90 via-ink/55 to-transparent px-6 py-4 sm:px-12 lg:px-20">
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
          className="rounded-pill border border-slate/30 bg-ink/75 px-3.5 py-1.5 font-plex-arabic text-xs font-medium text-sand backdrop-blur-md transition-colors hover:border-brass/60 hover:text-chalk sm:px-4 sm:py-2 sm:text-sm"
        >
          معرض الغرف
        </Link>
        <Link
          href="/library"
          className="rounded-pill border border-slate/30 bg-ink/75 px-3.5 py-1.5 font-plex-arabic text-xs font-medium text-sand backdrop-blur-md transition-colors hover:border-brass/60 hover:text-chalk sm:px-4 sm:py-2 sm:text-sm"
        >
          المعايير المعمارية
        </Link>
        <Link
          href={CTA.primaryHref}
          className="rounded-pill border border-brass/55 bg-brass/15 px-3.5 py-1.5 font-plex-arabic text-xs font-medium text-brass backdrop-blur-md transition-colors hover:bg-brass hover:text-ink sm:px-4 sm:py-2 sm:text-sm"
        >
          الاستوديو
        </Link>
      </nav>
    </header>
  );
}

/** Act 03 Engineering & Saudi Building Code certification overlay panel. */
function SbcCertifiedBadge() {
  const checks = [
    { label: 'ممر الحركة الرئيسي', value: '1.12m >= 0.90m' },
    { label: 'مسافة رؤية الشاشة', value: '3.95m (28°)' },
    { label: 'فحص تصادم الأثاث', value: '0 CLASHES' },
  ];

  return (
    <div className="mt-5 rounded-lg border border-emerald-400/35 bg-ink/85 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 border-b border-emerald-400/20 pb-2.5">
        <span className="inline-flex items-center gap-2 font-plex-arabic text-xs font-semibold text-emerald-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          معتمد هندسياً — SBC 201 &amp; Neufert
        </span>
        <span
          dir="ltr"
          className="rounded-sm bg-emerald-400/15 px-2 py-0.5 font-plex-mono text-[10px] font-medium tracking-wider text-emerald-300"
        >
          VERIFIED
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {checks.map((item) => (
          <div
            key={item.label}
            className="rounded border border-slate/20 bg-night/75 px-2.5 py-2"
          >
            <span className="block font-plex-arabic text-[11px] text-slate">{item.label}</span>
            <span
              dir="ltr"
              className="mt-0.5 flex items-center justify-end gap-1 font-plex-mono text-[11px] font-medium text-emerald-300"
            >
              <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Act 04 live Suite 2 Style Morph & Depth ControlNet 1:1 badge. */
function StyleMorphBadge({ hud }: { hud: HudRefs }) {
  const { morphLabel } = hud;
  return (
    <div className="mt-5 rounded-lg border border-brass/35 bg-ink/82 p-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-plex-arabic text-xs font-medium text-sand">
          <Sparkles className="h-3.5 w-3.5 text-brass" aria-hidden="true" />
          تحوّل حي للخامات والإضاءة
        </span>
        <span
          ref={morphLabel}
          className="rounded-sm border border-brass/40 bg-brass/15 px-2 py-0.5 font-plex-arabic text-[11px] font-medium text-brass"
        >
          ياباندي هادئ 4000K
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate/20 pt-2.5 font-plex-mono text-[10px] tracking-wider text-slate">
        <span dir="ltr" className="rounded-sm border border-slate/25 bg-night/70 px-2 py-0.5 text-sand">
          DEPTH CONTROLNET 1:1
        </span>
        <span dir="ltr" className="rounded-sm border border-slate/25 bg-night/70 px-2 py-0.5 text-brass">
          8K NEURAL RENDER
        </span>
      </div>
    </div>
  );
}

function ActSection({
  act,
  index,
  hud,
  onStartAutoTour,
}: {
  act: ActCopy;
  index: number;
  hud: HudRefs;
  onStartAutoTour: () => void;
}) {
  const Heading = index === 0 ? 'h1' : 'h2';
  const isHero = index === 0;

  return (
    <section className="relative flex h-[100svh] items-center px-6 sm:px-12 lg:px-24">
      <div
        className={`w-full ${
          isHero
            ? 'max-w-xl pt-12 sm:pt-8'
            : 'max-w-lg rounded-xl border border-slate/20 bg-ink/78 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.48)] backdrop-blur-md sm:p-7 md:ms-auto lg:me-16'
        }`}
      >
        <p dir="ltr" className="mb-3 text-end font-plex-mono text-[11px] tracking-[0.26em] text-brass">
          {act.tag}
        </p>

        <Heading
          className={`font-kufi font-bold leading-snug text-chalk ${
            isHero ? 'text-3xl sm:text-5xl lg:text-[3.35rem] lg:leading-[1.22]' : 'text-2xl sm:text-3xl'
          }`}
        >
          {act.titleAr}
        </Heading>

        <p
          className={`mt-4 font-plex-arabic leading-8 ${
            isHero ? 'max-w-lg text-base text-sand/90 sm:text-lg' : 'text-sm text-sand/85 sm:text-base'
          }`}
        >
          {act.bodyAr}
        </p>

        {/* Act 01 Hero CTAs + End-to-End Platform Pipeline Strip */}
        {isHero && (
          <>
            <div className="pointer-events-auto mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={CTA.primaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-pill bg-brass px-7 py-3.5 font-plex-arabic text-sm font-semibold text-ink shadow-[0_10px_28px_rgba(199,154,75,0.35)] transition-all hover:-translate-y-0.5 hover:opacity-95 sm:text-base cursor-pointer"
              >
                <span>{CTA.primaryAr}</span>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={onStartAutoTour}
                className="inline-flex items-center justify-center gap-2 rounded-pill border border-brass/45 bg-ink/75 px-6 py-3.5 font-plex-arabic text-sm font-medium text-chalk backdrop-blur-md transition-colors hover:border-brass hover:text-brass sm:text-base cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current text-brass" aria-hidden="true" />
                <span>{CTA.tourStartAr}</span>
              </button>
            </div>

            {act.highlights && (
              <div className="mt-7 flex flex-wrap items-center gap-2">
                {act.highlights.map((step, stepIdx) => (
                  <span
                    key={step}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-slate/25 bg-ink/80 px-2.5 py-1 font-plex-arabic text-[11px] text-sand backdrop-blur-sm"
                  >
                    <span dir="ltr" className="font-plex-mono text-[10px] text-brass">
                      0{stepIdx + 1}
                    </span>
                    {step}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Act 02 Interior Spec Tags */}
        {act.id === 'living' && act.highlights && (
          <div className="mt-5 flex flex-wrap gap-2">
            {act.highlights.map((tag) => (
              <span
                key={tag}
                className="rounded-sm border border-brass/30 bg-night/75 px-2.5 py-1 font-plex-arabic text-xs text-sand"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Act 03 SBC 201 & Neufert Certified Overlay */}
        {act.id === 'audit' && <SbcCertifiedBadge />}

        {/* Act 04 Live Suite Style Morph + 1:1 Neural Render Badge */}
        {act.id === 'morph' && <StyleMorphBadge hud={hud} />}
      </div>
    </section>
  );
}

/**
 * Act 05 Live SAR Pricing & Execution Card:
 * Clean itemized SAR breakdown (11,090 SAR), PDF BOQ & AR preview highlights,
 * and a SINGLE bold primary CTA with zero duplicate secondary nav buttons.
 */
function CostCard({ hud }: { hud: HudRefs }) {
  const { budgetText } = hud;

  return (
    <div className="pointer-events-auto w-full max-w-md rounded-xl border border-brass/35 bg-ink/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-plex-arabic text-xs font-medium text-sand">
          جدول الكميات والتسعير الفوري
        </span>
        <p dir="ltr" className="font-plex-mono text-[10px] tracking-[0.24em] text-brass">
          LIVE BOQ — SAR
        </p>
      </div>

      <ul className="divide-y divide-slate/15">
        {FURNISHINGS.map((piece) => (
          <li key={piece.id} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0">
              <span className="block truncate font-plex-arabic text-sm text-chalk">{piece.labelAr}</span>
              <span className="block font-plex-mono text-[10px] tracking-wide text-slate">
                {piece.supplier}
              </span>
            </span>
            <Money value={piece.price} />
          </li>
        ))}
      </ul>

      <div className="mt-3.5 flex items-baseline justify-between border-t border-brass/40 pt-3.5">
        <span className="font-plex-arabic text-sm text-sand">الإجمالي التقديري</span>
        <span dir="ltr" className="font-plex-mono text-2xl font-medium text-brass">
          <span ref={budgetText}>0</span> <span className="text-sm">SAR</span>
        </span>
      </div>

      {/* Executive Deliverables: PDF BOQ & AR Preview Highlights */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate/25 bg-night/75 px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
          <div className="min-w-0">
            <span className="block truncate font-plex-arabic text-[11px] font-medium text-chalk">
              تقرير PDF BOQ
            </span>
            <span className="block truncate font-plex-arabic text-[10px] text-slate">
              مخطط 2D وضريبة 15%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate/25 bg-night/75 px-3 py-2">
          <Smartphone className="h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
          <div className="min-w-0">
            <span className="block truncate font-plex-arabic text-[11px] font-medium text-chalk">
              معاينة الواقع المعزز
            </span>
            <span className="block truncate font-plex-arabic text-[10px] text-slate">
              AR فوري بغرفتك 1:1
            </span>
          </div>
        </div>
      </div>

      {/* Single Focused Primary CTA */}
      <Link
        href={CTA.primaryHref}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-pill bg-brass px-6 py-3.5 font-plex-arabic text-sm font-semibold text-ink shadow-[0_10px_28px_rgba(199,154,75,0.38)] transition-all hover:-translate-y-0.5 hover:opacity-95 sm:text-base"
      >
        <span>{CTA.primaryAr}</span>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default function CopyLayer({
  acts,
  hud,
  onStartAutoTour,
}: {
  acts: readonly ActId[];
  hud: HudRefs;
  onStartAutoTour: () => void;
}) {
  const sections = ACT_COPY.filter((act) => acts.includes(act.id));

  return (
    <div dir="rtl" className="w-full">
      <LandingHeader />

      {sections.map((act, index) =>
        act.id === 'pricing' ? (
          <section
            key={act.id}
            className="flex h-[100svh] flex-col items-start justify-center gap-6 px-6 pb-20 pt-20 sm:px-12 lg:flex-row lg:items-center lg:justify-between lg:px-24"
          >
            <div className="max-w-md rounded-xl border border-slate/20 bg-ink/78 p-6 backdrop-blur-md">
              <p dir="ltr" className="mb-3 text-end font-plex-mono text-[11px] tracking-[0.26em] text-brass">
                {act.tag}
              </p>
              <h2 className="font-kufi text-2xl font-bold leading-snug text-chalk sm:text-3xl">
                {act.titleAr}
              </h2>
              <p className="mt-4 font-plex-arabic text-sm leading-8 text-sand/85 sm:text-base">
                {act.bodyAr}
              </p>
            </div>
            <CostCard hud={hud} />
          </section>
        ) : (
          <ActSection
            key={act.id}
            act={act}
            index={index}
            hud={hud}
            onStartAutoTour={onStartAutoTour}
          />
        ),
      )}
    </div>
  );
}
