"use client";

import React from "react";
import { Z } from "../config/regions";

interface SceneToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  viewMode: 'orbit' | 'fpv';
  onToggleViewMode: () => void;
  onResetView: () => void;
  onScreenshot: () => void;
  showWalkwayHeatmap?: boolean;
  onToggleWalkwayHeatmap?: () => void;
  onAIRender?: () => void;
  isAIRendering?: boolean;
  onExportExecutivePdf?: () => void;
  isExportingPdf?: boolean;
  onUploadFloorplan?: () => void;
  onOpenFurnitureLibrary?: () => void;
}

interface ActionItem {
  icon: string;
  label: string;
  onClick: () => void;
  active: boolean;
  highlight?: boolean;
  groupEnd?: boolean;
}

/**
 * Compact, sleek glassmorphic pill toolbar floating over the bottom-centre of the canvas.
 * Categorized into logical groups: History (Undo/Redo), Creation (Assets/AI/PDF), and Viewport Controls.
 */
export default function SceneToolbar({
  onUndo,
  onRedo,
  viewMode,
  onToggleViewMode,
  onResetView,
  onScreenshot,
  showWalkwayHeatmap = false,
  onToggleWalkwayHeatmap,
  onAIRender,
  isAIRendering = false,
  onExportExecutivePdf,
  isExportingPdf = false,
  onUploadFloorplan,
  onOpenFurnitureLibrary,
}: SceneToolbarProps) {
  const actions: ActionItem[] = [
    // ── Group 1: Undo / Redo ──
    { icon: 'undo', label: 'تراجع (Ctrl+Z)', onClick: onUndo, active: false },
    { icon: 'redo', label: 'إعادة (Ctrl+Y)', onClick: onRedo, active: false, groupEnd: true },

    // ── Group 2: Scene Building & AI ──
    {
      icon: 'chair',
      label: 'إضافة أثاث من المكتبة',
      onClick: onOpenFurnitureLibrary || (() => {}),
      active: false,
      highlight: true,
    },
    {
      icon: 'architecture',
      label: 'رفع مخطط 2D إلى 3D',
      onClick: onUploadFloorplan || (() => {}),
      active: false,
    },
    {
      icon: 'auto_awesome',
      label: isAIRendering ? 'جاري المعالجة السينمائية...' : 'رندرة سينمائية واقعية (AI Render)',
      onClick: onAIRender || (() => {}),
      active: isAIRendering,
      highlight: true,
    },
    {
      icon: isExportingPdf ? 'sync' : 'receipt_long',
      label: isExportingPdf ? 'جاري استخراج المخطط والـ BOQ...' : 'تصدير المخطط التنفيذي وجدول الكميات (PDF)',
      onClick: onExportExecutivePdf || (() => {}),
      active: isExportingPdf,
      groupEnd: true,
    },

    // ── Group 3: Viewport & Inspection ──
    {
      icon: 'alt_route',
      label: showWalkwayHeatmap ? 'إخفاء مسارات الحركة' : 'مخطط مسارات الحركة (كود SBC ≥ 0.90م)',
      onClick: onToggleWalkwayHeatmap || (() => {}),
      active: showWalkwayHeatmap,
    },
    {
      icon: viewMode === 'fpv' ? 'cancel' : 'directions_walk',
      label: viewMode === 'fpv' ? 'إنهاء التجول' : 'وضع التجول (FPV)',
      onClick: onToggleViewMode,
      active: viewMode === 'fpv',
    },
    { icon: 'filter_center_focus', label: 'إعادة ضبط المنظور', onClick: onResetView, active: false },
    { icon: 'photo_camera', label: 'لقطة شاشة', onClick: onScreenshot, active: false },
  ];

  return (
    <div
      className={`pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 ${Z.sceneToolbar} z-30 select-none`}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-outline-variant/60 dark:border-white/10 bg-surface/90 dark:bg-[#121620]/90 px-2 py-1 shadow-[0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        {actions.map((action, idx) => (
          <React.Fragment key={action.icon + idx}>
            <button
              type="button"
              onClick={action.onClick}
              aria-label={action.label}
              className={`group/tool relative flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95 ${
                action.active
                  ? action.highlight
                    ? 'bg-rwaq-gold text-black shadow-md'
                    : 'bg-primary text-on-primary shadow-xs'
                  : action.highlight
                  ? 'text-rwaq-gold hover:bg-rwaq-gold/15'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span className={`material-symbols-outlined text-[19px] ${action.active && action.highlight ? 'animate-spin' : ''}`}>
                {action.icon}
              </span>

              {/* Sleek Tooltip */}
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-inverse-surface px-2.5 py-1 text-[11px] font-bold text-inverse-on-surface opacity-0 shadow-xl transition-all duration-150 group-hover/tool:opacity-100 group-hover/tool:-translate-y-0.5 z-50 border border-white/10">
                {action.label}
              </span>
            </button>

            {/* Subtle Group Divider */}
            {action.groupEnd && (
              <div className="mx-0.5 h-4 w-px bg-outline-variant/40 dark:bg-white/10" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
