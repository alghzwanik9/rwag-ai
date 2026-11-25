"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { REGION, Z } from "../config/regions";

interface StudioHeaderProps {
  onNewProject: () => void;
  onOpenProjects: () => void;
  onSaveProject?: () => void;
  isSavingProject?: boolean;
  onShareProject?: () => void;
  isSharingProject?: boolean;
  onUploadFloorplan?: () => void;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
}

/**
 * Sleek, compact two-zone top bar with zero horizontal overflow:
 * - Right Zone: Brand logo (رِواق AI) + Segmented mode switcher (استوديو 3D | معرض التصاميم | مشاريعي).
 * - Left Zone: Primary actions (+ جديد, رفع مخطط 2D, حفظ, مشاركة) + "المزيد / تصدير ▾" dropdown menu.
 */
export default function StudioHeader({
  onNewProject,
  onOpenProjects,
  onSaveProject,
  isSavingProject = false,
  onShareProject,
  isSharingProject = false,
  onUploadFloorplan,
  onExportPdf,
  isExportingPdf = false,
}: StudioHeaderProps) {
  const pathname = usePathname();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  return (
    <header
      className={`${REGION.header} ${Z.region} flex items-center justify-between gap-2 sm:gap-4 border-b border-outline-variant/60 bg-surface/90 px-3 sm:px-6 backdrop-blur-xl shrink-0 select-none`}
      dir="rtl"
    >
      {/* ── Right Zone: Brand Logo + Segmented Mode Switcher ── */}
      <div className="flex items-center gap-2.5 sm:gap-5 shrink-0">
        <Link
          href="/"
          className="flex items-baseline gap-1.5 group transition-transform active:scale-95 shrink-0"
          title="رِواق AI - الصفحة الرئيسية"
        >
          <span className="font-headline-md text-base sm:text-lg font-extrabold text-on-surface group-hover:text-primary transition-colors tracking-tight">
            رِواق
          </span>
          <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded-full border border-outline-variant/40">
            AI
          </span>
        </Link>

        {/* Segmented Mode Switcher */}
        <nav className="flex items-center gap-1 bg-surface-container-low/90 p-1 rounded-2xl border border-outline-variant/50 shrink-0">
          <Link
            href="/studio"
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
              pathname === "/studio"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
            <span>استوديو 3D</span>
          </Link>

          <Link
            href="/maarad"
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
              pathname === "/maarad"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-rwaq-gold">auto_awesome</span>
            <span>معرض التصاميم</span>
          </Link>

          <button
            type="button"
            onClick={onOpenProjects}
            className="flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all active:scale-95"
            title="استعراض مشاريعي المحفوظة"
          >
            <span className="material-symbols-outlined text-[16px]">folder_open</span>
            <span>مشاريعي</span>
          </button>
        </nav>
      </div>

      {/* ── Left Zone: High-Contrast Actions & Clean More Dropdown ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* + جديد */}
        <button
          type="button"
          onClick={onNewProject}
          className="flex items-center gap-1 rounded-xl bg-primary px-2.5 sm:px-3 py-1.5 text-xs font-bold text-on-primary shadow-xs transition-all hover:bg-primary/90 active:scale-95"
          title="بدء تصميم جديد"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>جديد</span>
        </button>

        {/* رفع مخطط 2D */}
        {onUploadFloorplan && (
          <button
            type="button"
            onClick={onUploadFloorplan}
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-rwaq-gold/40 bg-rwaq-gold/10 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-rwaq-gold transition-all hover:bg-rwaq-gold/20 active:scale-95 shadow-xs"
            title="رفع مخطط 2D واستخراجه إلى 3D"
          >
            <span className="material-symbols-outlined text-[16px]">architecture</span>
            <span>رفع مخطط 2D</span>
          </button>
        )}

        {/* حفظ */}
        {onSaveProject && (
          <button
            type="button"
            onClick={onSaveProject}
            disabled={isSavingProject}
            className="flex items-center gap-1.5 rounded-xl border border-secondary/50 bg-secondary/15 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-secondary transition-all hover:bg-secondary/25 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
            title="حفظ المشروع سحابياً ومحلياً"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSavingProject ? "animate-spin" : ""}`}>
              {isSavingProject ? "sync" : "save"}
            </span>
            <span>{isSavingProject ? "جاري الحفظ..." : "حفظ"}</span>
          </button>
        )}

        {/* مشاركة */}
        {onShareProject && (
          <button
            type="button"
            onClick={onShareProject}
            disabled={isSharingProject}
            className="flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container-high px-2.5 sm:px-3 py-1.5 text-xs font-bold text-on-surface transition-all hover:border-rwaq-gold/60 hover:text-rwaq-gold active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
            title="مشاركة رابط تفاعلي 3D"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSharingProject ? "animate-spin" : ""}`}>
              {isSharingProject ? "sync" : "share"}
            </span>
            <span>{isSharingProject ? "جاري الإنشاء..." : "مشاركة"}</span>
          </button>
        )}

        {/* ── Dropdown: المزيد / تصدير ▾ ── */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen((v) => !v)}
            aria-expanded={isMoreMenuOpen}
            className={`flex items-center gap-1 rounded-xl border border-outline-variant px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              isMoreMenuOpen
                ? "bg-surface-container-high text-on-surface border-primary/50"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
            title="خيارات التصدير والأدوات الإضافية"
          >
            <span>المزيد / تصدير</span>
            <span className="material-symbols-outlined text-[16px] transition-transform duration-200">
              {isMoreMenuOpen ? "arrow_drop_up" : "arrow_drop_down"}
            </span>
          </button>

          {isMoreMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface/95 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2">
              {/* التقرير التنفيذي PDF */}
              {onExportPdf && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onExportPdf();
                  }}
                  disabled={isExportingPdf}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right text-xs font-bold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[18px] text-primary ${isExportingPdf ? "animate-spin" : ""}`}>
                    {isExportingPdf ? "sync" : "receipt_long"}
                  </span>
                  <div className="flex flex-col text-right">
                    <span>تقرير PDF ومخطط تنفيذي</span>
                    <span className="text-[10px] text-on-surface-variant font-normal">جدول الكميات وكود SBC</span>
                  </div>
                </button>
              )}

              {/* رفع مخطط 2D للجوال / الشاشات الصغيرة إذا كان مخفياً */}
              {onUploadFloorplan && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onUploadFloorplan();
                  }}
                  className="md:hidden flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right text-xs font-bold text-on-surface hover:bg-rwaq-gold/10 hover:text-rwaq-gold transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-rwaq-gold">architecture</span>
                  <span>رفع مخطط 2D إلى 3D</span>
                </button>
              )}

              {/* كتالوج الأثاث */}
              <Link
                href="/assets"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">category</span>
                <div className="flex flex-col text-right">
                  <span>كتالوج الأثاث</span>
                  <span className="text-[10px] text-on-surface-variant font-normal">3,600+ منتج من ايكيا السعودية</span>
                </div>
              </Link>

              {/* استوديو 2D */}
              <Link
                href="/studio2d"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right text-xs font-bold text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">grid_view</span>
                <div className="flex flex-col text-right">
                  <span>الاستوديو 2D</span>
                  <span className="text-[10px] text-on-surface-variant font-normal">مخطط ثنائي الأبعاد ومساقط</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        <div className="mx-0.5 sm:mx-1 h-5 w-px bg-outline-variant/60" />

        <UserButton appearance={{ elements: { userButtonAvatarBox: "w-7 h-7 sm:w-8 sm:h-8 shadow-xs" } }} />
      </div>
    </header>
  );
}
