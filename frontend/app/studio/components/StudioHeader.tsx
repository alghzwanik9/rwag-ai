"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { REGION, Z } from "../config/regions";

interface StudioHeaderProps {
  onNewProject: () => void;
  onOpenProjects: () => void;
  onUploadFloorplan?: () => void;
}

/**
 * Studio-owned top bar with cross-page navigation connecting 3D Studio, 2D Studio,
 * Maarad Gallery, Assets Catalog, and Projects.
 */
export default function StudioHeader({ onNewProject, onOpenProjects, onUploadFloorplan }: StudioHeaderProps) {
  const pathname = usePathname();

  return (
    <header
      className={`${REGION.header} ${Z.region} flex items-center justify-between gap-4 border-b border-outline-variant/60 bg-surface/85 px-6 backdrop-blur-xl`}
      dir="rtl"
    >
      {/* Brand & Page Links */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-baseline gap-2 group transition-transform active:scale-95">
          <span className="font-headline-md text-headline-md font-extrabold text-on-surface group-hover:text-primary transition-colors">
            رواق
          </span>
          <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
            AI
          </span>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-surface-container-low/70 p-1 rounded-2xl border border-outline-variant/40">
          <Link
            href="/studio"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              pathname === "/studio"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
            الاستوديو 3D
          </Link>

          <Link
            href="/studio2d"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              pathname === "/studio2d"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            الاستوديو 2D
          </Link>

          <Link
            href="/maarad"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              pathname === "/maarad"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-rwaq-gold">auto_awesome</span>
            معرض التصاميم
          </Link>

          <Link
            href="/assets"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              pathname === "/assets"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">category</span>
            كتالوج الأثاث
          </Link>
        </nav>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {onUploadFloorplan && (
          <button
            onClick={onUploadFloorplan}
            className="flex items-center gap-1.5 rounded-xl border border-rwaq-gold/40 bg-rwaq-gold/10 px-3.5 py-2 font-label-md text-xs font-bold text-rwaq-gold shadow-xs transition-all hover:bg-rwaq-gold/20 active:scale-95"
            title="رفع مخطط 2D واستخراجه إلى 3D"
          >
            <span className="material-symbols-outlined text-[17px]">architecture</span>
            رفع مخطط 2D
          </button>
        )}

        <button
          onClick={onNewProject}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 font-label-md text-xs font-bold text-on-primary shadow-xs transition-all hover:opacity-95 active:scale-95"
          title="بدء تصميم جديد"
        >
          <span className="material-symbols-outlined text-[17px]">add</span>
          مشروع جديد
        </button>

        <button
          onClick={onOpenProjects}
          className="flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2 font-label-md text-xs font-bold text-on-surface transition-all hover:bg-surface-container-high active:scale-95"
          title="استعراض وإدارة المشاريع المحفوظة"
        >
          <span className="material-symbols-outlined text-[17px]">folder_open</span>
          مشاريعي
        </button>

        <div className="mx-1 h-6 w-px bg-outline-variant/60" />

        <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 shadow-xs" } }} />
      </div>
    </header>
  );
}
