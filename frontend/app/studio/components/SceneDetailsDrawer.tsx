"use client";

import { useState } from "react";
import {
  formatCurrency,
  useFormattedBudgetLimit,
  useFormattedTotalCost,
  useSceneStore,
  type SupportedCurrency,
} from "@/lib/useSceneStore";
import type { TemplateType } from "@/lib/templates";
import { REGION, Z } from "../config/regions";
import QuoteExportButton from "./QuoteExportButton";
import SceneSettingsPanel from "./SceneSettingsPanel";

type DrawerTab = 'scene' | 'settings';

const TEMPLATES: { id: TemplateType; icon: string; label: string }[] = [
  { id: 'LivingRoom', icon: 'weekend', label: 'غرفة معيشة' },
  { id: 'Bedroom', icon: 'bed', label: 'غرفة نوم' },
  { id: 'Kitchen', icon: 'countertops', label: 'مطبخ وطعام' },
];

const ITEM_COLORS = [
  { id: 'beige', hex: '#F5F5DC', label: 'بيج' },
  { id: 'dark', hex: '#333333', label: 'رمادي غامق' },
  { id: 'navy', hex: '#000080', label: 'كحلي' },
  { id: 'brown', hex: '#8B4513', label: 'بني' },
  { id: 'reset', hex: '', label: 'الأصلي' },
];

const SUPPORTED: SupportedCurrency[] = ['SAR', 'USD', 'AED', 'EGP', 'KWD'];

/** SceneItem.currency is a loose `string`; fall back to SAR for anything else. */
function asCurrency(value: string | undefined): SupportedCurrency {
  return SUPPORTED.includes(value as SupportedCurrency) ? (value as SupportedCurrency) : 'SAR';
}

function SceneItemList() {
  const sceneItems = useSceneStore((s) => s.sceneItems);
  const removeSceneItem = useSceneStore((s) => s.removeSceneItem);
  const selectedAssetId = useSceneStore((s) => s.selectedAssetId);
  const setSelectedAssetId = useSceneStore((s) => s.setSelectedAssetId);

  if (sceneItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant/60 py-6 text-center">
        <span className="material-symbols-outlined mb-1 block text-3xl text-on-surface-variant/30">
          inventory_2
        </span>
        <p className="text-[11px] text-on-surface-variant">لا توجد قطع في المشهد بعد.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {sceneItems.map((item) => (
        <li
          key={item.instanceId}
          className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all ${
            selectedAssetId === item.instanceId
              ? 'border-primary bg-primary/5'
              : 'border-outline-variant/40 hover:bg-surface-container-high'
          }`}
        >
          <button
            onClick={() => setSelectedAssetId(item.instanceId)}
            className="flex grow items-center gap-2 overflow-hidden text-right"
          >
            <span className="grow truncate text-[12px] font-bold text-on-surface">{item.name}</span>
            <span
              className={`shrink-0 font-plex-mono text-[11px] ${
                item.price > 0 ? 'text-on-surface-variant' : 'text-amber-600'
              }`}
              title={item.price > 0 ? undefined : 'السعر غير متوفر في المكتبة'}
            >
              {formatCurrency(item.price, asCurrency(item.currency))}
            </span>
          </button>
          <button
            onClick={() => removeSceneItem(item.instanceId)}
            aria-label={`حذف ${item.name}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-on-surface-variant/60 transition-colors hover:bg-error/10 hover:text-error"
          >
            <span className="material-symbols-outlined text-[15px]">delete</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SelectedItemColors() {
  const selectedAssetId = useSceneStore((s) => s.selectedAssetId);
  const updateSceneItem = useSceneStore((s) => s.updateSceneItem);

  if (!selectedAssetId) return null;

  return (
    <div className="mb-4 rounded-xl border border-outline-variant/40 bg-surface-container-low p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase text-on-surface-variant">
        <span className="material-symbols-outlined text-[14px]">palette</span>
        لون القطعة المحددة
      </p>
      <div className="flex justify-between gap-2">
        {ITEM_COLORS.map((color) => (
          <button
            key={color.id}
            onClick={() => updateSceneItem(selectedAssetId, { color: color.hex || undefined })}
            title={color.label}
            aria-label={color.label}
            className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-outline-variant/40 transition-transform hover:scale-110"
            style={{ backgroundColor: color.hex || 'transparent' }}
          >
            {!color.hex && (
              <span className="material-symbols-outlined text-[13px] text-on-surface-variant">
                format_color_reset
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function CostSummary({ showToast }: { showToast: (msg: string) => void }) {
  const isBudgetExceeded = useSceneStore((s) => s.isBudgetExceeded);
  const formattedTotal = useFormattedTotalCost();
  const formattedBudget = useFormattedBudgetLimit();

  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-3">
      <p className="mb-2.5 text-[10px] font-bold uppercase text-on-surface-variant">مراقبة التكاليف</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-on-surface-variant">الميزانية</span>
          <span className="font-plex-mono text-[12px] font-bold text-on-surface">{formattedBudget}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-on-surface-variant">التكلفة</span>
          <span
            className={`font-plex-mono text-[14px] font-bold ${
              isBudgetExceeded() ? 'text-error' : 'text-secondary'
            }`}
          >
            {formattedTotal}
          </span>
        </div>
      </div>

      <QuoteExportButton showToast={showToast} />
    </div>
  );
}

interface SceneActionsProps {
  onOpenFurnitureLibrary: () => void;
  onOpenMaterialPalette: () => void;
  onOpenAudit: () => void;
  onOpenAR: () => void;
  onLoadTemplate: (type: TemplateType) => void;
  modelUrl: string | null;
}

function SceneActions({
  onOpenFurnitureLibrary,
  onOpenMaterialPalette,
  onOpenAudit,
  onOpenAR,
  onLoadTemplate,
  modelUrl,
}: SceneActionsProps) {
  return (
    <>
      {/* Actions relocated out of the fourteen-icon rail. */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={onOpenFurnitureLibrary}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-2 py-2.5 text-[11px] font-bold text-on-primary transition-all hover:opacity-90 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">chair</span>
          إضافة أثاث
        </button>
        <button
          onClick={onOpenMaterialPalette}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant px-2 py-2.5 text-[11px] font-bold text-on-surface transition-colors hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[16px]">palette</span>
          الخامات
        </button>
        <button
          onClick={onOpenAudit}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-2 py-2.5 text-[11px] font-bold text-amber-700 transition-colors hover:bg-amber-500/20"
        >
          <span className="material-symbols-outlined text-[16px]">verified_user</span>
          الفحص المعماري
        </button>
        <button
          onClick={onOpenAR}
          title={
            modelUrl
              ? 'عرض المشهد بالواقع المعزز'
              : 'الواقع المعزز يعرض ملف المشروع المحفوظ فقط'
          }
          className="flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant px-2 py-2.5 text-[11px] font-bold text-on-surface transition-colors hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
          الواقع المعزز
        </button>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[10px] font-bold uppercase text-on-surface-variant">قوالب جاهزة</p>
        <div className="flex gap-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onLoadTemplate(t.id)}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-outline-variant/50 py-2 text-[10px] font-bold text-on-surface transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

interface SceneDetailsDrawerProps extends SceneActionsProps {
  isOpen: boolean;
  onToggle: () => void;
  showToast: (msg: string) => void;
}

/**
 * Left drawer: scene contents, costs, and the actions that used to crowd the
 * icon rail. Overlays the canvas rather than insetting it, so toggling never
 * resizes the WebGL surface. Collapsed by default.
 */
export default function SceneDetailsDrawer({
  isOpen,
  onToggle,
  showToast,
  ...actions
}: SceneDetailsDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('scene');
  const sceneItems = useSceneStore((s) => s.sceneItems);

  return (
    <>
      <aside
        className={`${REGION.drawer} ${Z.region} flex flex-col border-r border-outline-variant/60 bg-surface shadow-[8px_0_32px_rgba(0,0,0,0.08)] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        dir="rtl"
        aria-hidden={!isOpen}
      >
        <div className="flex shrink-0 border-b border-outline-variant/50">
          {[
            { id: 'scene' as DrawerTab, icon: 'view_list', label: 'المشهد' },
            { id: 'settings' as DrawerTab, icon: 'tune', label: 'الإعدادات' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-[12px] font-bold transition-colors ${
                tab === t.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'settings' ? (
          <SceneSettingsPanel showToast={showToast} />
        ) : (
          <div className="grow overflow-y-auto p-3">
            <SceneActions {...actions} />

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">قطع المشهد</p>
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-plex-mono text-[10px] text-on-surface-variant">
                  {sceneItems.length}
                </span>
              </div>
              <SceneItemList />
            </div>

            <SelectedItemColors />
            <CostSummary showToast={showToast} />
          </div>
        )}
      </aside>

      {/* Collapse handle, pinned to the drawer's outer edge. */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'إخفاء تفاصيل المشهد' : 'إظهار تفاصيل المشهد'}
        title={isOpen ? 'إخفاء تفاصيل المشهد' : 'إظهار تفاصيل المشهد'}
        className={`fixed top-1/2 flex h-16 w-7 -translate-y-1/2 items-center justify-center rounded-r-xl border border-l-0 border-outline-variant/60 bg-surface text-on-surface-variant shadow-lg transition-all duration-300 hover:text-primary ${Z.region} ${
          isOpen ? 'left-[320px]' : 'left-0'
        }`}
      >
        <span className="material-symbols-outlined text-[19px]">
          {isOpen ? 'chevron_left' : 'chevron_right'}
        </span>
      </button>
    </>
  );
}
