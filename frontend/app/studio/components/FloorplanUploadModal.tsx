"use client";

import React, { useState, useRef, useCallback } from "react";
import { Z } from "../config/regions";
import { useSceneStore, type RoomWindow, type RoomDoor } from "@/lib/useSceneStore";
import { IKEA_TEMPLATES } from "@/app/studio/config/catalogTemplates";
import { resolveItem, PLACEHOLDER_MODEL_URL } from "@/app/studio/config/matching";
import { normalizeDimensionsMm, type AIResponseItem } from "@/app/studio/config/pipeline";

interface FloorplanUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

interface ExtractedOpeningPayload {
  wall: "back" | "left" | "right" | "front";
  offset_ratio: number;
  width_m: number;
  type: "door" | "window";
  height_m?: number;
}

interface FloorplanTo3DResult {
  status: string;
  room_dimensions: { width: number; depth: number; height: number };
  room_type: string;
  confidence: number;
  room_shape?: string;
  openings: ExtractedOpeningPayload[];
  windows: RoomWindow[];
  doors: RoomDoor[];
  items: Array<{
    instance_id: string;
    asset_id: string;
    name?: string;
    position: [number, number, number];
    rotation: [number, number, number];
    dimensions?: { width: number; height: number; depth: number };
    economy?: {
      price?: number;
      currency?: string;
      brand?: string;
      sku?: string;
      store_url?: string;
    };
    color?: string;
  }>;
  spatial_audit?: {
    spatial_score?: number;
    assessment_label?: string;
    density_percentage?: number;
    recommendations?: string[];
  };
  auto_corrected?: boolean;
  concept_philosophy?: string;
  wall_color?: string;
  floor_color?: string;
  ambient_mode?: "morning" | "rainy" | "midnight";
  summary_ar?: string;
  summary_en?: string;
}

const STYLE_OPTIONS = [
  { id: "مودرن", label: "مودرن حديث", icon: "chair" },
  { id: "ياباني معاصر (جاباندي)", label: "ياباني (جاباندي)", icon: "nature" },
  { id: "نيو كلاسيك", label: "نيو كلاسيك", icon: "apartment" },
  { id: "مجلس عربي فاخر", label: "مجلس فاخر", icon: "weekend" },
  { id: "مينيماليزم", label: "مينيماليزم", icon: "grid_view" },
];

export function FloorplanUploadModal({ isOpen, onClose, showToast }: FloorplanUploadModalProps) {
  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [autoFurnish, setAutoFurnish] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState("مودرن");
  const [replaceExistingScene, setReplaceExistingScene] = useState(true);

  // Review step editable values
  const [extractionResult, setExtractionResult] = useState<FloorplanTo3DResult | null>(null);
  const [editWidth, setEditWidth] = useState<number>(5.5);
  const [editDepth, setEditDepth] = useState<number>(4.8);
  const [editHeight, setEditHeight] = useState<number>(2.8);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("⚠️ يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0]);
      }
    },
    [showToast]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleProcessFloorplan = async () => {
    if (!selectedFile) {
      showToast("⚠️ يرجى رفع صورة المخطط أولاً");
      return;
    }

    setStep("processing");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("auto_furnish", String(autoFurnish));
      formData.append("style", selectedStyle);

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/v1/floorplan-to-3d`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorDetail = "";
        try {
          const errData = await res.json();
          errorDetail = errData.detail || "";
        } catch {}
        throw new Error(errorDetail || `خطأ استجابة من الخادم (${res.status})`);
      }

      const data: FloorplanTo3DResult = await res.json();
      setExtractionResult(data);

      const dims = data.room_dimensions || { width: 5.5, depth: 4.8, height: 2.8 };
      setEditWidth(dims.width || 5.5);
      setEditDepth(dims.depth || 4.8);
      setEditHeight(dims.height || 2.8);

      setStep("review");
      showToast("✨ تم استخراج أبعاد المخطط بنجاح!");
    } catch (err: unknown) {
      const e = err as Error;
      setStep("upload");
      showToast(`❌ تعذر تحليل المخطط: ${e.message || "حدث خطأ غير متوقع"}`);
    }
  };

  const handleApplyToStudio = () => {
    if (!extractionResult) return;

    const store = useSceneStore.getState();

    // 1. Update Room architectural boundary
    store.setRoomWidth(editWidth);
    store.setRoomDepth(editDepth);
    store.setWallHeight(editHeight);

    if (extractionResult.room_shape) {
      const shape = extractionResult.room_shape as "single" | "corridor_room" | "open_plan" | "l_shape";
      if (["single", "corridor_room", "open_plan", "l_shape"].includes(shape)) {
        store.setRoomShape(shape);
      }
    }

    // 2. Apply detected windows and doors
    if (extractionResult.windows && extractionResult.windows.length > 0) {
      store.setWindows(extractionResult.windows);
    }
    if (extractionResult.doors && extractionResult.doors.length > 0) {
      store.setDoors(extractionResult.doors);
    }

    // 3. Finishes & Lighting
    if (extractionResult.wall_color) {
      store.setWallColor(extractionResult.wall_color);
    }
    if (extractionResult.floor_color) {
      store.setFloorColor(extractionResult.floor_color);
    }
    if (extractionResult.ambient_mode) {
      store.setAmbientMode(extractionResult.ambient_mode);
    }

    // 4. Furniture Placement
    if (autoFurnish && extractionResult.items && extractionResult.items.length > 0) {
      if (replaceExistingScene) {
        store.clearScene();
      }

      extractionResult.items.forEach((item) => {
        const economyPrice = item.economy?.price ?? 1500;
        const aiItemPayload: AIResponseItem = {
          instance_id: item.instance_id,
          asset_id: item.asset_id,
          position: item.position,
          rotation: item.rotation,
          dimensions: item.dimensions,
          economy: item.economy ? {
            price: economyPrice,
            currency: (item.economy.currency as "SAR") || "SAR",
            brand: item.economy.brand || "Rwaq",
            sku: item.economy.sku || "FP-ITEM",
            store_url: item.economy.store_url || "https://www.ikea.com",
          } : undefined,
        };

        const resolution = resolveItem(aiItemPayload, IKEA_TEMPLATES);

        if (resolution.kind === 'placeholder') {
          store.addSceneItem({
            instanceId: item.instance_id,
            id: item.economy?.sku || item.asset_id,
            name: item.name || item.asset_id.replace(/_/g, " "),
            brand: item.economy?.brand || "Rwaq AI",
            price: economyPrice,
            currency: (item.economy?.currency as "SAR") || "SAR",
            category: "seating",
            modelUrl: PLACEHOLDER_MODEL_URL,
            thumbnailUrl: "",
            store_url: item.economy?.store_url || "https://www.ikea.com",
            dimensions: normalizeDimensionsMm(item.dimensions),
            position: item.position || [0, 0, 0],
            rotation: item.rotation || [0, 0, 0],
            color: item.color,
          });
        } else {
          store.addSceneItem({
            ...resolution.asset,
            instanceId: item.instance_id,
            name: item.name || resolution.asset.name,
            price: economyPrice || resolution.asset.price,
            currency: (item.economy?.currency as "SAR") || resolution.asset.currency,
            store_url: item.economy?.store_url || resolution.asset.store_url,
            dimensions: normalizeDimensionsMm(item.dimensions, resolution.asset.dimensions),
            position: item.position || [0, 0, 0],
            rotation: item.rotation || [0, 0, 0],
            color: item.color,
          });
        }
      });
    }

    showToast("🎉 تم بناء الغرفة ثلاثية الأبعاد بنجاح من المخطط!");
    handleClose();
  };

  const handleClose = () => {
    setStep("upload");
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setExtractionResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${Z.modal} flex items-center justify-center p-4`}
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primary/25 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface/95 shadow-[0_24px_64px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/50 px-6 py-4.5 bg-surface-container-low/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rwaq-gold/15 text-rwaq-gold border border-rwaq-gold/30 shadow-xs">
              <span className="material-symbols-outlined text-[24px]">architecture</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-on-surface">
                تحويل المخطط 2D إلى واقع 3D
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                رؤية حاسوبية ذكية لمخططات CAD، المخططات الهندسية، والاسكتشات اليدوية
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            aria-label="إغلاق"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === "upload" && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                  isDragging
                    ? "border-primary bg-primary/10 scale-[1.01]"
                    : previewUrl
                    ? "border-outline-variant bg-surface-container-low/50 hover:border-primary/60"
                    : "border-outline-variant/80 bg-surface-container-lowest/60 hover:border-primary/60 hover:bg-surface-container-low/70"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                {previewUrl ? (
                  <div className="relative flex flex-col items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="Floorplan Preview"
                      className="max-h-56 w-auto rounded-xl object-contain shadow-md border border-outline-variant/40"
                    />
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary group-hover:underline">
                      <span className="material-symbols-outlined text-[16px]">cached</span>
                      تغيير صورة المخطط
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant transition-transform group-hover:scale-110">
                      <span className="material-symbols-outlined text-[30px]">add_photo_alternate</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        اسحب وأفلت صورة المخطط هنا، أو انقر للتصفح
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        يدعم ملفات CAD المصدّرة، مخططات PDF كصور، أو رسم اسكتش يدوي بالقلم (PNG, JPG, WEBP)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-4 rounded-2xl border border-outline-variant/50 bg-surface-container-low/40 p-4.5">
                {/* Auto Furnish Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-rwaq-gold text-[22px]">auto_awesome</span>
                    <div>
                      <div className="text-xs font-bold text-on-surface">
                        تأثيث الغرفة تلقائياً بالذكاء الاصطناعي (AI Auto-Furnish)
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        توزيع أثاث ممتثل لمعايير كود البناء السعودي (SBC) ومسارات الحركة Neufert
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={autoFurnish}
                      onChange={(e) => setAutoFurnish(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-surface-container-highest transition-colors peer-checked:bg-primary peer-focus:outline-hidden after:absolute after:top-[2px] after:right-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:-translate-x-full"></div>
                  </label>
                </div>

                {/* Style Selector */}
                {autoFurnish && (
                  <div className="pt-3 border-t border-outline-variant/40 space-y-2">
                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">palette</span>
                      طراز التصميم الداخلي المفضل:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {STYLE_OPTIONS.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setSelectedStyle(style.id)}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                            selectedStyle === style.id
                              ? "border-primary bg-primary text-on-primary shadow-xs"
                              : "border-outline-variant/60 bg-surface hover:border-primary/60 text-on-surface"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[17px]">{style.icon}</span>
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <span className="material-symbols-outlined text-[32px] text-primary animate-pulse">
                  travel_explore
                </span>
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-base font-bold text-on-surface">
                  جاري تحليل المخطط المعماري...
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  يقوم نموذج Gemini 2.5 Flash بقراءة قياسات الجدران، وتحديد النوافذ والأبواب، وتطبيق محددات كود البناء السعودي (SBC).
                </p>
              </div>
            </div>
          )}

          {step === "review" && extractionResult && (
            <div className="space-y-5">
              {/* Summary Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-container-high/60 p-4 border border-outline-variant/50">
                <div className="flex items-center gap-3">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Thumbnail"
                      className="h-14 w-14 rounded-xl object-cover border border-outline-variant/40"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-on-surface">
                        {extractionResult.summary_ar || `غرفة ${extractionResult.room_type}`}
                      </span>
                      <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                        دقة {Math.round(extractionResult.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      تم رصد {extractionResult.windows?.length || 0} نوافذ و {extractionResult.doors?.length || 0} أبواب
                    </div>
                  </div>
                </div>

                {extractionResult.spatial_audit?.spatial_score && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                    <div className="text-right">
                      <div className="text-[10px] text-on-surface-variant font-bold">امتثال كود البناء SBC</div>
                      <div className="text-xs font-black text-emerald-600">
                        {extractionResult.spatial_audit.spatial_score}/100
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Dimensions */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">straighten</span>
                  الأبعاد المستخرجة (يمكنك تعديلها قبل البناء):
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant">العرض (متر)</span>
                    <input
                      type="number"
                      step="0.1"
                      min="2.5"
                      max="12.0"
                      value={editWidth}
                      onChange={(e) => setEditWidth(parseFloat(e.target.value) || 2.5)}
                      className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-xs font-bold text-on-surface focus:border-primary focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant">العمق (متر)</span>
                    <input
                      type="number"
                      step="0.1"
                      min="2.5"
                      max="12.0"
                      value={editDepth}
                      onChange={(e) => setEditDepth(parseFloat(e.target.value) || 2.5)}
                      className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-xs font-bold text-on-surface focus:border-primary focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant">الارتفاع (متر)</span>
                    <input
                      type="number"
                      step="0.1"
                      min="2.4"
                      max="4.5"
                      value={editHeight}
                      onChange={(e) => setEditHeight(parseFloat(e.target.value) || 2.8)}
                      className="w-full rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-xs font-bold text-on-surface focus:border-primary focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Furnishing summary & action selector */}
              {autoFurnish && extractionResult.items && extractionResult.items.length > 0 && (
                <div className="space-y-3 rounded-2xl border border-outline-variant/50 bg-surface-container-low/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-primary">view_in_ar</span>
                      قطع الأثاث الجاهزة للتموضع ({extractionResult.items.length} قطع)
                    </span>
                    {extractionResult.auto_corrected && (
                      <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
                        ⚡ تم التصحيح الذاتي للتداخلات
                      </span>
                    )}
                  </div>

                  {/* Scene replacement toggle */}
                  <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-on-surface">استبدال المشهد الحالي بالكامل</div>
                      <div className="text-[10px] text-on-surface-variant">
                        مسح الأثاث القديم وتطبيق المخطط الجديد (يمكن التراجع عنه عبر Ctrl+Z)
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={replaceExistingScene}
                        onChange={(e) => setReplaceExistingScene(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-5 w-9 rounded-full bg-surface-container-highest transition-colors peer-checked:bg-primary peer-focus:outline-hidden after:absolute after:top-[2px] after:right-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:-translate-x-full"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-outline-variant/50 bg-surface-container-low/60 px-6 py-4">
          {step === "upload" && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl px-4 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!selectedFile}
                onClick={handleProcessFloorplan}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                  selectedFile
                    ? "bg-primary text-on-primary shadow-sm hover:opacity-95 active:scale-95"
                    : "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">auto_fix_high</span>
                بدء استخراج المخطط إلى 3D
              </button>
            </>
          )}

          {step === "processing" && (
            <div className="w-full text-center text-xs font-bold text-on-surface-variant">
              يرجى الانتظار، تتم المعالجة الهندسية الآن...
            </div>
          )}

          {step === "review" && (
            <>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                إعادة الرفع
              </button>
              <button
                type="button"
                onClick={handleApplyToStudio}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-on-primary shadow-sm transition-all hover:opacity-95 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">view_in_ar</span>
                تطبيق وبناء المشهد 3D
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
