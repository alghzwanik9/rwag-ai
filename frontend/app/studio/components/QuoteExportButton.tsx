"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { FileDown, Loader2 } from "lucide-react";
import PdfExportTemplate from "@/components/PdfExportTemplate";
import { useFormattedTotalCost, useSceneStore } from "@/lib/useSceneStore";

interface QuoteMeta {
  quoteNumber: string;
  date: string;
}

/**
 * PDF quote export, migrated out of the global Sidebar (hidden on /studio).
 *
 * The quote number and date are minted when the user clicks export, not during
 * render and not in a mount effect: `Math.random()` / `new Date()` during render
 * mismatch on hydration, and doing it on mount stamps a quote number onto every
 * visitor who never exports anything.
 */
export default function QuoteExportButton({ showToast }: { showToast: (msg: string) => void }) {
  const { user } = useUser();
  const sceneItems = useSceneStore((s) => s.sceneItems);
  const formattedTotal = useFormattedTotalCost();

  const [isExporting, setIsExporting] = useState(false);
  const [pdfImageBase64, setPdfImageBase64] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteMeta | null>(null);

  const renderPdf = async (quoteNumber: string) => {
    const element = document.getElementById('pdf-render-template');
    if (!element) throw new Error('Template not found');

    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      0,
      pdfWidth,
      Math.min(pdfHeight, pdf.internal.pageSize.getHeight())
    );
    pdf.save(`Rwaq-AI-Quote-${quoteNumber}.pdf`);
  };

  const handleExport = () => {
    const meta: QuoteMeta = {
      quoteNumber: `RWAQ-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      date: new Date().toLocaleDateString('ar-SA'),
    };

    setQuote(meta);
    setIsExporting(true);
    showToast('⏳ جاري تجهيز عرض السعر...');

    // SnapshotManager (inside the Canvas) answers this with a PNG data URL.
    window.dispatchEvent(
      new CustomEvent('rwaq-get-snapshot-data', {
        detail: {
          callback: (dataUrl: string) => {
            setPdfImageBase64(dataUrl);
            // Give React a frame to paint the snapshot into the hidden template.
            setTimeout(async () => {
              try {
                await renderPdf(meta.quoteNumber);
                showToast('✅ تم تصدير عرض السعر بنجاح');
              } catch (error) {
                console.error('PDF Export Error:', error);
                showToast('❌ حدث خطأ أثناء تصدير PDF');
              } finally {
                setIsExporting(false);
                setPdfImageBase64(null);
              }
            }, 500);
          },
        },
      })
    );
  };

  return (
    <>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 py-2 text-[11px] font-bold text-primary transition-all hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        {isExporting ? 'جاري التصدير...' : 'تصدير عرض السعر (PDF)'}
      </button>

      {quote && (
        <PdfExportTemplate
          designerName={user?.fullName || 'مصمم رواق'}
          quoteNumber={quote.quoteNumber}
          date={quote.date}
          imageBase64={pdfImageBase64}
          sceneItems={sceneItems}
          totalCost={formattedTotal}
        />
      )}
    </>
  );
}
