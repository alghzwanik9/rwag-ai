"use client";

import React from 'react';
import { SceneItem, SupportedCurrency, formatCurrency } from '@/lib/useSceneStore';
import Image from 'next/image';

interface PdfExportTemplateProps {
  designerName: string;
  quoteNumber: string;
  date: string;
  imageBase64: string | null;
  sceneItems: SceneItem[];
  totalCost: string;
}

export default function PdfExportTemplate({
  designerName,
  quoteNumber,
  date,
  imageBase64,
  sceneItems,
  totalCost
}: PdfExportTemplateProps) {
  
  // Group items by asset id
  const groupedItems = sceneItems.reduce((acc, item) => {
    if (!acc[item.id]) {
      acc[item.id] = { ...item, quantity: 1 };
    } else {
      acc[item.id].quantity += 1;
    }
    return acc;
  }, {} as Record<string, SceneItem & { quantity: number }>);
  
  const itemsList = Object.values(groupedItems);

  return (
    <div 
      id="pdf-render-template" 
      dir="rtl"
      className="bg-white text-gray-900"
      style={{ 
        position: 'absolute', 
        left: '-9999px', 
        top: '0', 
        width: '210mm', // A4 width
        minHeight: '297mm', // A4 height
        padding: '20mm', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: -100
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">رواق AI</h1>
          <h2 className="text-2xl text-gray-600">عرض سعر تصميم داخلي</h2>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <p className="text-sm text-gray-500"><span className="font-bold text-gray-700 ml-2">رقم العرض:</span> <span className="font-mono">{quoteNumber}</span></p>
          <p className="text-sm text-gray-500"><span className="font-bold text-gray-700 ml-2">التاريخ:</span> <span className="font-mono">{date}</span></p>
          <p className="text-sm text-gray-500"><span className="font-bold text-gray-700 ml-2">المصمم:</span> {designerName}</p>
        </div>
      </div>

      {/* 3D Snapshot */}
      {imageBase64 && (
        <div className="mb-10 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <Image src={imageBase64} alt="Design Snapshot" width={800} height={600} className="w-full h-auto object-cover max-h-[120mm]" />
        </div>
      )}

      {/* Table */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">تفاصيل القطع</h3>
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 border border-gray-200 text-sm font-bold text-gray-700 w-1/3">القطعة</th>
              <th className="py-3 px-4 border border-gray-200 text-sm font-bold text-gray-700">الماركة</th>
              <th className="py-3 px-4 border border-gray-200 text-sm font-bold text-gray-700">الفئة</th>
              <th className="py-3 px-4 border border-gray-200 text-sm font-bold text-gray-700 text-center">الكمية</th>
              <th className="py-3 px-4 border border-gray-200 text-sm font-bold text-gray-700">السعر (للوحدة)</th>
              <th className="py-3 px-4 border border-gray-200 text-sm font-bold text-gray-700">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {itemsList.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 border border-gray-200 text-sm text-gray-800">{item.name}</td>
                <td className="py-3 px-4 border border-gray-200 text-sm text-gray-600">{item.brand}</td>
                <td className="py-3 px-4 border border-gray-200 text-sm text-gray-600">{item.category}</td>
                <td className="py-3 px-4 border border-gray-200 text-sm text-gray-800 text-center">{item.quantity}</td>
                <td className="py-3 px-4 border border-gray-200 text-sm text-gray-800 font-mono">{formatCurrency(item.price, item.currency as SupportedCurrency)}</td>
                <td className="py-3 px-4 border border-gray-200 text-sm text-gray-800 font-mono font-bold">{formatCurrency(item.price * item.quantity, item.currency as SupportedCurrency)}</td>
              </tr>
            ))}
            {itemsList.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 border border-gray-200">
                  لا توجد قطع مضافة في التصميم
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-6 page-break-inside-avoid">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 w-1/2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 font-bold">المجموع الفرعي</span>
            <span className="font-mono text-gray-800">{totalCost}</span>
          </div>
          <div className="flex justify-between items-center border-t border-gray-200 mt-4 pt-4">
            <span className="text-xl text-gray-800 font-black">الإجمالي التقديري</span>
            <span className="text-2xl font-mono text-blue-700 font-black">{totalCost}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-20 text-center text-sm text-gray-400 border-t border-gray-100 pt-6 page-break-inside-avoid">
        <p className="mb-1">هذا العرض تقديري وقد تتغير الأسعار حسب التوافر لدى الموردين.</p>
        <p>تم إنشاؤه بواسطة نظام رواق AI - {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
