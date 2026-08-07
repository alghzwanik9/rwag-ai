"use client";

import React, { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { useSceneStore } from "@/lib/useSceneStore";
import { SettingsMenu } from "./SettingsMenu";

export type TemplateType = "LivingRoom" | "Bedroom" | "Kitchen";

interface StudioToolbarProps {
  showToast: (msg: string) => void;
  handleLoadTemplate: (type: TemplateType) => void;
  setIsProjectsModalOpen: (b: boolean) => void;
  setIsModalOpen: (b: boolean) => void;
  setIsMaterialPaletteOpen: (b: boolean) => void;
  setIsARModalOpen: (b: boolean) => void;
  setIsChatbotOpen: (b: boolean) => void;
  resetCamera: () => void;
}

export function StudioToolbar({
  showToast,
  handleLoadTemplate,
  setIsProjectsModalOpen,
  setIsModalOpen,
  setIsMaterialPaletteOpen,
  setIsARModalOpen,
  setIsChatbotOpen,
  resetCamera
}: StudioToolbarProps) {
  const [isTemplatesMenuOpen, setIsTemplatesMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  
  const undo = useSceneStore((s) => s.undo);
  const redo = useSceneStore((s) => s.redo);
  const viewMode = useSceneStore((s) => s.viewMode);
  const setViewMode = useSceneStore((s) => s.setViewMode);

  return (
    <nav className="fixed left-4 top-1/2 -translate-y-1/2 w-16 bg-surface/60 backdrop-blur-xl rounded-2xl border border-outline-variant/30 shadow-2xl flex flex-col items-center gap-2 py-4 z-40 transition-all hover:bg-surface/80 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
      
      <button onClick={() => setIsProjectsModalOpen(true)} className="group relative w-12 h-12 flex items-center justify-center rounded-xl text-primary hover:bg-primary hover:text-on-primary transition-all duration-300" title="حفظ المشروع">
        <span className="material-symbols-outlined transition-transform group-hover:scale-110">save</span>
        <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">حفظ المشروع</div>
      </button>
      
      <div className="w-8 h-px bg-outline-variant/30 my-1"></div>

      <button onClick={() => { undo(); showToast("↩️ تراجع"); }} className="group relative w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-secondary-container/80 transition-all duration-300">
        <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">undo</span>
        <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">تراجع (Ctrl+Z)</div>
      </button>
      
      <button onClick={() => { redo(); showToast("↪️ إعادة"); }} className="group relative w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-secondary-container/80 transition-all duration-300">
        <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">redo</span>
        <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">إعادة (Ctrl+Y)</div>
      </button>

      <div className="w-8 h-px bg-outline-variant/30 my-1"></div>
      
      {/* Settings Menu Button */}
      <div className="relative group/menu">
        <button 
          onClick={() => { setIsSettingsMenuOpen(!isSettingsMenuOpen); setIsTemplatesMenuOpen(false); }} 
          className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${isSettingsMenuOpen ? 'bg-primary text-on-primary shadow-lg shadow-primary/30' : 'text-on-surface-variant hover:bg-secondary-container/80'}`}
        >
          <span className="material-symbols-outlined">tune</span>
          {isSettingsMenuOpen && <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full"></div>}
        </button>
        <div className="absolute left-full ml-3 opacity-0 group-hover/menu:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">إعدادات البيئة والغرفة</div>
        
        {isSettingsMenuOpen && (
          <SettingsMenu onClose={() => setIsSettingsMenuOpen(false)} showToast={showToast} />
        )}
      </div>

      <div className="relative group/menu">
        <button 
          onClick={() => { setIsTemplatesMenuOpen(!isTemplatesMenuOpen); setIsSettingsMenuOpen(false); }} 
          className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${isTemplatesMenuOpen ? 'bg-primary text-on-primary shadow-lg shadow-primary/30' : 'text-on-surface-variant hover:bg-secondary-container/80'}`}
        >
          <span className="material-symbols-outlined">dashboard_customize</span>
          {isTemplatesMenuOpen && <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full"></div>}
        </button>
        <div className="absolute left-full ml-3 opacity-0 group-hover/menu:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">قوالب التصميم جاهزة</div>
        
        {isTemplatesMenuOpen && (
          <div className="absolute top-1/2 -translate-y-1/2 left-[72px] w-56 bg-surface/95 backdrop-blur-2xl border border-outline-variant/40 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] p-2 flex flex-col gap-1 z-50 transform origin-left animate-in fade-in zoom-in-95 duration-200">
            <p className="px-3 py-2 text-xs font-bold text-on-surface-variant border-b border-outline-variant/30 mb-2">اختر نموذجاً للبدء</p>
            <button onClick={() => { handleLoadTemplate("LivingRoom"); setIsTemplatesMenuOpen(false); }} className="flex items-center gap-3 text-right px-3 py-2.5 text-sm rounded-xl hover:bg-primary/10 hover:text-primary text-on-surface transition-colors font-bold"><span className="material-symbols-outlined text-[20px]">weekend</span>غرفة معيشة</button>
            <button onClick={() => { handleLoadTemplate("Bedroom"); setIsTemplatesMenuOpen(false); }} className="flex items-center gap-3 text-right px-3 py-2.5 text-sm rounded-xl hover:bg-primary/10 hover:text-primary text-on-surface transition-colors font-bold"><span className="material-symbols-outlined text-[20px]">bed</span>غرفة نوم</button>
            <button onClick={() => { handleLoadTemplate("Kitchen"); setIsTemplatesMenuOpen(false); }} className="flex items-center gap-3 text-right px-3 py-2.5 text-sm rounded-xl hover:bg-primary/10 hover:text-primary text-on-surface transition-colors font-bold"><span className="material-symbols-outlined text-[20px]">countertops</span>مطبخ و طعام</button>
          </div>
        )}
      </div>

      <div className="w-8 h-px bg-outline-variant/30 my-1"></div>
      
      <button onClick={() => setIsProjectsModalOpen(true)} className="group relative w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-secondary-container/80 transition-all duration-300">
        <span className="material-symbols-outlined transition-transform group-hover:scale-110">folder_open</span>
        <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">مشاريعي</div>
      </button>
      
      <button onClick={() => setIsModalOpen(true)} className="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5">
        <span className="material-symbols-outlined">chair</span>
        <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity text-primary font-bold">إضافة أثاث</div>
      </button>
      <button onClick={() => setIsMaterialPaletteOpen(true)} className="group relative w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-secondary-container/80 transition-all duration-300">
        <span className="material-symbols-outlined transition-transform group-hover:scale-110">palette</span>
        <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">مكتبة الألوان</div>
      </button>
      <button onClick={() => window.dispatchEvent(new CustomEvent('rwaq-snapshot'))} className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-secondary-container/50 transition-all" title="لقطة شاشة">
        <span className="material-symbols-outlined">camera_alt</span>
      </button>
      <button onClick={() => setIsARModalOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-secondary-container/50 transition-all" title="الواقع المعزز">
        <span className="material-symbols-outlined">view_in_ar</span>
      </button>
      <button onClick={() => setIsChatbotOpen(true)} className="group relative w-12 h-12 flex items-center justify-center rounded-full text-primary hover:bg-primary/10 transition-all" title="المساعد الذكي">
        <span className="material-symbols-outlined transition-transform group-hover:scale-110">smart_toy</span>
        <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">المساعد الذكي (AI)</div>
      </button>
      <div className="w-8 h-px bg-outline-variant"></div>
      <button 
        onClick={() => {
          setViewMode(viewMode === 'orbit' ? 'fpv' : 'orbit');
          if (viewMode === 'orbit') {
            showToast("🚶‍♂️ وضع التجول مفعل (استخدم W, A, S, D للحركة و الماوس للنظر)");
          } else {
            showToast("🔄 وضع الدوران مفعل");
            resetCamera();
          }
        }} 
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${viewMode === 'fpv' ? 'bg-secondary-container text-on-secondary-container scale-105' : 'text-on-surface-variant hover:bg-secondary-container/50'}`} 
        title={viewMode === 'fpv' ? "إلغاء التجول" : "تجول (Walkthrough)"}
      >
        <span className="material-symbols-outlined">{viewMode === 'fpv' ? "cancel" : "directions_walk"}</span>
      </button>
      <div className="w-8 h-px bg-outline-variant"></div>
      <button onClick={resetCamera} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-all" title="إعادة المنظور">
        <span className="material-symbols-outlined">my_location</span>
      </button>
      
      <div className="w-8 h-px bg-outline-variant/30 my-1"></div>

      {/* Clerk User Button */}
      <div className="group relative w-12 h-12 flex items-center justify-center rounded-xl">
        <UserButton appearance={{ elements: { userButtonAvatarBox: "w-10 h-10 shadow-sm" } }} />
        <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">الحساب الشخصي</div>
      </div>
    </nav>
  );
}
