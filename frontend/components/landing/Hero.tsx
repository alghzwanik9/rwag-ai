'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SignUpButton } from '@clerk/nextjs';
import { ArrowLeft, Play, Ruler, Sparkles, Wallet } from 'lucide-react';
import { HERO_HUD, MEDIA } from '@/lib/landing-data';
import { useCountUp } from '@/lib/useCountUp';
import AmbientVideo from './AmbientVideo';
import { JapandiLightScene } from './SceneFallbacks';
import VideoLightbox from './VideoLightbox';

const heroSources = [MEDIA.heroLoop.local, MEDIA.heroLoop.remote];
const morphSources = [MEDIA.morphLoop.local, MEDIA.morphLoop.remote];

/** Glass HUD chip floating over the ambient canvas. */
function HudCard({
  children,
  className = '',
  depth = 1,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Parallax multiplier — higher reads as closer to the viewer. */
  depth?: number;
  delay?: number;
}) {
  // Parallax and float both drive `transform`, so they live on separate
  // elements: the outer node tracks the pointer, the inner node drifts.
  return (
    <div
      className={className}
      style={{
        transform: `translate3d(calc(var(--px, 0) * ${depth * 14}px), calc(var(--py, 0) * ${depth * 14}px), 0)`,
        transition: 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="rwaq-float" style={{ animationDelay: `${delay}ms` }}>
        <div className="rwaq-glass-deep rwaq-bevel rounded-2xl p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Hero({ isSignedIn }: { isSignedIn: boolean }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);

  // The hero sits above the fold, so the budget counts up from first paint.
  const budget = useCountUp(HERO_HUD.budget.amount, true, 1800);

  // Pointer parallax for the HUD layer — pointer-only, and skipped entirely
  // for anyone who prefers reduced motion.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        section.style.setProperty('--px', px.toFixed(3));
        section.style.setProperty('--py', py.toFixed(3));
        frame = 0;
      });
    };

    const onPointerLeave = () => {
      section.style.setProperty('--px', '0');
      section.style.setProperty('--py', '0');
    };

    section.addEventListener('pointermove', onPointerMove);
    section.addEventListener('pointerleave', onPointerLeave);

    return () => {
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onPointerLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-[72px]"
    >
      <AmbientVideo sources={heroSources} fallback={<JapandiLightScene />} playbackRate={0.75} />

      {/* Legibility scrim: darkest on the RTL text side, and at the seam with
          the next section. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-[1]"
        style={{
          background:
            'linear-gradient(to left, rgba(14,16,21,0.30) 0%, rgba(14,16,21,0.72) 52%, rgba(14,16,21,0.93) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-[1] h-40 bg-gradient-to-t from-rwaq-slate to-transparent"
      />

      {/* `relative z-10` is required: the ambient video is absolutely
          positioned and would otherwise paint over this in-flow content. */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.06fr_0.94fr] lg:gap-10 lg:px-12 lg:py-24">
        {/* ── Copy ─────────────────────────────────────────────────────── */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2.5 rounded-pill border border-rwaq-gold/25 bg-rwaq-gold/[0.07] px-3.5 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-rwaq-gold" aria-hidden="true" />
            <span className="text-[13px] text-rwaq-gold/90">مدعومة بوكلاء CrewAI ومحرك RAG للموردين</span>
          </div>

          <h1 className="mt-6 text-[34px] font-bold leading-[1.28] tracking-tight text-rwaq-ink sm:text-5xl sm:leading-[1.22] lg:text-[58px] lg:leading-[1.18]">
            صمّم مساحتك المعمارية{' '}
            <span className="rwaq-gold-text">بذكاء الوكلاء</span> والواقع المعزز
          </h1>

          <p className="mt-6 max-w-xl text-base leading-[1.85] text-rwaq-ink-muted sm:text-lg">
            المنصة الأولى القائمة على الذكاء الاصطناعي التوليدي لتخيل، تأثيث، ومحاكاة الغرف
            والمساحات ثلاثية الأبعاد بلمسة واحدة وإدارة دقيقة للميزانية.
          </p>

          <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            {isSignedIn ? (
              <Link href="/studio" className="rwaq-cta group">
                <span>ابدأ التصميم مجاناً الآن</span>
                <ArrowLeft
                  className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button type="button" className="rwaq-cta group">
                  <span>ابدأ التصميم مجاناً الآن</span>
                  <ArrowLeft
                    className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </SignUpButton>
            )}

            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center justify-center gap-2.5 rounded-pill border border-white/12 bg-white/[0.04] px-6 py-3.5 text-[15px] text-rwaq-ink backdrop-blur-xl transition-all duration-300 hover:border-white/25 hover:bg-white/[0.08]"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-pill border border-rwaq-gold/40 bg-rwaq-gold/10">
                <Play className="h-3 w-3 fill-rwaq-gold text-rwaq-gold" aria-hidden="true" />
              </span>
              <span>مشاهدة العرض التفاعلي</span>
            </button>
          </div>
        </div>

        {/* ── Spatial HUD ──────────────────────────────────────────────── */}
        <div className="relative grid grid-cols-2 gap-3.5 sm:gap-4 lg:block lg:h-[440px]">
          {/* Room dimensions */}
          <HudCard className="lg:absolute lg:top-4 lg:right-2 lg:w-[228px]" depth={1.15} delay={0}>
            <div className="flex items-center gap-2 text-rwaq-ink-faint">
              <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-tech text-[10px] uppercase tracking-[0.16em]">Room</span>
            </div>
            <p className="mt-2.5 font-tech text-xl font-medium text-rwaq-ink sm:text-2xl">
              5.0<span className="text-rwaq-ink-faint">m</span> × 5.0
              <span className="text-rwaq-ink-faint">m</span>
            </p>
            <p className="mt-1 text-xs text-rwaq-ink-muted">
              {HERO_HUD.room.labelAr} · {(HERO_HUD.room.widthM * HERO_HUD.room.depthM).toFixed(0)} م²
            </p>
            <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-rwaq-gold/50 to-transparent" />
              <span className="h-1.5 w-1.5 rotate-45 border border-rwaq-gold/60" />
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-rwaq-gold/50 to-transparent" />
            </div>
          </HudCard>

          {/* Live budget */}
          <HudCard className="lg:absolute lg:top-[168px] lg:left-0 lg:w-[264px]" depth={1.55} delay={900}>
            <div className="flex items-center gap-2 text-rwaq-ink-faint">
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-tech text-[10px] uppercase tracking-[0.16em]">Live Budget</span>
              <span className="relative ms-auto flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-pill bg-rwaq-live/50 motion-safe:animate-[rwaq-halo_2.4s_ease-out_infinite]" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-pill bg-rwaq-live" />
              </span>
            </div>
            <p className="mt-2.5 font-tech text-xl font-medium text-rwaq-ink sm:text-2xl">
              {budget.toLocaleString('en-US')}{' '}
              <span className="text-sm text-rwaq-gold">{HERO_HUD.budget.currencyAr}</span>
            </p>
            <p className="mt-1 text-xs text-rwaq-ink-muted">{HERO_HUD.budget.labelAr}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {HERO_HUD.budget.sources.map((source) => (
                <span
                  key={source}
                  className="rounded-pill border border-white/10 bg-white/[0.05] px-2 py-0.5 font-tech text-[10px] text-rwaq-ink-muted"
                >
                  {source}
                </span>
              ))}
            </div>
          </HudCard>

          {/* Palette */}
          <HudCard
            className="col-span-2 lg:absolute lg:bottom-3 lg:right-8 lg:w-[248px]"
            depth={0.85}
            delay={1800}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-tech text-[10px] uppercase tracking-[0.16em] text-rwaq-ink-faint">
                {HERO_HUD.palette.labelEn}
              </span>
              <span className="text-xs text-rwaq-ink-muted">{HERO_HUD.palette.labelAr}</span>
            </div>
            <ul className="mt-3 flex items-center gap-2.5">
              {HERO_HUD.palette.swatches.map((swatch) => (
                <li key={swatch.hex} className="flex-1">
                  <span
                    className="block h-11 rounded-xl border border-white/12 shadow-inner"
                    style={{ backgroundColor: swatch.hex }}
                    role="img"
                    aria-label={`${swatch.nameAr} ${swatch.hex}`}
                  />
                  {/* dir="ltr" keeps the leading "#" from being reordered to
                      the far side of the code inside the RTL paragraph. */}
                  <span
                    dir="ltr"
                    className="mt-1.5 block text-center font-tech text-[9px] tracking-wide text-rwaq-ink-faint"
                  >
                    {swatch.hex}
                  </span>
                </li>
              ))}
            </ul>
          </HudCard>
        </div>
      </div>

      {/* Scroll cue — anchors the lower third of the hero. */}
      <a
        href="#studio-2d"
        className="absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2.5 text-rwaq-ink-faint transition-colors duration-300 hover:text-rwaq-gold sm:flex"
      >
        <span className="font-tech text-[10px] uppercase tracking-[0.22em]">Scroll</span>
        <span aria-hidden="true" className="relative block h-10 w-px overflow-hidden bg-white/12">
          <span className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-transparent via-rwaq-gold to-transparent motion-safe:animate-[rwaq-scan_2.6s_ease-in-out_infinite]" />
        </span>
        <span className="sr-only">انتقل إلى القسم التالي</span>
      </a>

      <VideoLightbox
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        sources={morphSources}
        titleAr="العرض التفاعلي — من المخطط إلى المشهد ثلاثي الأبعاد"
        captionAr={MEDIA.morphLoop.label}
      />
    </section>
  );
}
