'use client';

import { useEffect, useRef, useState } from 'react';
import { STATS, type Stat } from '@/lib/landing-data';
import { useCountUp } from '@/lib/useCountUp';

function StatFigure({ stat, active }: { stat: Stat; active: boolean }) {
  const value = useCountUp(stat.value, active, 1900);

  return (
    <div className="relative px-2 py-6 text-center sm:py-8">
      <p className="font-tech text-4xl font-semibold tracking-tight text-rwaq-ink sm:text-5xl lg:text-[56px]">
        <span className="rwaq-gold-text">
          {stat.prefix}
          {value.toLocaleString('en-US')}
          {stat.suffix}
        </span>
      </p>
      <p className="mt-3 text-[15px] text-rwaq-ink-muted">{stat.labelAr}</p>
      <p className="mt-1 font-tech text-[10px] uppercase tracking-[0.2em] text-rwaq-ink-faint">
        {stat.noteEn}
      </p>
    </div>
  );
}

export default function StatsBand() {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      const timer = setTimeout(() => setActive(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="stats"
      className="relative scroll-mt-24 overflow-hidden px-5 py-16 sm:px-8 lg:px-12 lg:py-20"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(70% 80% at 50% 50%, rgba(232,196,136,0.07), transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-[1180px]">
        <div className="rwaq-glass rwaq-bevel grid grid-cols-1 divide-y divide-white/[0.07] rounded-3xl sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:rtl:divide-x-reverse">
          {STATS.map((stat) => (
            <StatFigure key={stat.labelAr} stat={stat} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
