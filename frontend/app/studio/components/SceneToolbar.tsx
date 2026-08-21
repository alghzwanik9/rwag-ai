"use client";

import { Z } from "../config/regions";

interface SceneToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  viewMode: 'orbit' | 'fpv';
  onToggleViewMode: () => void;
  onResetView: () => void;
  onScreenshot: () => void;
}

/**
 * Five actions, floating over the bottom-centre of the canvas. Every other
 * action from the old fourteen-icon rail moved into the scene drawer or the
 * header. Each handler here is one that already worked; nothing is a stub.
 */
export default function SceneToolbar({
  onUndo,
  onRedo,
  viewMode,
  onToggleViewMode,
  onResetView,
  onScreenshot,
}: SceneToolbarProps) {
  const actions = [
    { icon: 'undo', label: 'تراجع (Ctrl+Z)', onClick: onUndo, active: false },
    { icon: 'redo', label: 'إعادة (Ctrl+Y)', onClick: onRedo, active: false },
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
                ? 'bg-primary text-on-primary shadow-sm'
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
