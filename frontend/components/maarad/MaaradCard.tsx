'use client';

import React from 'react';
import Link from 'next/link';
import { MaaradRoom } from '@/lib/maaradRooms';

interface MaaradCardProps {
  room: MaaradRoom;
  onViewPrompt: (room: MaaradRoom) => void;
  onViewItems: (room: MaaradRoom) => void;
}

export default function MaaradCard({ room, onViewPrompt, onViewItems }: MaaradCardProps) {
  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#121620]/90 transition-all duration-300 hover:border-rwaq-gold/40 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1"
      dir="rtl"
    >
      {/* Visual Canvas / Architectural Header */}
      <div className={`relative h-48 w-full overflow-hidden bg-gradient-to-br ${room.visualTheme.accentGradient} p-5 flex flex-col justify-between`}>
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"
        />

        {/* Ambient Glow */}
        <div
          className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl pointer-events-none transition-transform duration-500 group-hover:scale-150"
          style={{ background: room.visualTheme.glowColor }}
        />

        {/* Badges Top Bar */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md border ${room.visualTheme.badgeBg}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {room.categoryLabel}
          </span>

          <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-mono text-rwaq-ink backdrop-blur-md">
            {room.dimensions.area} م²
          </span>
        </div>

        {/* Bottom Specs in Header */}
        <div className="relative z-10 flex items-end justify-between">
          <div>
            <span className="text-[11px] font-tech uppercase tracking-wider text-white/70 block mb-0.5">
              {room.styleTag}
            </span>
            <h3 className="text-xl font-bold text-white tracking-wide">
              {room.title}
            </h3>
          </div>

          <div className="text-left">
            <span className="text-[10px] text-white/60 block">الميزانية التقديرية</span>
            <span className="font-mono text-base font-bold text-rwaq-gold">
              {room.estimatedCost.toLocaleString('ar-SA')} <span className="text-xs font-sans font-normal text-white/80">ر.س</span>
            </span>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        {/* Description */}
        <p className="text-xs leading-relaxed text-rwaq-ink-muted line-clamp-2">
          {room.description}
        </p>

        {/* Architectural Specs Row */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
          <div>
            <span className="text-[10px] text-rwaq-ink-faint block">الأبعاد</span>
            <span className="text-xs font-semibold text-rwaq-ink font-mono">
              {room.dimensions.width} × {room.dimensions.depth} م
            </span>
          </div>
          <div>
            <span className="text-[10px] text-rwaq-ink-faint block">الارتفاع</span>
            <span className="text-xs font-semibold text-rwaq-ink font-mono">
              {room.dimensions.height} م
            </span>
          </div>
          <div>
            <span className="text-[10px] text-rwaq-ink-faint block">القطع</span>
            <span className="text-xs font-semibold text-rwaq-ink font-mono">
              {room.items.length} قطع
            </span>
          </div>
        </div>

        {/* Color Palette Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-rwaq-ink-faint ml-1">الباليت:</span>
            {room.palette.map((c) => (
              <span
                key={c.hex}
                title={`${c.name} (${c.hex})`}
                className="h-4 w-4 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-125 cursor-help"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-rwaq-ink-muted">
            <span className="material-symbols-outlined text-[14px] text-rwaq-gold">wb_sunny</span>
            <span>{room.ambientMode === 'morning' ? 'صباحي' : room.ambientMode === 'rainy' ? 'ماطر' : 'مسائي'}</span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <Link
            href={`/studio?preset=${room.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rwaq-gold/15 border border-rwaq-gold/30 px-3.5 py-2.5 text-xs font-bold text-rwaq-gold hover:bg-rwaq-gold hover:text-[#0E1015] transition-all shadow-sm active:scale-95"
          >
            <span>عدّل في الاستوديو 3D</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>

          <button
            type="button"
            onClick={() => onViewPrompt(room)}
            title="عرض برومبت الذكاء الاصطناعي"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-rwaq-ink hover:bg-white/10 hover:border-rwaq-gold/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px] text-rwaq-gold">auto_awesome</span>
          </button>

          <button
            type="button"
            onClick={() => onViewItems(room)}
            title="عرض قائمة الأثاث والتكلفة"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-rwaq-ink hover:bg-white/10 hover:border-rwaq-gold/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">inventory_2</span>
          </button>
        </div>
      </div>
    </article>
  );
}
