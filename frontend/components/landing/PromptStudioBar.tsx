'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, LayoutGrid, LoaderCircle, Sparkles, Wallet } from 'lucide-react';
import { DEMO_SCENARIOS, scenarioTotal, type DemoScenario, type PlanShape } from '@/lib/landing-data';
import Reveal from './Reveal';

/** Simulated agent pipeline shown while the demo "generates". */
const STAGES = [
  { id: 'parse', labelAr: 'تحليل الوصف واستخراج النمط', tagEn: 'Prompt parsing' },
  { id: 'solve', labelAr: 'توزيع القطع وضبط ممرات الحركة', tagEn: 'Spatial solve' },
  { id: 'match', labelAr: 'مطابقة الموردين وتسعير الميزانية', tagEn: 'RAG catalog match' },
] as const;

const STAGE_MS = 620;

/** Arabic keyword hints that steer a free-text prompt to the closest sample. */
const KEYWORDS: Record<string, string[]> = {
  'modern-navy': ['مودرن', 'معيشة', 'صالة', 'كنبة', 'كحلي', 'أريكة', 'حديث'],
  'japandi-bedroom': ['نوم', 'ياباندي', 'ترابي', 'سرير', 'هادئ', 'خافت'],
  'home-office': ['مكتب', 'عمل', 'دراسة', 'رفوف', 'مكتبي'],
  majlis: ['مجلس', 'ضيافة', 'ذهبي', 'أرضي', 'عربي', 'قهوة'],
};

function pickScenario(text: string): DemoScenario {
  const normalized = text.trim();
  if (!normalized) return DEMO_SCENARIOS[0];

  let best = DEMO_SCENARIOS[0];
  let bestScore = 0;

  for (const scenario of DEMO_SCENARIOS) {
    const score = (KEYWORDS[scenario.id] ?? []).reduce(
      (total, word) => (normalized.includes(word) ? total + 1 : total),
      0,
    );
    if (score > bestScore) {
      best = scenario;
      bestScore = score;
    }
  }

  return best;
}

const TONE_FILL: Record<PlanShape['tone'], string> = {
  anchor: 'rgba(232,196,136,0.20)',
  soft: 'rgba(164,142,116,0.13)',
  accent: 'rgba(232,196,136,0.34)',
};

const TONE_STROKE: Record<PlanShape['tone'], string> = {
  anchor: 'rgba(232,196,136,0.75)',
  soft: 'rgba(164,142,116,0.55)',
  accent: 'rgba(232,196,136,0.95)',
};

/** Generated 2D layout: normalised plan shapes over a blueprint grid. */
function FloorPlan({ scenario }: { scenario: DemoScenario }) {
  return (
    <svg
      viewBox="-6 -6 112 112"
      className="h-full w-full"
      role="img"
      aria-label={`مخطط ${scenario.roomAr} بأبعاد ${scenario.dims.w} في ${scenario.dims.d} متر`}
    >
      <defs>
        <pattern id="rwaq-plan-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0 H0 V10" fill="none" stroke="rgba(232,196,136,0.10)" strokeWidth="0.4" />
        </pattern>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill="url(#rwaq-plan-grid)" />
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill="none"
        stroke="rgba(232,196,136,0.55)"
        strokeWidth="1"
      />

      {/* Door swing on the entry wall */}
      <path
        d="M0 82 A18 18 0 0 0 18 100"
        fill="none"
        stroke="rgba(232,196,136,0.4)"
        strokeWidth="0.6"
        strokeDasharray="2 2"
      />

      {scenario.plan.map((shape, index) => (
        <g
          key={`${shape.label}-${index}`}
          className="motion-safe:animate-[rwaq-fade-up_0.5s_var(--rwaq-ease)_backwards]"
          style={{ animationDelay: `${index * 90}ms` }}
        >
          <rect
            x={shape.x}
            y={shape.y}
            width={shape.w}
            height={shape.h}
            rx="1.5"
            fill={TONE_FILL[shape.tone]}
            stroke={TONE_STROKE[shape.tone]}
            strokeWidth="0.6"
          />
          {shape.w >= 18 && shape.h >= 10 && (
            <text
              x={shape.x + shape.w / 2}
              y={shape.y + shape.h / 2 + 1.6}
              textAnchor="middle"
              fontSize="4"
              fill="rgba(245,247,250,0.72)"
            >
              {shape.label}
            </text>
          )}
        </g>
      ))}

      {/* Dimension witness lines */}
      <g stroke="rgba(232,196,136,0.45)" strokeWidth="0.35" fill="none">
        <path d="M0 -3 H100" />
        <path d="M-3 0 V100" />
      </g>
      {/* Dimension labels are forced LTR so bidi does not flip "5.0 m". */}
      <text
        x="50"
        y="-4.5"
        textAnchor="middle"
        fontSize="4"
        fill="rgba(232,196,136,0.75)"
        className="font-tech"
        style={{ direction: 'ltr' }}
      >
        {scenario.dims.w.toFixed(1)} m
      </text>
      <text
        x="-4.5"
        y="50"
        textAnchor="middle"
        fontSize="4"
        fill="rgba(232,196,136,0.75)"
        className="font-tech"
        style={{ direction: 'ltr' }}
        transform="rotate(-90 -4.5 50)"
      >
        {scenario.dims.d.toFixed(1)} m
      </text>
    </svg>
  );
}

export default function PromptStudioBar() {
  const [value, setValue] = useState('');
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [stage, setStage] = useState(0);
  const [scenario, setScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const run = useCallback(
    (prompt: string) => {
      clearTimers();
      const picked = pickScenario(prompt);

      setScenario(picked);
      setPhase('running');
      setStage(0);

      STAGES.forEach((_, index) => {
        timersRef.current.push(
          window.setTimeout(() => setStage(index), index * STAGE_MS),
        );
      });

      timersRef.current.push(
        window.setTimeout(() => setPhase('done'), STAGES.length * STAGE_MS),
      );
    },
    [clearTimers],
  );

  const total = useMemo(() => scenarioTotal(scenario), [scenario]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    run(value);
  };

  return (
    <section id="studio-2d" className="relative scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="text-center">
          <span className="font-tech text-[11px] uppercase tracking-[0.24em] text-rwaq-gold/80">
            Live Generation
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-snug text-rwaq-ink sm:text-4xl lg:text-[42px]">
            اكتب وصف مساحتك، وشاهد التوزيع يتشكّل
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-[1.85] text-rwaq-ink-muted">
            جرّب المحرك مباشرة من هنا — صف الغرفة بالعربية أو اختر مثالاً جاهزاً، وسيعرض لك رواق
            مخطط التوزيع، قائمة الأثاث المطابقة، والتكلفة التقديرية بالريال السعودي.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-12">
          <div className="rwaq-glass-deep rwaq-bevel rwaq-grain relative overflow-hidden rounded-3xl p-5 sm:p-7">
            {/* Prompt input */}
            <form onSubmit={onSubmit}>
              <label htmlFor="rwaq-demo-prompt" className="sr-only">
                وصف المساحة المطلوب تصميمها
              </label>
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-rwaq-slate/60 p-2.5 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3 px-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-rwaq-gold" aria-hidden="true" />
                  <input
                    id="rwaq-demo-prompt"
                    type="text"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="مثال: غرفة معيشة بأسلوب مودرن مع كنبة كحلية"
                    className="w-full border-0 bg-transparent py-3 text-[15px] text-rwaq-ink placeholder:text-rwaq-ink-faint focus:outline-none focus:ring-0"
                  />
                </div>
                <button
                  type="submit"
                  disabled={phase === 'running'}
                  className="rwaq-cta shrink-0 justify-center disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {phase === 'running' ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>جارٍ التوليد</span>
                    </>
                  ) : (
                    <>
                      <span>ولّد التصميم</span>
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Example prompts */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-rwaq-ink-faint">جرّب:</span>
              {DEMO_SCENARIOS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setValue(item.promptAr);
                    run(item.promptAr);
                  }}
                  className={`rounded-pill border px-3 py-1.5 text-[13px] transition-all duration-300 ${
                    scenario.id === item.id && phase !== 'idle'
                      ? 'border-rwaq-gold/50 bg-rwaq-gold/10 text-rwaq-gold'
                      : 'border-white/10 bg-white/[0.04] text-rwaq-ink-muted hover:border-white/20 hover:text-rwaq-ink'
                  }`}
                >
                  {item.promptAr}
                </button>
              ))}
            </div>

            {/* Pipeline status */}
            <div aria-live="polite" className="sr-only">
              {phase === 'running' && STAGES[stage]?.labelAr}
              {phase === 'done' &&
                `اكتمل التوليد. ${scenario.items.length} قطعة أثاث بتكلفة ${total.toLocaleString('en-US')} ريال سعودي.`}
            </div>

            {phase !== 'idle' && (
              <ol className="mt-6 grid gap-2.5 sm:grid-cols-3">
                {STAGES.map((item, index) => {
                  const active = phase === 'running' && index === stage;
                  const complete = phase === 'done' || index < stage;
                  return (
                    <li
                      key={item.id}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors duration-500 ${
                        complete
                          ? 'border-rwaq-gold/25 bg-rwaq-gold/[0.06]'
                          : active
                            ? 'border-white/15 bg-white/[0.05]'
                            : 'border-white/[0.06] bg-transparent'
                      }`}
                    >
                      {active ? (
                        <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin text-rwaq-gold" aria-hidden="true" />
                      ) : (
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 shrink-0 rounded-pill ${complete ? 'bg-rwaq-gold' : 'bg-rwaq-ink-faint/50'}`}
                        />
                      )}
                      <span className="min-w-0">
                        <span
                          className={`block truncate text-[13px] ${complete || active ? 'text-rwaq-ink' : 'text-rwaq-ink-faint'}`}
                        >
                          {item.labelAr}
                        </span>
                        <span className="block font-tech text-[10px] uppercase tracking-[0.14em] text-rwaq-ink-faint">
                          {item.tagEn}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* Result */}
            {phase === 'done' && (
              <div
                key={scenario.id}
                className="mt-6 grid gap-5 motion-safe:animate-[rwaq-fade-up_0.6s_var(--rwaq-ease)] lg:grid-cols-[0.92fr_1.08fr]"
              >
                {/* Layout */}
                <div className="rounded-2xl border border-white/[0.08] bg-rwaq-slate-deep/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-xs text-rwaq-ink-muted">
                      <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                      مخطط التوزيع — {scenario.roomAr}
                    </span>
                    <span className="font-tech text-[10px] uppercase tracking-[0.14em] text-rwaq-ink-faint">
                      2D Plan
                    </span>
                  </div>
                  <div className="aspect-square w-full">
                    <FloorPlan scenario={scenario} />
                  </div>
                  <p className="mt-3 border-t border-white/[0.07] pt-3 text-[13px] leading-relaxed text-rwaq-ink-muted">
                    {scenario.insightAr}
                  </p>
                </div>

                {/* Catalog */}
                <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-rwaq-slate-deep/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-rwaq-ink-muted">قائمة الأثاث المطابقة</span>
                    <span className="font-tech text-[10px] uppercase tracking-[0.14em] text-rwaq-ink-faint">
                      Supplier match
                    </span>
                  </div>

                  <ul className="flex-1 divide-y divide-white/[0.06]">
                    {scenario.items.map((item, index) => (
                      <li
                        key={item.sku}
                        className="flex items-center justify-between gap-3 py-2.5 motion-safe:animate-[rwaq-fade-up_0.45s_var(--rwaq-ease)_backwards]"
                        style={{ animationDelay: `${index * 70}ms` }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14px] text-rwaq-ink">{item.nameAr}</p>
                          <p className="mt-0.5 flex items-center gap-2">
                            <span className="rounded-pill border border-white/10 bg-white/[0.05] px-1.5 py-px text-[10px] text-rwaq-ink-muted">
                              {item.brand}
                            </span>
                            <span className="font-tech text-[10px] tracking-wide text-rwaq-ink-faint">
                              {item.sku}
                            </span>
                          </p>
                        </div>
                        <span className="shrink-0 font-tech text-sm text-rwaq-ink">
                          {item.price.toLocaleString('en-US')}
                          <span className="ms-1 text-[11px] text-rwaq-ink-faint">ر.س</span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Palette + total */}
                  <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-4">
                    {scenario.paletteHex.map((hex) => (
                      <span
                        key={hex}
                        className="h-6 w-6 rounded-lg border border-white/12"
                        style={{ backgroundColor: hex }}
                        role="img"
                        aria-label={hex}
                      />
                    ))}
                    <span className="ms-auto inline-flex items-center gap-2 rounded-xl border border-rwaq-gold/25 bg-rwaq-gold/[0.07] px-3 py-2">
                      <Wallet className="h-3.5 w-3.5 text-rwaq-gold" aria-hidden="true" />
                      <span className="text-[11px] text-rwaq-ink-muted">الإجمالي</span>
                      <span className="font-tech text-base font-medium text-rwaq-gold">
                        {total.toLocaleString('en-US')}
                        <span className="ms-1 text-[11px]">ر.س</span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
