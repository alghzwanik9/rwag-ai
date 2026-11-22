"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSceneStore, useFormattedTotalCost, useFormattedBudgetLimit } from "@/lib/useSceneStore";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from 'react';
import PdfExportTemplate from './PdfExportTemplate';
import { FileDown, Loader2, X } from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

interface NavLinkItem {
  href: string;
  icon: string;
  label: string;
}

const CORE_NAV_ITEMS: NavLinkItem[] = [
  { href: '/', icon: 'home', label: 'الرئيسية' },
  { href: '/studio', icon: 'view_in_ar', label: 'الاستوديو 3D' },
  { href: '/studio2d', icon: 'grid_view', label: 'الاستوديو 2D' },
  { href: '/maarad', icon: 'photo_library', label: 'معرض الغرف' },
  { href: '/library', icon: 'architecture', label: 'المعايير المعمارية' },
];

const WORKSPACE_NAV_ITEMS: NavLinkItem[] = [
  { href: '/projects', icon: 'folder_open', label: 'المشاريع' },
  { href: '/assets', icon: 'category', label: 'الأصول' },
  { href: '/team', icon: 'group', label: 'الفريق' },
  { href: '/settings', icon: 'settings', label: 'الإعدادات' },
];

const COLOR_SWATCHES = [
  { id: 'beige', hex: '#F5F5DC', label: 'بيج' },
  { id: 'dark', hex: '#333333', label: 'رمادي غامق' },
  { id: 'navy', hex: '#000080', label: 'كحلي' },
  { id: 'brown', hex: '#8B4513', label: 'بني' },
  { id: 'reset', hex: '', label: 'الأصلي' },
];

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const isBudgetExceeded = useSceneStore((s) => s.isBudgetExceeded);
  const formattedTotal = useFormattedTotalCost();
  const formattedBudget = useFormattedBudgetLimit();
  const selectedAssetId = useSceneStore((s) => s.selectedAssetId);
  const updateSceneItem = useSceneStore((s) => s.updateSceneItem);
  const sceneItems = useSceneStore((s) => s.sceneItems);

  const [isExporting, setIsExporting] = useState(false);
  const [pdfImageBase64, setPdfImageBase64] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      setQuoteNumber(`RWAQ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
      setCurrentDate(new Date().toLocaleDateString('ar-SA'));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mobileOpen || !onClose) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onClose]);

  const exportRoomToPDF = () => {
    setIsExporting(true);
    window.dispatchEvent(new CustomEvent('show-toast', { detail: "⏳ جاري تجهيز عرض السعر..." }));

    window.dispatchEvent(new CustomEvent('rwaq-get-snapshot-data', {
      detail: {
        callback: (dataUrl: string) => {
          setPdfImageBase64(dataUrl);

          setTimeout(async () => {
            try {
              const element = document.getElementById('pdf-render-template');
              if (!element) throw new Error("Template not found");

              const { default: html2canvas } = await import('html2canvas');
              const { default: jsPDF } = await import('jspdf');

              const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
              const imgData = canvas.toDataURL('image/png');

              const pdf = new jsPDF('p', 'mm', 'a4');
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

              pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
              pdf.save(`Rwaq-AI-Quote-${quoteNumber}.pdf`);

              window.dispatchEvent(new CustomEvent('show-toast', { detail: "✅ تم تصدير عرض السعر بنجاح" }));
            } catch (error) {
              console.error("PDF Export Error:", error);
              window.dispatchEvent(new CustomEvent('show-toast', { detail: "❌ حدث خطأ أثناء تصدير PDF" }));
            } finally {
              setIsExporting(false);
              setPdfImageBase64(null);
            }
          }, 500);
        }
      }
    }));
  };

  if (pathname.startsWith('/ar/')) {
    return null;
  }

  const navItemClass = (path: string) => {
    const isActive =
      path === '/'
        ? pathname === '/'
        : pathname === path || pathname.startsWith(`${path}/`);
    return `flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-lg ${
      isActive
        ? 'text-on-secondary bg-secondary-container border-r-2 border-secondary font-bold scale-[0.99]'
        : 'text-on-primary-container hover:bg-white/10'
    }`;
  };

  const renderSidebarContent = (isDrawer: boolean) => (
    <>
      <div className="mb-6 px-3 flex items-center justify-between gap-2">
        <Link href="/" onClick={() => onClose?.()} className="block">
          <h1 className="font-headline-md text-headline-md text-on-primary leading-tight font-bold">رواق</h1>
          <p className="font-label-md text-label-md text-on-primary-container opacity-80">للتصميم الداخلي</p>
        </Link>
        {isDrawer && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="p-2 rounded-lg text-on-primary-container hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="grow space-y-5 overflow-y-auto pl-1" aria-label="التنقل الرئيسي">
        <div className="space-y-1">
          <p className="px-4 text-[11px] font-bold tracking-wide text-on-primary-container/60 mb-1.5">
            التصميم والمعرفة
          </p>
          {CORE_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={navItemClass(item.href)}
            >
              <span className="material-symbols-outlined text-[20px]" data-icon={item.icon}>
                {item.icon}
              </span>
              <span className="font-body-md text-sm">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="space-y-1 pt-2 border-t border-white/10">
          <p className="px-4 text-[11px] font-bold tracking-wide text-on-primary-container/60 mb-1.5">
            مساحة العمل
          </p>
          {WORKSPACE_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={navItemClass(item.href)}
            >
              <span className="material-symbols-outlined text-[20px]" data-icon={item.icon}>
                {item.icon}
              </span>
              <span className="font-body-md text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Smart Economy Widget inside Sidebar */}
      <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
        <h3 className="font-label-sm text-on-primary-container uppercase mb-3">مراقبة التكاليف</h3>
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-primary-container">الميزانية</span>
            <span className="font-bold text-on-primary text-sm">{formattedBudget}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-primary-container">التكلفة</span>
            <span className={`font-bold text-sm ${isBudgetExceeded() ? "text-error" : "text-secondary"}`}>
              {formattedTotal}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={exportRoomToPDF}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 bg-secondary/20 hover:bg-secondary/30 text-on-primary border border-secondary/40 py-2.5 rounded-lg font-label-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {isExporting ? "جاري التصدير..." : "تصدير عرض السعر (PDF)"}
        </button>
      </div>

      {/* Dynamic Color Swap (Only shows when an asset is selected) */}
      {selectedAssetId && (
        <div className="p-4 bg-white/5 rounded-xl border border-[#E17055]/30 mt-3 shadow-[0_0_15px_rgba(225,112,85,0.1)]">
          <h3 className="font-label-sm text-[#E17055] uppercase mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">palette</span>
            تخصيص لون القطعة
          </h3>
          <div className="flex gap-3 justify-center">
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => updateSceneItem(selectedAssetId, { color: color.hex || undefined })}
                className="w-8 h-8 rounded-full border-2 border-white/20 hover:scale-110 transition-transform relative group flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: color.hex || 'transparent' }}
                title={color.label}
              >
                {!color.hex && (
                  <span className="material-symbols-outlined text-white text-[14px]">format_color_reset</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3 shrink-0">
        {user?.imageUrl ? (
          <Image src={user.imageUrl} width={40} height={40} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold">
            {user?.firstName?.charAt(0) || "ر"}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-label-sm text-label-sm text-on-primary truncate">{user?.fullName || "مصمم رواق"}</p>
          <p className="text-[10px] text-on-primary-container">مصمم رئيسي</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop persistent RTL sidebar */}
      <aside className="hidden md:flex fixed top-0 right-0 h-full w-[280px] flex-col z-50 bg-primary-container dark:bg-tertiary-container border-l border-outline-variant p-stack-md overflow-y-auto">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile slide-over RTL drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-start" dir="rtl">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => onClose?.()}
            className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
          />
          <aside className="relative z-10 h-full w-[280px] max-w-[85vw] flex flex-col bg-primary-container dark:bg-tertiary-container border-l border-outline-variant p-stack-md overflow-y-auto shadow-2xl">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Single hidden PDF export template */}
      {isMounted && (
        <PdfExportTemplate
          designerName={user?.fullName || "مصمم رواق"}
          quoteNumber={quoteNumber}
          date={currentDate}
          imageBase64={pdfImageBase64}
          sceneItems={sceneItems}
          totalCost={formattedTotal}
        />
      )}
    </>
  );
}
