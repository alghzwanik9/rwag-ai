"use client";

import { useState } from "react";
import { useSceneStore } from "@/lib/useSceneStore";
import type { CurtainStyle, WindowSize } from "@/lib/useSceneStore";

type SettingsTab = 'ambient' | 'studio' | 'room' | 'materials' | 'windows';

const TABS: { id: SettingsTab; icon: string; label: string }[] = [
  { id: 'ambient', icon: 'routine', label: 'الأجواء' },
  { id: 'studio', icon: 'highlight', label: 'الإضاءة' },
  { id: 'room', icon: 'straighten', label: 'الأبعاد' },
  { id: 'materials', icon: 'texture', label: 'التشطيبات' },
  { id: 'windows', icon: 'window', label: 'النوافذ' },
];

const FLOOR_SWATCHES = [
  { id: 'wood_light', hex: '#d4b595', label: 'خشب فاتح' },
  { id: 'marble_white', hex: '#f0f0f0', label: 'رخام أبيض' },
  { id: 'concrete', hex: '#8a8d8f', label: 'خرسانة' },
  { id: 'slate', hex: '#2f353b', label: 'سليت داكن' },
];

const WALL_SWATCHES = [
  { id: 'white', hex: '#fafafa', label: 'أبيض نقي' },
  { id: 'beige', hex: '#e8e5df', label: 'بيج دافئ' },
  { id: 'sage', hex: '#b2bfa5', label: 'أخضر مريمية' },
  { id: 'navy', hex: '#2c3e50', label: 'أزرق داكن' },
];

const CURTAIN_STYLES: { id: CurtainStyle; label: string; icon: string }[] = [
  { id: 'none', label: 'بدون ستارة', icon: 'block' },
  { id: 'sheer', label: 'شفافة', icon: 'texture' },
  { id: 'blackout', label: 'حجب ضوء', icon: 'dark_mode' },
  { id: 'draped', label: 'منسدلة', icon: 'curtains' },
];

const ROOM_SHAPES: { id: 'single' | 'corridor_room' | 'open_plan' | 'l_shape'; label: string; desc: string; icon: string }[] = [
  { id: 'single', label: 'غرفة مستقلة', desc: 'مساحة مربعة/مستطيلة قياسية', icon: 'crop_square' },
  { id: 'corridor_room', label: 'غرفة مع سيب / ممر', desc: 'غرفة متصلة بممر ومدخل جانبي', icon: 'view_timeline' },
  { id: 'open_plan', label: 'صالة ومطبخ مفتوح', desc: 'مساحة معيشة مع مطبخ أمريكي', icon: 'countertops' },
  { id: 'l_shape', label: 'مخطط زاوية (L)', desc: 'مخطط ممتد بزاوية قائمة', icon: 'turn_right' },
];

/**
 * The environment/room settings, moved out of the popover that used to hang off
 * the icon rail. Reads the store directly rather than taking twenty props —
 * StudioClient was only re-exposing store values anyway.
 */
export default function SceneSettingsPanel({ showToast }: { showToast: (msg: string) => void }) {
  const [tab, setTab] = useState<SettingsTab>('ambient');

  const ambientMode = useSceneStore((s) => s.ambientMode);
  const setAmbientMode = useSceneStore((s) => s.setAmbientMode);
  const coveLightIntensity = useSceneStore((s) => s.coveLightIntensity);
  const setCoveLightIntensity = useSceneStore((s) => s.setCoveLightIntensity);
  const coveLightColor = useSceneStore((s) => s.coveLightColor);
  const setCoveLightColor = useSceneStore((s) => s.setCoveLightColor);
  const spotlightToggle = useSceneStore((s) => s.spotlightToggle);
  const toggleSpotlight = useSceneStore((s) => s.toggleSpotlight);
  const floorColor = useSceneStore((s) => s.floorColor);
  const setFloorColor = useSceneStore((s) => s.setFloorColor);
  const wallColor = useSceneStore((s) => s.wallColor);
  const setWallColor = useSceneStore((s) => s.setWallColor);
  const roomWidth = useSceneStore((s) => s.roomWidth);
  const setRoomWidth = useSceneStore((s) => s.setRoomWidth);
  const roomDepth = useSceneStore((s) => s.roomDepth);
  const setRoomDepth = useSceneStore((s) => s.setRoomDepth);
  const wallHeight = useSceneStore((s) => s.wallHeight);
  const setWallHeight = useSceneStore((s) => s.setWallHeight);
  const roomShape = useSceneStore((s) => s.roomShape || 'single');
  const setRoomShape = useSceneStore((s) => s.setRoomShape);
  const resetToDefaults = useSceneStore((s) => s.resetToDefaults);
  const windows = useSceneStore((s) => s.windows);
  const addWindow = useSceneStore((s) => s.addWindow);
  const removeWindow = useSceneStore((s) => s.removeWindow);
  const updateWindow = useSceneStore((s) => s.updateWindow);

  const roomArea = roomWidth * roomDepth;

  const dimensions = [
    { label: 'العرض (X)', value: roomWidth, setter: setRoomWidth, min: 3, max: 20, step: 0.5 },
    { label: 'العمق (Z)', value: roomDepth, setter: setRoomDepth, min: 3, max: 20, step: 0.5 },
    { label: 'الارتفاع (Y)', value: wallHeight, setter: setWallHeight, min: 2.5, max: 6, step: 0.1 },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 gap-1 border-b border-outline-variant/30 px-2 pt-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            title={t.label}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 border-b-2 pb-1.5 pt-1 transition-all ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">{t.icon}</span>
            <span className="text-[9px] font-bold">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="grow overflow-y-auto p-3">
        {tab === 'ambient' && (
          <div className="flex flex-col gap-2">
            {[
              { id: 'morning', icon: 'light_mode', title: 'الصباح الباكر', hint: 'إضاءة شمس دافئة وطبيعية' },
              { id: 'rainy', icon: 'rainy', title: 'يوم ماطر', hint: 'أجواء غائمة بظلال ناعمة' },
              { id: 'midnight', icon: 'dark_mode', title: 'المساء الهادئ', hint: 'إضاءة ليلية دراماتيكية' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setAmbientMode(mode.id as 'morning' | 'rainy' | 'midnight')}
                className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all ${
                  ambientMode === mode.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant/30 text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{mode.icon}</span>
                <div className="text-right">
                  <div className="text-[13px] font-bold">{mode.title}</div>
                  <div className="text-[10px] opacity-70">{mode.hint}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'studio' && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[13px] font-bold text-on-surface">الإضاءة المخفية (Cove)</label>
                <span className="rounded bg-primary/10 px-2 py-0.5 font-plex-mono text-[11px] text-primary">
                  {coveLightIntensity}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={coveLightIntensity}
                onChange={(e) => setCoveLightIntensity(parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-outline-variant/30 accent-primary"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[13px] font-bold text-on-surface">حرارة اللون</label>
                <span className="rounded bg-primary/10 px-2 py-0.5 font-plex-mono text-[11px] text-primary">
                  {coveLightColor}K
                </span>
              </div>
              <input
                type="range"
                min="3000"
                max="6000"
                step="100"
                value={coveLightColor}
                onChange={(e) => setCoveLightColor(parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-linear-to-r from-[#ffebd6] via-[#ffffff] to-[#d6ebff] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low p-2.5">
              <label className="flex items-center gap-2 text-[13px] font-bold text-on-surface">
                <span className="material-symbols-outlined text-[17px] text-primary">highlight</span>
                مسار الإضاءة
              </label>
              <button
                onClick={() => toggleSpotlight(!spotlightToggle)}
                aria-label="تفعيل مسار الإضاءة"
                className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                  spotlightToggle ? 'bg-primary' : 'bg-outline-variant/50'
                }`}
              >
                <div
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                    spotlightToggle ? 'left-[26px]' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {tab === 'room' && (
          <div className="flex flex-col gap-3">
            {/* ── Room Architecture / Shape Selector ── */}
            <div>
              <label className="mb-2 block text-[13px] font-bold text-on-surface">
                نوع المخطط المعماري
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROOM_SHAPES.map((shape) => {
                  const isActive = roomShape === shape.id;
                  return (
                    <button
                      key={shape.id}
                      onClick={() => {
                        setRoomShape(shape.id);
                        showToast(`تم تغيير المخطط إلى: ${shape.label}`);
                      }}
                      className={`flex flex-col items-start rounded-xl border p-2 text-right transition-all ${
                        isActive
                          ? 'border-primary bg-primary/10 text-primary shadow-xs'
                          : 'border-outline-variant/30 bg-surface-container-low text-on-surface hover:border-outline-variant'
                      }`}
                    >
                      <div className="mb-1 flex w-full items-center justify-between">
                        <span className="material-symbols-outlined text-[20px]">{shape.icon}</span>
                        {isActive && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold">{shape.label}</span>
                      <span className="mt-0.5 text-[9px] text-on-surface-variant leading-tight">{shape.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {dimensions.map((dim) => (
              <div
                key={dim.label}
                className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-2.5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[13px] font-bold text-on-surface">{dim.label}</label>
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-plex-mono text-[11px] text-primary">
                    {dim.value}m
                  </span>
                </div>
                <input
                  type="range"
                  min={dim.min}
                  max={dim.max}
                  step={dim.step}
                  value={dim.value}
                  onChange={(e) => dim.setter(parseFloat(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-outline-variant/30 accent-primary"
                />
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-2.5">
              <span className="text-[11px] font-bold text-on-surface-variant">المساحة الإجمالية</span>
              <span className="text-[17px] font-black text-primary">
                {roomArea.toFixed(1)} <span className="text-[11px]">م²</span>
              </span>
            </div>
          </div>
        )}

        {tab === 'materials' && (
          <div className="flex flex-col gap-5">
            <div>
              <label className="mb-2.5 block text-[13px] font-bold text-on-surface">
                تشطيب الأرضية
              </label>
              <div className="grid grid-cols-4 gap-2">
                {FLOOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.id}
                    onClick={() => setFloorColor(swatch.hex)}
                    title={swatch.label}
                    className={`relative aspect-square rounded-xl border-2 transition-all hover:scale-105 ${
                      floorColor === swatch.hex ? 'scale-105 border-primary' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {floorColor === swatch.hex && (
                      <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-[17px] text-white drop-shadow-md">
                        check
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-outline-variant/20" />

            <div>
              <label className="mb-2.5 block text-[13px] font-bold text-on-surface">ألوان الجدران</label>
              <div className="grid grid-cols-4 gap-2">
                {WALL_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.id}
                    onClick={() => setWallColor(swatch.hex)}
                    title={swatch.label}
                    className={`relative aspect-square rounded-xl border-2 transition-all hover:scale-105 ${
                      wallColor === swatch.hex ? 'scale-105 border-primary' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {wallColor === swatch.hex && (
                      <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-[17px] text-white mix-blend-difference drop-shadow-md">
                        check
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'windows' && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => addWindow('back')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/40 bg-secondary-container/60 py-2 text-[11px] font-bold text-on-surface transition-all hover:bg-secondary/20"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                نافذة خلفية
              </button>
              <button
                onClick={() => addWindow('left')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/40 bg-secondary-container/60 py-2 text-[11px] font-bold text-on-surface transition-all hover:bg-secondary/20"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                نافذة جانبية
              </button>
            </div>

            {windows.length === 0 && (
              <div className="py-8 text-center text-on-surface-variant">
                <span className="material-symbols-outlined mb-2 block text-4xl opacity-30">window</span>
                <p className="text-[11px]">لا توجد نوافذ بعد. أضف نافذة أعلاه.</p>
              </div>
            )}

            {windows.map((win, idx) => (
              <div
                key={win.id}
                className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low"
              >
                <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px] text-secondary">window</span>
                    <span className="text-[11px] font-bold text-on-surface">
                      نافذة {idx + 1} · {win.wall === 'back' ? 'خلفية' : 'جانبية'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeWindow(win.id)}
                    aria-label="حذف النافذة"
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-error/60 transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3 p-3">
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold text-on-surface-variant">الحجم</p>
                    <div className="flex gap-1">
                      {(['small', 'medium', 'large'] as WindowSize[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateWindow(win.id, { size: s })}
                          className={`flex-1 rounded-lg border py-1.5 text-[10px] font-bold transition-all ${
                            win.size === s
                              ? 'border-primary bg-primary text-on-primary'
                              : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {s === 'small' ? 'صغيرة' : s === 'medium' ? 'متوسطة' : 'كبيرة'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between">
                      <p className="text-[10px] font-bold text-on-surface-variant">الموضع على الجدار</p>
                      <span className="font-plex-mono text-[10px] text-primary">
                        {Math.round(win.positionOffset * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.05"
                      value={win.positionOffset}
                      onChange={(e) => updateWindow(win.id, { positionOffset: parseFloat(e.target.value) })}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-outline-variant/30 accent-primary"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between">
                      <p className="text-[10px] font-bold text-on-surface-variant">ارتفاع النافذة</p>
                      <span className="font-plex-mono text-[10px] text-primary">
                        {Math.round(win.height * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="0.85"
                      step="0.05"
                      value={win.height}
                      onChange={(e) => updateWindow(win.id, { height: parseFloat(e.target.value) })}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-outline-variant/30 accent-primary"
                    />
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-bold text-on-surface-variant">نوع الستارة</p>
                    <div className="grid grid-cols-2 gap-1">
                      {CURTAIN_STYLES.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => updateWindow(win.id, { curtain: c.id })}
                          className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-bold transition-all ${
                            win.curtain === c.id
                              ? 'border-secondary bg-secondary text-white'
                              : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">{c.icon}</span>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {win.curtain !== 'none' && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] font-bold text-on-surface-variant">اللون</p>
                        <div className="flex gap-1">
                          {['#f0ece4', '#d4ccc0', '#8fa8b2', '#c5a882', '#6b7b8d', '#b8936a'].map((clr) => (
                            <button
                              key={clr}
                              onClick={() => updateWindow(win.id, { curtainColor: clr })}
                              aria-label={`لون الستارة ${clr}`}
                              className={`h-5 w-5 rounded-full border-2 transition-all ${
                                win.curtainColor === clr ? 'scale-110 border-primary' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: clr }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => updateWindow(win.id, { isOpen: !win.isOpen })}
                        className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition-all ${
                          win.isOpen
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-outline-variant/40 text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          {win.isOpen ? 'curtains' : 'curtains_closed'}
                        </span>
                        {win.isOpen ? 'مفتوحة' : 'مغلقة'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-outline-variant/30 p-3">
        <button
          onClick={() => {
            resetToDefaults();
            showToast('🔄 تم استعادة الإعدادات الافتراضية');
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant py-2 text-[12px] font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[16px]">device_reset</span>
          استعادة الإعدادات الافتراضية
        </button>
      </div>
    </div>
  );
}
