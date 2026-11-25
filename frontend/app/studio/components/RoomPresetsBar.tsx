"use client";

import React, { useState } from "react";

export interface RoomPresetsBarProps {
  activePresetId?: string | null;
  activeShape: "single" | "corridor_room" | "open_plan" | "l_shape";
  onSelectPreset: (presetId: string) => void;
  onSelectShape: (shape: "single" | "corridor_room" | "open_plan" | "l_shape") => void;
  onResetEmpty: () => void;
  onOpenInspiration: () => void;
}

const PRESETS = [
  {
    id: "majlis-andalus",
    title: "مجلس أندلسي",
    icon: "weekend",
    desc: "6.2×4.8م • كنب ملكي وذهب معتق",
    badge: "الأكثر طلباً",
  },
  {
    id: "living-japandi",
    title: "صالة ياباندي",
    icon: "chair",
    desc: "5.5×4.2م • هدوء وبساطة خشبية",
    badge: "عصري",
  },
  {
    id: "bedroom-serenity",
    title: "جناح ماستر",
    icon: "bed",
    desc: "5.0×4.0م • استرخاء وألوان دافئة",
    badge: "فندقي",
  },
  {
    id: "office-exec",
    title: "مكتب تنفيذي",
    icon: "desk",
    desc: "4.5×3.8م • تركيز وأناقة عملية",
    badge: "أعمال",
  },
  {
    id: "studio-minimalist",
    title: "استوديو مفتوح",
    icon: "yard",
    desc: "6.0×4.8م • مساحة مرنة",
    badge: "بسيط",
  },
];

const SHAPES = [
  { id: "single" as const, title: "مستطيل قياسي", icon: "crop_portrait" },
  { id: "l_shape" as const, title: "شكل زاوية L", icon: "turn_sharp_right" },
  { id: "open_plan" as const, title: "صالة ومطبخ مفتوح", icon: "countertops" },
];

export default function RoomPresetsBar({
  activePresetId,
  activeShape,
  onSelectPreset,
  onSelectShape,
  onResetEmpty,
  onOpenInspiration,
}: RoomPresetsBarProps) {
  const [tab, setTab] = useState<"templates" | "shapes">("templates");

  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-2xl bg-surface/90 border border-outline-variant/60 p-1.5 shadow-2xl backdrop-blur-xl max-w-[calc(100vw-32px)] overflow-x-auto scrollbar-none transition-all duration-200"
      dir="rtl"
    >
      {/* Mode Switcher Tabs */}
      <div className="flex items-center rounded-xl bg-surface-container-high/60 p-0.5 shrink-0">
        <button
          onClick={() => setTab("templates")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
            tab === "templates"
              ? "bg-surface text-primary shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
          <span>تصاميم جاهزة</span>
        </button>
        <button
          onClick={() => setTab("shapes")}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
            tab === "shapes"
              ? "bg-surface text-primary shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">architecture</span>
          <span>أشكال الغرفة</span>
        </button>
      </div>

      <div className="h-4 w-px bg-outline-variant/50 shrink-0 mx-0.5" />

      {/* Templates Tab */}
      {tab === "templates" ? (
        <div className="flex items-center gap-1 shrink-0">
          {PRESETS.map((p) => {
            const isActive = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p.id)}
                className={`group flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 border ${
                  isActive
                    ? "bg-primary text-on-primary border-primary shadow-xs font-bold"
                    : "bg-surface-container-low/70 hover:bg-surface-container border-transparent text-on-surface hover:border-outline-variant/40"
                }`}
                title={p.desc}
              >
                <span className="material-symbols-outlined text-[16px] opacity-85">
                  {p.icon}
                </span>
                <span>{p.title}</span>
                {p.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                      isActive
                        ? "bg-on-primary/20 text-on-primary"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {p.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Shapes Tab */
        <div className="flex items-center gap-1 shrink-0">
          {SHAPES.map((s) => {
            const isActive = activeShape === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectShape(s.id)}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0 border ${
                  isActive
                    ? "bg-primary text-on-primary border-primary shadow-xs font-bold"
                    : "bg-surface-container-low/70 hover:bg-surface-container border-transparent text-on-surface hover:border-outline-variant/40"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {s.icon}
                </span>
                <span>{s.title}</span>
              </button>
            );
          })}

          <button
            onClick={onResetEmpty}
            className="flex items-center gap-1 rounded-xl bg-surface-container-low/70 hover:bg-error/10 hover:text-error border border-transparent hover:border-error/30 px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant transition-all shrink-0"
            title="إفراغ الغرفة والبدء بمخطط جديد تماماً"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>تفريغ الغرفة</span>
          </button>
        </div>
      )}

      <div className="h-4 w-px bg-outline-variant/50 shrink-0 mx-0.5" />

      {/* Inspiration References Button */}
      <button
        onClick={onOpenInspiration}
        className="flex items-center gap-1.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 px-2.5 py-1 text-[11px] font-bold text-secondary transition-all shrink-0 shadow-xs"
        title="استعراض مراجع الإلهام والأنماط المعمارية السعودية"
      >
        <span className="material-symbols-outlined text-[15px]">palette</span>
        <span>مراجع الإلهام</span>
      </button>
    </div>
  );
}
