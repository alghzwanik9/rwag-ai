"use client";

import { UserButton } from "@clerk/nextjs";
import { REGION, Z } from "../config/regions";

interface StudioHeaderProps {
  /** Promoted primary action. Was a dead button at the bottom of the global sidebar. */
  onNewProject: () => void;
  onOpenProjects: () => void;
}

/**
 * Studio-owned top bar. The global <Header> is hidden on /studio (see
 * ConditionalShell) because it was pinned to `right-[280px]` and rendered
 * underneath the floating sidebar at `right-4`, clipping its own right edge.
 */
export default function StudioHeader({ onNewProject, onOpenProjects }: StudioHeaderProps) {
  return (
    <header
      className={`${REGION.header} ${Z.region} flex items-center justify-between gap-4 border-b border-outline-variant/60 bg-surface/85 px-6 backdrop-blur-xl`}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-headline-md text-headline-md font-bold text-on-surface">رواق</span>
        <span className="text-label-sm text-on-surface-variant">أستوديو التصميم</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-label-md text-label-md text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          مشروع جديد
        </button>

        <button
          onClick={onOpenProjects}
          className="flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[18px]">folder_open</span>
          مشاريعي
        </button>

        <div className="mx-1 h-7 w-px bg-outline-variant/60" />

        <UserButton appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 shadow-sm" } }} />
      </div>
    </header>
  );
}
