'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { BRAND, PRICING } from '@/lib/landing-data';
import Reveal from './Reveal';

export default function PricingSection() {
  return (
    <section id="pricing" className="relative scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-tech text-[11px] uppercase tracking-[0.24em] text-rwaq-gold/80">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-snug text-rwaq-ink sm:text-4xl lg:text-[42px]">
            خطط تناسب كل مساحة
          </h2>
          <p className="mt-4 text-base leading-[1.85] text-rwaq-ink-muted">
            ابدأ مجاناً وارتقِ عندما تحتاج مشاريع أكثر وتصديراً احترافياً. جميع الأسعار بالريال
            السعودي.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
          {PRICING.map((tier, index) => (
            <Reveal key={tier.id} delay={index * 90} className="h-full">
              <div
                className={`relative flex h-full flex-col overflow-hidden rounded-3xl p-6 sm:p-7 ${
                  tier.featured
                    ? 'border border-rwaq-gold/35 bg-rwaq-gold/[0.05]'
                    : 'rwaq-glass rwaq-bevel'
                }`}
              >
                {tier.featured && (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 -z-10"
                      style={{
                        background:
                          'radial-gradient(90% 60% at 50% 0%, rgba(232,196,136,0.16), transparent 68%)',
                      }}
                    />
                    <span className="absolute left-5 top-5 rounded-pill bg-rwaq-gold px-2.5 py-1 font-tech text-[10px] font-semibold uppercase tracking-[0.14em] text-rwaq-slate">
                      Popular
                    </span>
                  </>
                )}

                <h3 className="text-xl font-bold text-rwaq-ink">{tier.nameAr}</h3>
                <p className="mt-2 min-h-[42px] text-[14px] leading-relaxed text-rwaq-ink-muted">
                  {tier.descAr}
                </p>

                <p className="mt-6 flex items-baseline gap-2">
                  {tier.priceSar === null ? (
                    <span className="text-3xl font-bold text-rwaq-ink">تسعير مخصّص</span>
                  ) : (
                    <>
                      <span className="font-tech text-4xl font-semibold text-rwaq-ink">
                        {tier.priceSar}
                      </span>
                      <span className="text-sm text-rwaq-gold">ر.س</span>
                    </>
                  )}
                  <span className="text-[13px] text-rwaq-ink-faint">/ {tier.periodAr}</span>
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {tier.featuresAr.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-pill border border-rwaq-gold/30 bg-rwaq-gold/10">
                        <Check className="h-2.5 w-2.5 text-rwaq-gold" aria-hidden="true" />
                      </span>
                      <span className="text-[14px] leading-relaxed text-rwaq-ink-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {tier.priceSar === null ? (
                    <a
                      href={`mailto:${BRAND.email}?subject=${encodeURIComponent('استفسار عن خطة الأعمال — رواق')}`}
                      className="inline-flex w-full items-center justify-center rounded-pill border border-white/15 bg-white/[0.04] px-5 py-3.5 text-[15px] text-rwaq-ink transition-colors duration-300 hover:border-white/30 hover:bg-white/[0.08]"
                    >
                      {tier.ctaAr}
                    </a>
                  ) : tier.featured ? (
                    <Link href="/studio" className="rwaq-cta w-full">
                      {tier.ctaAr}
                    </Link>
                  ) : (
                    <Link
                      href="/studio"
                      className="inline-flex w-full items-center justify-center rounded-pill border border-white/15 bg-white/[0.04] px-5 py-3.5 text-[15px] text-rwaq-ink transition-colors duration-300 hover:border-white/30 hover:bg-white/[0.08]"
                    >
                      {tier.ctaAr}
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
