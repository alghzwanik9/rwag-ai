"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSceneStore, useFormattedTotalCost, useFormattedBudgetLimit } from "@/lib/useSceneStore";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from 'react';
import PdfExportTemplate from './PdfExportTemplate';
import { FileDown, Loader2 } from 'lucide-react';

export default function Sidebar() {
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
    setIsMounted(true);
    setQuoteNumber(`RWAQ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
    setCurrentDate(new Date().toLocaleDateString('ar-SA'));
  }, []);

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
    const isActive = pathname === path;
    return `flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
      isActive 
        ? 'text-on-secondary bg-secondary-container rounded-lg border-r-2 border-secondary scale-[0.98]' 
        : 'text-on-primary-container hover:bg-surface-variant/10'
    }`;
  };

  return (
    <aside className="hidden md:flex fixed right-0 top-0 h-full w-[280px] bg-primary-container dark:bg-tertiary-container border-l border-outline-variant flex-col p-stack-md z-50">
      <div className="mb-10 px-4">
        <h1 className="font-headline-md text-headline-md text-on-primary leading-tight font-bold">رواق</h1>
        <p className="font-label-md text-label-md text-on-primary-container opacity-80">للتصميم الداخلي</p>
      </div>
      <nav className="flex-grow space-y-2">
        <Link href="/projects" className={navItemClass('/projects')}>
          <span className="material-symbols-outlined" data-icon="folder_open">folder_open</span>
          <span className="font-body-md text-body-md">المشاريع</span>
        </Link>
        <Link href="/assets" className={navItemClass('/assets')}>
          <span className="material-symbols-outlined" data-icon="category">category</span>
          <span className="font-body-md text-body-md">الأصول</span>
        </Link>
        <Link href="/team" className={navItemClass('/team')}>
          <span className="material-symbols-outlined" data-icon="group">group</span>
          <span className="font-body-md text-body-md">الفريق</span>
        </Link>
        <Link href="/settings" className={navItemClass('/settings')}>
          <span className="material-symbols-outlined" data-icon="settings">settings</span>
          <span className="font-body-md text-body-md">الإعدادات</span>
        </Link>
      </nav>

      {/* Smart Economy Widget inside Sidebar */}
      <div className="mt-auto p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
        <h3 className="font-label-sm text-on-primary-container uppercase mb-3">مراقبة التكاليف</h3>
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-primary-container">الميزانية</span>
            <span className="font-bold text-on-primary">{formattedBudget}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-on-primary-container">التكلفة</span>
            <span className={`font-bold ${isBudgetExceeded() ? "text-error" : "text-secondary"}`}>{formattedTotal}</span>
          </div>
        </div>

        <button
          onClick={exportRoomToPDF}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 py-2.5 rounded-lg font-label-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {isExporting ? "جاري التصدير..." : "تصدير عرض السعر (PDF)"}
        </button>
      </div>

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



      {/* Dynamic Color Swap (Only shows when an asset is selected) */}
      {selectedAssetId && (
        <div className="p-4 bg-white/5 rounded-xl border border-[#E17055]/30 mb-4 shadow-[0_0_15px_rgba(225,112,85,0.1)]">
          <h3 className="font-label-sm text-[#E17055] uppercase mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">palette</span>
            تخصيص لون القطعة
          </h3>
          <div className="flex gap-3 justify-center">
            {[
              { id: 'beige', hex: '#F5F5DC', label: 'بيج' },
              { id: 'dark', hex: '#333333', label: 'رمادي غامق' },
              { id: 'navy', hex: '#000080', label: 'كحلي' },
              { id: 'brown', hex: '#8B4513', label: 'بني' },
              { id: 'reset', hex: '', label: 'الأصلي' }
            ].map(color => (
              <button 
                key={color.id}
                onClick={() => updateSceneItem(selectedAssetId, { color: color.hex || undefined })}
                className="w-8 h-8 rounded-full border-2 border-white/20 hover:scale-110 transition-transform relative group flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: color.hex || 'transparent' }}
                title={color.label}
              >
                {!color.hex && <span className="material-symbols-outlined text-white text-[14px]">format_color_reset</span>}
              </button>
            ))}
          </div>
        </div>
      )}


        
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
        {user?.imageUrl ? (
          <img src={user.imageUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold">
            {user?.firstName?.charAt(0) || "U"}
          </div>
        )}
        <div>
          <p className="font-label-sm text-label-sm text-on-primary">{user?.fullName || "مستخدم"}</p>
          <p className="text-[10px] text-on-primary-container">مصمم رئيسي</p>
        </div>
      </div>
      <div className="pt-2 border-t border-on-primary-container/20">
        <button className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all">
          <span className="material-symbols-outlined" data-icon="add">add</span>
          مشروع جديد
        </button>
      </div>
    </aside>
  );
}
