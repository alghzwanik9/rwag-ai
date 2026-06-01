"use client";

import React, { useState } from "react";
import { useSceneStore, WindowSize, CurtainStyle } from "@/lib/useSceneStore";

interface SettingsMenuProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

export function SettingsMenu({ onClose, showToast }: SettingsMenuProps) {
  const [settingsTab, setSettingsTab] = useState<'ambient'|'studio'|'room'|'materials'|'windows'>('ambient');
  
  const resetToDefaults = useSceneStore((s) => s.resetToDefaults);
  const ambientMode = useSceneStore((s) => s.ambientMode);
  const setAmbientMode = useSceneStore((s) => s.setAmbientMode);
  const coveLightIntensity = useSceneStore((s) => s.coveLightIntensity);
  const setCoveLightIntensity = useSceneStore((s) => s.setCoveLightIntensity);
  const coveLightColor = useSceneStore((s) => s.coveLightColor);
  const setCoveLightColor = useSceneStore((s) => s.setCoveLightColor);
  const spotlightToggle = useSceneStore((s) => s.spotlightToggle);
  const toggleSpotlight = useSceneStore((s) => s.toggleSpotlight);
  const roomWidth = useSceneStore((s) => s.roomWidth);
  const setRoomWidth = useSceneStore((s) => s.setRoomWidth);
  const roomDepth = useSceneStore((s) => s.roomDepth);
  const setRoomDepth = useSceneStore((s) => s.setRoomDepth);
  const wallHeight = useSceneStore((s) => s.wallHeight);
  const setWallHeight = useSceneStore((s) => s.setWallHeight);
  const roomArea = roomWidth * roomDepth;
  const floorColor = useSceneStore((s) => s.floorColor);
  const setFloorColor = useSceneStore((s) => s.setFloorColor);
  const wallColor = useSceneStore((s) => s.wallColor);
  const setWallColor = useSceneStore((s) => s.setWallColor);
  const windows = useSceneStore((s) => s.windows);
  const addWindow = useSceneStore((s) => s.addWindow);
  const removeWindow = useSceneStore((s) => s.removeWindow);
  const updateWindow = useSceneStore((s) => s.updateWindow);

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-[72px] w-[340px] bg-surface/95 backdrop-blur-2xl border border-outline-variant/40 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] flex flex-col z-50 overflow-hidden transform origin-left animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-surface/50 border-b border-outline-variant/30">
        <h2 className="font-label-lg font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
          إعدادات البيئة
        </h2>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => { resetToDefaults(); showToast("🔄 تم استعادة الإعدادات الافتراضية"); }} 
            className="text-primary hover:text-secondary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors"
            title="إعادة ضبط على الافتراضي"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          </button>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex px-2 pt-2 gap-1 border-b border-outline-variant/20 bg-surface-variant/10">
        {[
          { id: 'ambient',   icon: 'routine',     label: 'الأجواء'     },
          { id: 'studio',    icon: 'highlight',   label: 'الإضاءة'     },
          { id: 'room',      icon: 'straighten',  label: 'الأبعاد'     },
          { id: 'materials', icon: 'texture',     label: 'التشطيبات'  },
          { id: 'windows',   icon: 'window',      label: 'النوافذ'     },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSettingsTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 pb-2 pt-1 border-b-2 transition-all ${settingsTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 rounded-t-lg'}`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        
        {/* Tab: Ambient */}
        {settingsTab === 'ambient' && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-right-4 fade-in duration-300">
            <button 
              onClick={() => setAmbientMode('morning')}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${ambientMode === 'morning' ? 'bg-primary/10 border-primary text-primary' : 'border-outline-variant/30 text-on-surface hover:bg-surface-variant/50 hover:border-outline-variant'}`}
            >
              <span className="material-symbols-outlined text-[24px]">light_mode</span>
              <div className="text-right">
                <div className="font-bold text-sm">الصباح الباكر</div>
                <div className="text-[10px] opacity-70">إضاءة شمس دافئة وطبيعية</div>
              </div>
            </button>
            <button 
              onClick={() => setAmbientMode('rainy')}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${ambientMode === 'rainy' ? 'bg-primary/10 border-primary text-primary' : 'border-outline-variant/30 text-on-surface hover:bg-surface-variant/50 hover:border-outline-variant'}`}
            >
              <span className="material-symbols-outlined text-[24px]">rainy</span>
              <div className="text-right">
                <div className="font-bold text-sm">يوم ماطر</div>
                <div className="text-[10px] opacity-70">أجواء غائمة بظلال ناعمة</div>
              </div>
            </button>
            <button 
              onClick={() => setAmbientMode('midnight')}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${ambientMode === 'midnight' ? 'bg-primary/10 border-primary text-primary' : 'border-outline-variant/30 text-on-surface hover:bg-surface-variant/50 hover:border-outline-variant'}`}
            >
              <span className="material-symbols-outlined text-[24px]">dark_mode</span>
              <div className="text-right">
                <div className="font-bold text-sm">المساء الهادئ</div>
                <div className="text-[10px] opacity-70">إضاءة ليلية دراماتيكية</div>
              </div>
            </button>
          </div>
        )}

        {/* Tab: Studio */}
        {settingsTab === 'studio' && (
          <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-on-surface">الإضاءة المخفية (Cove)</label>
                <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{coveLightIntensity}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={coveLightIntensity}
                onChange={(e) => setCoveLightIntensity(parseInt(e.target.value))}
                className="w-full h-2 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-on-surface">حرارة اللون</label>
                <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{coveLightColor}K</span>
              </div>
              <input 
                type="range" min="3000" max="6000" step="100"
                value={coveLightColor}
                onChange={(e) => setCoveLightColor(parseInt(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-[#ffebd6] via-[#ffffff] to-[#d6ebff] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-variant/20 rounded-xl border border-outline-variant/30">
              <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">highlight</span>
                مسار الإضاءة (Spotlights)
              </label>
              <button 
                onClick={() => toggleSpotlight(!spotlightToggle)}
                className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${spotlightToggle ? 'bg-primary' : 'bg-outline-variant/50'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${spotlightToggle ? 'left-[26px]' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Tab: Room Dimensions */}
        {settingsTab === 'room' && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-300">
            {[
              { label: 'العرض (X)', value: roomWidth, setter: setRoomWidth, min: 3, max: 20 },
              { label: 'العمق (Z)', value: roomDepth, setter: setRoomDepth, min: 3, max: 20 },
              { label: 'الارتفاع (Y)', value: wallHeight, setter: setWallHeight, min: 2.5, max: 6, step: 0.1 }
            ].map((dim, i) => (
              <div key={i} className="bg-surface-variant/10 p-3 rounded-xl border border-outline-variant/20">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-on-surface">{dim.label}</label>
                  <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{dim.value}m</span>
                </div>
                <input 
                  type="range" min={dim.min} max={dim.max} step={dim.step || 0.5}
                  value={dim.value}
                  onChange={(e) => dim.setter(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            ))}
            <div className="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/20 flex justify-between items-center">
              <span className="text-xs font-bold text-on-surface-variant">المساحة الإجمالية</span>
              <span className="text-lg font-black text-primary">{roomArea.toFixed(1)} <span className="text-xs">م²</span></span>
            </div>
          </div>
        )}

        {/* Tab: Materials */}
        {settingsTab === 'materials' && (
          <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <label className="text-sm font-bold text-on-surface mb-3 block">تشطيب الأرضية (Floor)</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'wood_light', hex: '#d4b595', label: 'خشب فاتح' },
                  { id: 'marble_white', hex: '#f0f0f0', label: 'رخام أبيض' },
                  { id: 'concrete', hex: '#8a8d8f', label: 'خرسانة' },
                  { id: 'slate', hex: '#2f353b', label: 'سليت داكن' }
                ].map(swatch => (
                  <button 
                    key={swatch.id}
                    onClick={() => setFloorColor(swatch.hex)}
                    className={`aspect-square rounded-xl border-2 transition-all hover:scale-105 hover:shadow-md relative ${floorColor === swatch.hex ? 'border-primary scale-105 shadow-sm' : 'border-transparent'}`}
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.label}
                  >
                    {floorColor === swatch.hex && <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-white drop-shadow-md text-[18px]">check</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[1px] bg-outline-variant/20"></div>

            <div>
              <label className="text-sm font-bold text-on-surface mb-3 block">ألوان الجدران (Walls)</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'white', hex: '#fafafa', label: 'أبيض نقي' },
                  { id: 'beige', hex: '#e8e5df', label: 'بيج دافئ' },
                  { id: 'sage', hex: '#b2bfa5', label: 'أخضر مريمية' },
                  { id: 'navy', hex: '#2c3e50', label: 'أزرق داكن' }
                ].map(swatch => (
                  <button 
                    key={swatch.id}
                    onClick={() => setWallColor(swatch.hex)}
                    className={`aspect-square rounded-xl border-2 transition-all hover:scale-105 hover:shadow-md relative ${wallColor === swatch.hex ? 'border-primary scale-105 shadow-sm' : 'border-transparent'}`}
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.label}
                  >
                    {wallColor === swatch.hex && <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-white mix-blend-difference drop-shadow-md text-[18px]">check</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Windows */}
        {settingsTab === 'windows' && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="flex gap-2">
              <button
                onClick={() => addWindow('back')}
                className="flex-1 flex items-center justify-center gap-2 bg-secondary-container/60 text-on-surface text-xs font-bold py-2.5 rounded-xl border border-outline-variant/40 hover:bg-secondary/20 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                نافذة خلفية
              </button>
              <button
                onClick={() => addWindow('left')}
                className="flex-1 flex items-center justify-center gap-2 bg-secondary-container/60 text-on-surface text-xs font-bold py-2.5 rounded-xl border border-outline-variant/40 hover:bg-secondary/20 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                نافذة جانبية
              </button>
            </div>

            {windows.length === 0 && (
              <div className="text-center py-8 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl opacity-30 block mb-2">window</span>
                <p className="text-xs">لا توجد نوافذ بعد. أضف نافذة أعلاه!</p>
              </div>
            )}

            {windows.map((win, idx) => (
              <div key={win.id} className="bg-surface-variant/10 rounded-2xl border border-outline-variant/30 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-surface-variant/20 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-secondary">window</span>
                    <span className="text-xs font-bold text-on-surface">
                      نافذة {idx + 1} · {win.wall === 'back' ? 'خلفية' : 'جانبية'}
                    </span>
                  </div>
                  <button onClick={() => removeWindow(win.id)} className="text-error/60 hover:text-error w-6 h-6 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors">
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>

                <div className="p-3 flex flex-col gap-3">
                  {/* Size */}
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant mb-1.5">الحجم</p>
                    <div className="flex gap-1">
                      {(['small', 'medium', 'large'] as WindowSize[]).map((s) => (
                        <button key={s} onClick={() => updateWindow(win.id, { size: s })}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all border ${win.size === s ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-variant/30'}`}
                        >
                          {s === 'small' ? 'صغيرة' : s === 'medium' ? 'متوسطة' : 'كبيرة'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-[10px] font-bold text-on-surface-variant">الموضع على الجدار</p>
                      <span className="text-[10px] font-mono text-primary">{Math.round(win.positionOffset * 100)}%</span>
                    </div>
                    <input type="range" min="-1" max="1" step="0.05" value={win.positionOffset}
                      onChange={(e) => updateWindow(win.id, { positionOffset: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-[10px] font-bold text-on-surface-variant">ارتفاع النافذة</p>
                      <span className="text-[10px] font-mono text-primary">{Math.round(win.height * 100)}%</span>
                    </div>
                    <input type="range" min="0.3" max="0.85" step="0.05" value={win.height}
                      onChange={(e) => updateWindow(win.id, { height: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Curtain Type */}
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant mb-1.5">نوع الستارة</p>
                    <div className="grid grid-cols-2 gap-1">
                      {([
                        { id: 'none', label: 'بدون ستارة', icon: 'block' },
                        { id: 'sheer', label: 'شفافة', icon: 'texture' },
                        { id: 'blackout', label: 'حجب ضوء', icon: 'dark_mode' },
                        { id: 'draped', label: 'منسدلة', icon: 'curtains' },
                      ] as { id: CurtainStyle; label: string; icon: string }[]).map((c) => (
                        <button key={c.id} onClick={() => updateWindow(win.id, { curtain: c.id })}
                          className={`flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold rounded-lg transition-all border ${win.curtain === c.id ? 'bg-secondary text-white border-secondary' : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-variant/30'}`}
                        >
                          <span className="material-symbols-outlined text-[12px]">{c.icon}</span>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Curtain Color + Open/Close */}
                  {win.curtain !== 'none' && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] font-bold text-on-surface-variant">اللون</p>
                        <div className="flex gap-1">
                          {['#f0ece4','#d4ccc0','#8fa8b2','#c5a882','#6b7b8d','#b8936a'].map((clr) => (
                            <button key={clr} onClick={() => updateWindow(win.id, { curtainColor: clr })}
                              className={`w-5 h-5 rounded-full border-2 transition-all ${win.curtainColor === clr ? 'border-primary scale-110' : 'border-transparent'}`}
                              style={{ backgroundColor: clr }}
                            />
                          ))}
                        </div>
                      </div>
                      <button onClick={() => updateWindow(win.id, { isOpen: !win.isOpen })}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${win.isOpen ? 'bg-primary/10 text-primary border-primary/30' : 'border-outline-variant/40 text-on-surface-variant'}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">{win.isOpen ? 'curtains' : 'curtains_closed'}</span>
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
    </div>
  );
}
