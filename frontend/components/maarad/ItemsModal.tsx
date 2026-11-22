'use client';

import React from 'react';
import Link from 'next/link';
import { MaaradRoom } from '@/lib/maaradRooms';

interface ItemsModalProps {
  room: MaaradRoom | null;
  onClose: () => void;
}

export default function ItemsModal({ room, onClose }: ItemsModalProps) {
  if (!room) return null;

  const totalCalculated = room.items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="items-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#121620] text-rwaq-ink shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rwaq-gold/15 text-rwaq-gold">
              <span className="material-symbols-outlined text-[20px]">chair</span>
            </span>
            <div>
              <h2 id="items-modal-title" className="text-lg font-bold text-rwaq-ink">
                قائمة الأثاث وتقدير التكلفة
              </h2>
              <p className="text-xs text-rwaq-ink-muted">
                {room.title} — {room.items.length} قطع مطابقة لموردين معتمدين
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-rwaq-ink-muted hover:bg-white/10 hover:text-rwaq-ink transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">
          {/* Summary Box */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rwaq-gold/20 bg-rwaq-gold/[0.04] p-4">
            <div>
              <div className="text-xs text-rwaq-ink-muted">إجمالي التكلفة التقديرية للأثاث</div>
              <div className="text-2xl font-bold text-rwaq-gold">
                {totalCalculated.toLocaleString('ar-SA')} <span className="text-sm font-normal">ر.س</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-rwaq-ink-muted">
              <span className="material-symbols-outlined text-[18px] text-rwaq-live">verified</span>
              <span>أسعار متطابقة مع كتالوجات السوق السعودي</span>
            </div>
          </div>

          {/* Items List */}
          <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.01]">
            {room.items.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center justify-between gap-4 p-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs text-rwaq-ink-muted">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-rwaq-ink">{item.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-rwaq-ink-faint">
                      <span className="inline-block rounded bg-white/5 px-1.5 py-0.5 font-medium text-rwaq-gold">
                        {item.brand}
                      </span>
                      <span>
                        المقاس: {(item.dimensions.width / 1000).toFixed(1)} × {(item.dimensions.depth / 1000).toFixed(1)} م
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left font-mono text-sm font-semibold text-rwaq-ink shrink-0">
                  {item.price > 0 ? (
                    <>
                      {item.price.toLocaleString('ar-SA')} <span className="text-[11px] font-sans font-normal text-rwaq-ink-muted">ر.س</span>
                    </>
                  ) : (
                    <span className="text-xs font-sans text-rwaq-ink-faint">مشمول بالمعمار</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-rwaq-ink-muted hover:text-rwaq-ink hover:bg-white/5 transition-colors"
          >
            إغلاق
          </button>
          <Link
            href={`/studio?preset=${room.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-rwaq-gold px-4 py-2 text-xs font-bold text-[#0E1015] hover:bg-rwaq-gold/90 transition-all shadow-md shadow-rwaq-gold/20 active:scale-95"
          >
            <span>استيراد وتعديل في الاستوديو 3D</span>
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
