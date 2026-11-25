"use client";

import React, { useState } from "react";
import Image from "next/image";

interface RenderComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  depthMapUrl?: string | null;
  roomStyle?: string;
  sourceNote?: string;
  promptUsed?: string;
}

export function RenderComparisonModal({
  isOpen,
  onClose,
  beforeImageUrl,
  afterImageUrl,
  depthMapUrl,
  roomStyle = "مودرن فاخر",
  sourceNote,
  promptUsed,
}: RenderComparisonModalProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [activeTab, setActiveTab] = useState<"slider" | "side_by_side" | "depth_pass">("slider");
  const [isCopied, setIsCopied] = useState(false);
  const [isEnvCopied, setIsEnvCopied] = useState(false);

  if (!isOpen || !afterImageUrl) return null;

  const isPreviewFallback = Boolean(
    sourceNote && (sourceNote.includes("FAL_KEY") || sourceNote.includes("معاينة تجريبية"))
  );

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyPrompt = () => {
    if (promptUsed) {
      navigator.clipboard.writeText(promptUsed);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const copyEnvLine = () => {
    navigator.clipboard.writeText("FAL_KEY=your_fal_api_key_here");
    setIsEnvCopied(true);
    setTimeout(() => setIsEnvCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-150 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in"
      dir="rtl"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#121620] shadow-2xl">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
              isPreviewFallback
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-rwaq-gold/15 text-rwaq-gold border-rwaq-gold/30"
            }`}>
              <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isPreviewFallback ? "معاينة إضاءة الاستوديو للمنظور" : "الرندرة الواقعية فائقة الجودة"}
                </h3>
                {isPreviewFallback ? (
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                    معاينة تجريبية (Studio Lighting)
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    8K Neural Render
                  </span>
                )}
                {depthMapUrl && (
                  <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">layers</span>
                    Depth-Guided 1:1
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {isPreviewFallback
                  ? "معاينة مطابقة هندسياً لأبعاد وأثاث المشهد 1:1 مع تطبيق مرشح إضاءة سينمائي عالي التباين"
                  : "مقارنة بين مسقط المنظور ثلاثي الأبعاد 3D وخريطة العمق الفراغي والرندرة السينمائية الواقعية"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("slider")}
                className={`rounded-lg px-3 py-1 font-bold transition-all ${
                  activeTab === "slider"
                    ? "bg-rwaq-gold text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                شريط المقارنة
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("side_by_side")}
                className={`rounded-lg px-3 py-1 font-bold transition-all ${
                  activeTab === "side_by_side"
                    ? "bg-rwaq-gold text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                جنباً إلى جنب
              </button>
              {depthMapUrl && (
                <button
                  type="button"
                  onClick={() => setActiveTab("depth_pass")}
                  className={`rounded-lg px-3 py-1 font-bold transition-all flex items-center gap-1 ${
                    activeTab === "depth_pass"
                      ? "bg-cyan-500 text-black shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">layers</span>
                  خريطة العمق (Depth)
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              title="إغلاق"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* ── Banner: Honest AI Fallback Notice & One-Click Copy ── */}
        {isPreviewFallback && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-400">info</span>
              <span>
                <strong>معاينة تجريبية:</strong> تم تطبيق مرشح إضاءة استوديو متقدم على لقطة المنظور الفعلية مع الحفاظ على الأثاث والأبعاد 1:1. لتفعيل الرندرة العصبية 8K، أضف مفتاح Fal.ai في ملف <code className="bg-amber-500/20 px-1.5 py-0.5 rounded font-mono text-amber-300">.env</code>.
              </span>
            </div>
            <button
              type="button"
              onClick={copyEnvLine}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1 text-[11px] font-bold text-amber-300 transition-all active:scale-95 shrink-0"
              title="نسخ سطر الإعداد إلى الحافظة"
            >
              <span className="material-symbols-outlined text-[15px]">
                {isEnvCopied ? "check" : "content_copy"}
              </span>
              <span>{isEnvCopied ? "تم النسخ!" : "نسخ: FAL_KEY=..."}</span>
            </button>
          </div>
        )}

        {/* Comparison Viewer Body */}
        <div className="relative flex-1 overflow-hidden bg-black/60 p-4 sm:p-6 flex items-center justify-center min-h-[420px]">
          {activeTab === "slider" && beforeImageUrl ? (
            /* Interactive Split-Screen Slider */
            <div
              className="relative aspect-video w-full max-w-4xl select-none overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = ((e.clientX - rect.left) / rect.width) * 100;
                setSliderPosition(Math.max(0, Math.min(100, pos)));
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                if (!touch) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = ((touch.clientX - rect.left) / rect.width) * 100;
                setSliderPosition(Math.max(0, Math.min(100, pos)));
              }}
            >
              {/* After (Render or Enhanced Preview) - Full Width Background */}
              <div className="absolute inset-0">
                <Image
                  src={afterImageUrl}
                  alt={isPreviewFallback ? "معاينة تجريبية للإضاءة" : "الرندرة الواقعية"}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute bottom-4 left-4 rounded-xl bg-black/75 px-3 py-1 text-xs font-bold text-rwaq-gold backdrop-blur-md border border-white/10">
                  {isPreviewFallback ? "✨ معاينة تجريبية (Lighting Pass)" : "✨ الرندرة الواقعية (After)"}
                </span>
              </div>

              {/* Before (3D Snapshot) - Clipped by Slider */}
              <div
                className="absolute inset-y-0 right-0 overflow-hidden"
                style={{ width: `${100 - sliderPosition}%` }}
              >
                <div
                  className="relative h-full"
                  style={{ width: `${(100 / (100 - sliderPosition || 1)) * 100}%`, right: 0 }}
                >
                  <Image
                    src={beforeImageUrl}
                    alt="منظور 3D الأصلي"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="absolute bottom-4 right-4 rounded-xl bg-black/75 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-md border border-white/10">
                  📐 منظور 3D (Before)
                </span>
              </div>

              {/* Slider Divider Line */}
              <div
                className="absolute inset-y-0 w-1 bg-white cursor-ew-resize shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-xl">
                  <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                </div>
              </div>
            </div>
          ) : activeTab === "depth_pass" && depthMapUrl ? (
            /* 3-Column Depth Pass Structural Inspection */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-5xl">
              {/* Column 1: 3D Viewport RGB */}
              {beforeImageUrl && (
                <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-white/10 bg-black/40 flex flex-col">
                  <div className="relative flex-1">
                    <Image
                      src={beforeImageUrl}
                      alt="منظور 3D الأصلي"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex items-center justify-between bg-black/80 px-3 py-1.5 text-[11px] text-white/80 border-t border-white/10">
                    <span className="font-bold">📐 1. منظور 3D (RGB)</span>
                    <span className="text-[10px] text-white/40">الكاميرا الأصلية</span>
                  </div>
                </div>
              )}

              {/* Column 2: Grayscale Depth Map Pass */}
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-cyan-500/40 bg-black flex flex-col shadow-lg shadow-cyan-500/10">
                <div className="relative flex-1">
                  <Image
                    src={depthMapUrl}
                    alt="خريطة العمق الفراغية Depth Map"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex items-center justify-between bg-cyan-950/80 px-3 py-1.5 text-[11px] text-cyan-300 border-t border-cyan-500/30">
                  <span className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">layers</span>
                    2. خريطة العمق (Depth Pass)
                  </span>
                  <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded font-mono font-bold">1:1 ControlNet</span>
                </div>
              </div>

              {/* Column 3: Photorealistic AI Render or Enhanced Pass */}
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-rwaq-gold/40 bg-black/40 flex flex-col shadow-lg shadow-rwaq-gold/10">
                <div className="relative flex-1">
                  <Image
                    src={afterImageUrl}
                    alt="الرندرة الواقعية فائقة الجودة"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex items-center justify-between bg-rwaq-gold/15 px-3 py-1.5 text-[11px] text-rwaq-gold border-t border-rwaq-gold/30">
                  <span className="font-bold">
                    {isPreviewFallback ? "✨ 3. معاينة الإضاءة (Studio)" : "✨ 3. الرندرة الواقعية (8K)"}
                  </span>
                  <span className="text-[10px] font-bold bg-rwaq-gold/20 px-1.5 py-0.5 rounded">
                    {isPreviewFallback ? "Lighting Pass" : "Neural Render"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Side-by-Side View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {beforeImageUrl && (
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <Image
                    src={beforeImageUrl}
                    alt="منظور 3D"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                    📐 منظور 3D
                  </span>
                </div>
              )}
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-rwaq-gold/30 bg-black/40 shadow-lg shadow-rwaq-gold/10">
                <Image
                  src={afterImageUrl}
                  alt="الرندرة الواقعية"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute bottom-3 right-3 rounded-lg bg-rwaq-gold px-2.5 py-1 text-[11px] font-bold text-black shadow-md">
                  {isPreviewFallback ? "✨ معاينة تجريبية للإضاءة" : "✨ الرندرة الواقعية"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/10 bg-white/[0.03] px-6 py-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
              <span className="text-white/40">الطراز المعماري:</span>
              <span className="font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-md">{roomStyle}</span>
              {sourceNote && (
                <span className="text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md font-medium inline-flex items-center gap-1">
                  <span>ℹ️</span>
                  <span>{sourceNote}</span>
                </span>
              )}
            </div>
            {promptUsed && (
              <p className="text-[11px] text-white/50 line-clamp-1 hover:line-clamp-none transition-all leading-relaxed break-words font-mono" title={promptUsed} dir="ltr">
                {promptUsed}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            {isPreviewFallback && (
              <button
                type="button"
                onClick={copyEnvLine}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
                title="نسخ سطر إعداد FAL_KEY في ملف .env"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isEnvCopied ? "check" : "key"}
                </span>
                <span>{isEnvCopied ? "تم النسخ!" : "FAL_KEY نسخ"}</span>
              </button>
            )}

            {promptUsed && (
              <button
                type="button"
                onClick={copyPrompt}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                title="نسخ البرومبت المعماري"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isCopied ? "check" : "content_copy"}
                </span>
                <span>{isCopied ? "تم النسخ" : "نسخ البرومبت"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => downloadImage(afterImageUrl, `rwaq-photorealistic-${Date.now()}.png`)}
              className="flex items-center gap-2 rounded-xl bg-rwaq-gold px-5 py-2.5 text-xs font-bold text-black hover:bg-rwaq-gold/90 transition-all shadow-lg shadow-rwaq-gold/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>{isPreviewFallback ? "تنزيل المعاينة (PNG)" : "تنزيل الرندرة الواقعية (PNG)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
