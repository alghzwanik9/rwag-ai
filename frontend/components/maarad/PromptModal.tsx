'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MaaradRoom } from '@/lib/maaradRooms';

interface PromptModalProps {
  room: MaaradRoom | null;
  onClose: () => void;
}

export default function PromptModal({ room, onClose }: PromptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(room.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-modal-title"
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
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </span>
            <div>
              <h2 id="prompt-modal-title" className="text-lg font-bold text-rwaq-ink">
                برومبت الذكاء الاصطناعي التوليدي
              </h2>
              <p className="text-xs text-rwaq-ink-muted">
                {room.title}
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
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Prompt Box */}
          <div className="relative rounded-2xl border border-rwaq-gold/25 bg-[#0A0D14] p-4 text-sm leading-relaxed text-rwaq-ink font-mono">
            <p className="font-sans leading-7 text-rwaq-ink select-all">
              {room.prompt}
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-[11px] text-rwaq-ink-faint">
                جاهز للتغذية في نموذج التوليد الفراغي
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rwaq-gold/30 bg-rwaq-gold/10 px-3 py-1.5 text-xs font-medium text-rwaq-gold hover:bg-rwaq-gold/20 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ النص'}</span>
              </button>
            </div>
          </div>

          {/* Architectural Design Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
              <div className="text-[11px] font-medium text-rwaq-ink-faint mb-1">النمط والطابع</div>
              <div className="text-sm font-semibold text-rwaq-ink">{room.style}</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
              <div className="text-[11px] font-medium text-rwaq-ink-faint mb-1">توزيع الإضاءة</div>
              <div className="text-sm font-semibold text-rwaq-ink">{room.lighting}</div>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <div className="text-xs font-medium text-rwaq-ink-muted mb-2.5">
              الباليت اللونية المعتمدة في التصميم
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {room.palette.map((color) => (
                <div
                  key={color.hex}
                  className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-2"
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-lg border border-white/20 shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="overflow-hidden">
                    <div className="text-xs font-medium text-rwaq-ink truncate">{color.name}</div>
                    <div className="text-[10px] text-rwaq-ink-faint font-mono uppercase">{color.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-white/[0.02]">
          <span className="text-xs text-rwaq-ink-muted">
            المساحة: {room.dimensions.area} م² • {room.items.length} قطع أثاث
          </span>
          <div className="flex items-center gap-3">
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
              <span>فتح وتعديل في الاستوديو 3D</span>
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
