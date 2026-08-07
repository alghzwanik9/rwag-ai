'use client';

import { useRef, useState } from 'react';
import { MATERIALS, STYLES, type MaterialId } from '@/lib/landing-data';
import Reveal from './Reveal';

export default function StyleShowcase() {
  const [styleIndex, setStyleIndex] = useState(0);
  const [materialId, setMaterialId] = useState<MaterialId>(STYLES[0].materials[0]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const style = STYLES[styleIndex];
  const material = MATERIALS.find((item) => item.id === materialId) ?? MATERIALS[0];

  /** Choosing a style also previews that style's signature material. */
  const selectStyle = (index: number) => {
    setStyleIndex(index);
    setMaterialId(STYLES[index].materials[0]);
  };

  /**
   * Roving focus across the tab list. Arrow directions are mirrored for RTL:
   * the list starts on the right, so ArrowLeft advances.
   */
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const last = STYLES.length - 1;
    let next: number | null = null;

    if (event.key === 'ArrowLeft') next = styleIndex === last ? 0 : styleIndex + 1;
    else if (event.key === 'ArrowRight') next = styleIndex === 0 ? last : styleIndex - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;

    if (next === null) return;
    event.preventDefault();
    selectStyle(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="styles" className="relative scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="max-w-2xl">
          <span className="font-tech text-[11px] uppercase tracking-[0.24em] text-rwaq-gold/80">
            Style & Material Library
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-snug text-rwaq-ink sm:text-4xl lg:text-[42px]">
            مكتبة الأنماط والخامات
          </h2>
          <p className="mt-4 text-base leading-[1.85] text-rwaq-ink-muted">
            اختر النمط الذي يناسب مساحتك واستعرض لوحته اللونية وخاماته المميزة — يطبّق رواق النمط
            على كل قطعة في المشهد فوراً.
          </p>
        </Reveal>

        {/* Style tabs */}
        <Reveal delay={90} className="mt-10">
          <div
            role="tablist"
            aria-label="أنماط التصميم"
            className="flex flex-wrap gap-2"
          >
            {STYLES.map((item, index) => {
              const selected = index === styleIndex;
              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  role="tab"
                  id={`rwaq-style-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`rwaq-style-panel-${item.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectStyle(index)}
                  onKeyDown={onTabKeyDown}
                  className={`rounded-pill border px-4 py-2.5 text-[14px] transition-all duration-300 sm:px-5 ${
                    selected
                      ? 'border-rwaq-gold/50 bg-rwaq-gold/[0.10] text-rwaq-gold'
                      : 'border-white/10 bg-white/[0.03] text-rwaq-ink-muted hover:border-white/20 hover:text-rwaq-ink'
                  }`}
                >
                  <span>{item.nameAr}</span>
                  <span className="ms-2 font-tech text-[10px] uppercase tracking-[0.14em] opacity-60">
                    {item.nameEn}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Panel */}
        <Reveal delay={140} className="mt-6">
          <div
            role="tabpanel"
            id={`rwaq-style-panel-${style.id}`}
            aria-labelledby={`rwaq-style-tab-${style.id}`}
            tabIndex={0}
            className="rwaq-glass-deep rwaq-bevel grid gap-6 rounded-3xl p-5 sm:p-7 lg:grid-cols-[1fr_1.05fr]"
          >
            {/* Narrative + palette */}
            <div key={style.id} className="motion-safe:animate-[rwaq-fade-up_0.5s_var(--rwaq-ease)]">
              <h3 className="text-2xl font-bold text-rwaq-ink">{style.nameAr}</h3>
              <p className="mt-1 font-tech text-[11px] uppercase tracking-[0.18em] text-rwaq-gold/70">
                {style.signatureAr}
              </p>
              <p className="mt-4 text-[15px] leading-[1.9] text-rwaq-ink-muted">{style.descAr}</p>

              <p className="mt-7 text-xs text-rwaq-ink-faint">اللوحة اللونية</p>
              <ul className="mt-3 grid grid-cols-4 gap-2.5">
                {style.palette.map((swatch) => (
                  <li key={swatch.hex}>
                    <span
                      className="block h-16 rounded-xl border border-white/12 shadow-inner sm:h-20"
                      style={{ backgroundColor: swatch.hex }}
                      role="img"
                      aria-label={`${swatch.nameAr} ${swatch.hex}`}
                    />
                    <span className="mt-1.5 block truncate text-center text-[11px] text-rwaq-ink-muted">
                      {swatch.nameAr}
                    </span>
                    {/* dir="ltr" stops the leading "#" being reordered by bidi. */}
                    <span
                      dir="ltr"
                      className="block text-center font-tech text-[9px] tracking-wide text-rwaq-ink-faint"
                    >
                      {swatch.hex}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Material study */}
            <div>
              <div className="relative h-52 overflow-hidden rounded-2xl border border-white/12 sm:h-64">
                <div
                  key={material.id}
                  className="absolute inset-0 motion-safe:animate-[rwaq-fade-up_0.45s_var(--rwaq-ease)]"
                  style={{ backgroundImage: material.css, backgroundSize: 'cover' }}
                  role="img"
                  aria-label={`معاينة خامة ${material.nameAr}`}
                />
                {/* Studio lighting over the sample */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(72% 60% at 26% 18%, rgba(255,255,255,0.34), transparent 58%), linear-gradient(200deg, transparent 45%, rgba(9,11,15,0.55) 100%)',
                  }}
                />
                <div className="absolute bottom-3 right-3 rounded-xl border border-white/15 bg-rwaq-slate/75 px-3 py-2 backdrop-blur-md">
                  <p className="text-[13px] text-rwaq-ink">{material.nameAr}</p>
                  <p className="font-tech text-[10px] uppercase tracking-[0.14em] text-rwaq-ink-faint">
                    {material.nameEn} · {material.finishAr}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs text-rwaq-ink-faint">الخامات والتشطيبات</p>
              <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {MATERIALS.map((item) => {
                  const selected = item.id === material.id;
                  const inStyle = style.materials.includes(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setMaterialId(item.id)}
                        aria-pressed={selected}
                        className={`group w-full rounded-xl border p-2 text-right transition-all duration-300 ${
                          selected
                            ? 'border-rwaq-gold/55 bg-rwaq-gold/[0.08]'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                        }`}
                      >
                        <span
                          className="block h-12 rounded-lg border border-white/12 transition-transform duration-500 group-hover:scale-[1.03]"
                          style={{ backgroundImage: item.css, backgroundSize: 'cover' }}
                        />
                        <span className="mt-2 flex items-center gap-1.5">
                          {inStyle && (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-pill bg-rwaq-gold"
                              aria-label="خامة مميّزة لهذا النمط"
                            />
                          )}
                          <span className="block truncate text-[12px] text-rwaq-ink">{item.nameAr}</span>
                        </span>
                        <span className="mt-0.5 block truncate font-tech text-[9px] uppercase tracking-[0.12em] text-rwaq-ink-faint">
                          {item.nameEn}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
