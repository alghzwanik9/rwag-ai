"use client";

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
  onUploadFloorplan?: () => void;
  onOpenFurnitureLibrary?: () => void;
}

/**
 * Toolbar floating over the bottom-centre of the canvas.
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
  onUploadFloorplan,
  onOpenFurnitureLibrary,
}: SceneToolbarProps) {
  const actions = [
    { icon: 'undo', label: 'تراجع (Ctrl+Z)', onClick: onUndo, active: false },
    { icon: 'redo', label: 'إعادة (Ctrl+Y)', onClick: onRedo, active: false },
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
      highlight: true,
    },
    {
      icon: 'auto_awesome',
      label: isAIRendering ? 'جاري المعالجة السينمائية...' : 'رندرة سينمائية واقعية (AI Render)',
      onClick: onAIRender || (() => {}),
      active: isAIRendering,
      highlight: true,
    },
    {
      icon: 'alt_route',
      label: showWalkwayHeatmap ? 'إخفاء مسارات الحركة' : 'مخطط مسارات الحركة (≥ 0.90م)',
      onClick: onToggleWalkwayHeatmap || (() => {}),
      active: showWalkwayHeatmap,
    },
    {
      icon: viewMode === 'fpv' ? 'cancel' : 'directions_walk',
      label: viewMode === 'fpv' ? 'إنهاء التجول' : 'وضع التجول',
      onClick: onToggleViewMode,
      active: viewMode === 'fpv',
    },
    { icon: 'filter_center_focus', label: 'إعادة ضبط المنظور', onClick: onResetView, active: false },
    { icon: 'photo_camera', label: 'لقطة شاشة', onClick: onScreenshot, active: false },
  ];

  return (
    <div
      className={`pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 ${Z.sceneToolbar}`}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-outline-variant/50 bg-surface/85 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl">
        {actions.map((action) => (
          <button
            key={action.icon}
            type="button"
            onClick={action.onClick}
            aria-label={action.label}
            title={action.label}
            className={`group/tool relative flex h-11 w-11 items-center justify-center rounded-xl transition-all active:scale-95 ${
              action.active
                ? action.highlight
                  ? 'bg-rwaq-gold text-black shadow-md animate-pulse'
                  : 'bg-primary text-on-primary shadow-sm'
                : action.highlight
                ? 'text-rwaq-gold hover:bg-rwaq-gold/15'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[21px]">{action.icon}</span>
            {/*
              Named group, not a bare one. `group-hover:` compiles to
              `:is(:where(.group):hover *)`, which matches a descendant of ANY
              hovered ancestor carrying `group` — so a bare variant here lit all
              five tooltips at once whenever the pointer was over the canvas.
            */}
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-inverse-surface px-2.5 py-1 text-[11px] font-bold text-inverse-on-surface opacity-0 shadow-lg transition-opacity group-hover/tool:opacity-100">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
