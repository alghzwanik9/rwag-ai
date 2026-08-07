'use client';

import { useRef } from 'react';
import { Boxes, FileDown, ScanLine, Sparkles } from 'lucide-react';
import { FEATURES, MEDIA, type FeatureCard } from '@/lib/landing-data';
import AmbientVideo from './AmbientVideo';
import { BlueprintScene } from './SceneFallbacks';
import Reveal from './Reveal';

const ICONS = {
  engine: Sparkles,
  catalog: Boxes,
  ar: ScanLine,
  export: FileDown,
} as const;

const morphSources = [MEDIA.morphLoop.local, MEDIA.morphLoop.remote];

/**
 * Bento cell with pointer-tracked tilt and a cursor-following highlight.
 * Both effects are transform/opacity only, and the tilt is skipped on coarse
 * pointers so touch devices get a flat, fast card.
 */
function BentoCard({
  feature,
  className = '',
  children,
}: {
  feature: FeatureCard;
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const Icon = ICONS[feature.icon];

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    node.style.setProperty('--mx', `${x * 100}%`);
    node.style.setProperty('--my', `${y * 100}%`);
    node.style.transform = `perspective(1100px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 5}deg) translateY(-4px)`;
  };

  const onPointerLeave = () => {
    const node = ref.current;
    if (!node) return;
    node.style.transform = '';
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`rwaq-tilt rwaq-spot rwaq-glass rwaq-bevel group relative flex flex-col overflow-hidden rounded-3xl p-6 hover:border-rwaq-gold/25 sm:p-7 ${className}`}
    >
      <div className="relative z-10 flex h-full flex-col">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-rwaq-gold/20 bg-rwaq-gold/[0.08] text-rwaq-gold transition-transform duration-500 group-hover:scale-110">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>

        <span className="mt-5 font-tech text-[10px] uppercase tracking-[0.2em] text-rwaq-gold/70">
          {feature.tagEn}
        </span>
        <h3 className="mt-2 text-xl font-bold leading-snug text-rwaq-ink">{feature.titleAr}</h3>
        <p className="mt-3 text-[15px] leading-[1.85] text-rwaq-ink-muted">{feature.bodyAr}</p>

        {children}

        <ul className="mt-auto flex flex-wrap gap-2 pt-6">
          {feature.metrics.map((metric) => (
            <li
              key={metric.labelAr}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2"
            >
              <span className="block text-sm font-medium text-rwaq-ink">{metric.valueAr}</span>
              <span className="block text-[11px] text-rwaq-ink-faint">{metric.labelAr}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function FeaturesBento() {
  const [engine, catalog, ar, exportPdf] = FEATURES;

  return (
    <section id="features" className="relative scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="max-w-2xl">
          <span className="font-tech text-[11px] uppercase tracking-[0.24em] text-rwaq-gold/80">
            Platform Capabilities
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-snug text-rwaq-ink sm:text-4xl lg:text-[42px]">
            منظومة متكاملة من التخيّل حتى أمر الشراء
          </h2>
          <p className="mt-4 text-base leading-[1.85] text-rwaq-ink-muted">
            أربعة محركات تعمل معاً: توزيع فراغي دقيق، مطابقة فورية للموردين المحليين، معاينة واقعية
            في مكانك، وتصدير جاهز للعميل.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Spatial engine — wide cell carrying the morph loop */}
          <Reveal className="lg:col-span-2" delay={0}>
            <BentoCard feature={engine} className="h-full">
              <div className="relative mt-6 h-44 overflow-hidden rounded-2xl border border-white/[0.08] sm:h-52">
                <AmbientVideo
                  sources={morphSources}
                  fallback={<BlueprintScene />}
                  playbackRate={0.85}
                  crossfade={0.8}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-rwaq-slate/80 via-transparent to-transparent"
                />
                <span className="absolute bottom-3 left-3 rounded-pill border border-white/10 bg-rwaq-slate/70 px-2.5 py-1 font-tech text-[10px] uppercase tracking-[0.14em] text-rwaq-ink-muted backdrop-blur-md">
                  wireframe → render
                </span>
              </div>
            </BentoCard>
          </Reveal>

          {/* Supplier catalog */}
          <Reveal delay={90}>
            <BentoCard feature={catalog} className="h-full">
              <ul className="mt-6 space-y-2">
                {[
                  { brand: 'IKEA', ar: 'إيكيا' },
                  { brand: 'Abyat', ar: 'أبيات' },
                  { brand: 'West Elm', ar: 'وست إلم' },
                ].map((supplier) => (
                  <li
                    key={supplier.brand}
                    className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5"
                  >
                    <span className="text-[13px] text-rwaq-ink">{supplier.ar}</span>
                    <span className="font-tech text-[11px] tracking-wide text-rwaq-ink-faint">
                      {supplier.brand}
                    </span>
                  </li>
                ))}
              </ul>
            </BentoCard>
          </Reveal>

          {/* AR preview */}
          <Reveal delay={140}>
            <BentoCard feature={ar} className="h-full">
              <div className="relative mt-6 flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-rwaq-slate-deep/60">
                <div className="rwaq-blueprint absolute inset-0 opacity-50" aria-hidden="true" />
                {/* Stylised QR / scan target */}
                <div className="relative grid h-16 w-16 grid-cols-3 grid-rows-3 gap-1" aria-hidden="true">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <span
                      key={index}
                      className={`rounded-[3px] ${
                        [0, 2, 4, 6, 8].includes(index) ? 'bg-rwaq-gold/70' : 'bg-rwaq-gold/20'
                      }`}
                    />
                  ))}
                </div>
                <div
                  aria-hidden="true"
                  className="absolute inset-x-6 top-0 h-8 motion-safe:animate-[rwaq-scan_3.4s_linear_infinite] motion-reduce:hidden"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent, rgba(232,196,136,0.45), transparent)',
                  }}
                />
              </div>
            </BentoCard>
          </Reveal>

          {/* PDF export — wide */}
          <Reveal className="md:col-span-2" delay={190}>
            <BentoCard feature={exportPdf} className="h-full">
              <div className="mt-6 flex items-end gap-3" aria-hidden="true">
                {/* Stylised export sheet */}
                <div className="relative h-28 w-20 shrink-0 rounded-lg border border-white/12 bg-white/[0.05] p-2 transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-3deg]">
                  <span className="block h-1 w-8 rounded-pill bg-rwaq-gold/70" />
                  <span className="mt-2 block h-px w-full bg-white/12" />
                  <span className="mt-1.5 block h-px w-3/4 bg-white/10" />
                  <span className="mt-1.5 block h-px w-5/6 bg-white/10" />
                  <span className="mt-3 block h-8 w-full rounded border border-rwaq-gold/25 bg-rwaq-gold/[0.08]" />
                </div>
                <div className="flex-1 space-y-2">
                  {['المخطط الفراغي', 'جدول الكميات', 'عرض السعر النهائي'].map((line, index) => (
                    <div
                      key={line}
                      className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2"
                      style={{ opacity: 1 - index * 0.16 }}
                    >
                      <span className="h-1.5 w-1.5 rounded-pill bg-rwaq-gold/70" />
                      <span className="text-[13px] text-rwaq-ink-muted">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </BentoCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
