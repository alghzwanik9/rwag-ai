"use client";

import React from "react";
import { useSceneStore, useFormattedTotalCost, useFormattedBudgetLimit, formatCurrency, SupportedCurrency } from "@/lib/useSceneStore";

export default function PrintReport() {
  const sceneItems = useSceneStore((s) => s.sceneItems);
  const customMaterials = useSceneStore((s) => s.customMaterials);
  const isBudgetExceeded = useSceneStore((s) => s.isBudgetExceeded());
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const formattedTotal = useFormattedTotalCost();
  const formattedBudget = useFormattedBudgetLimit();

  // Only render during print
  return (
    <div className="hidden print:block absolute inset-0 bg-white text-black p-8 font-sans" dir="rtl">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">منصة رواق للذكاء الاصطناعي</h1>
          <h2 className="text-xl text-gray-600">تقرير مواصفات المشروع والمشتريات</h2>
        </div>
        <div className="text-left text-sm text-gray-500 font-mono">
          <p>التاريخ: {new Date().toLocaleDateString("ar-SA")}</p>
          <p>رقم المرجع: {activeSceneId ? activeSceneId.split('-')[0] : 'N/A'}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="border border-gray-300 p-4 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500 mb-1">الميزانية المحددة</p>
          <p className="text-xl font-bold text-gray-800">{formattedBudget}</p>
        </div>
        <div className="border border-gray-300 p-4 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-500 mb-1">التكلفة النهائية الإجمالية</p>
          <p className="text-xl font-bold text-gray-800">{formattedTotal}</p>
        </div>
        <div className="border border-gray-300 p-4 rounded-lg bg-gray-50 flex flex-col justify-center items-start">
          <p className="text-sm text-gray-500 mb-1">حالة المشروع</p>
          {isBudgetExceeded ? (
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold border border-red-200">
              تجاوز الميزانية
            </span>
          ) : (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-200">
              تمت موازنته (ضمن الميزانية)
            </span>
          )}
        </div>
      </div>

      {/* Bill of Materials Table */}
      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">جدول الكميات والمشتريات (BOM)</h3>
      <table className="w-full text-right border-collapse mb-10">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-300">
            <th className="p-3 text-sm font-bold text-gray-700">القطعة (Item)</th>
            <th className="p-3 text-sm font-bold text-gray-700">الماركة (Brand)</th>
            <th className="p-3 text-sm font-bold text-gray-700">اللون / الخامة (Material)</th>
            <th className="p-3 text-sm font-bold text-gray-700">السعر (Price)</th>
            <th className="p-3 text-sm font-bold text-gray-700">الرابط (Link)</th>
          </tr>
        </thead>
        <tbody>
          {sceneItems.map((item, idx) => {
            // Find custom material if applied
            const customMat = customMaterials[item.instanceId];
            const materialDisplay = customMat ? customMat.name : "الافتراضي";
            
            return (
              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3 text-gray-800 font-medium">{item.name}</td>
                <td className="p-3 text-gray-600">{item.brand || "-"}</td>
                <td className="p-3 text-gray-600">
                  <div className="flex items-center gap-2">
                    {customMat && customMat.color && (
                      <span 
                        className="w-4 h-4 rounded-full border border-gray-400 inline-block" 
                        style={{ backgroundColor: customMat.color }}
                      ></span>
                    )}
                    {materialDisplay}
                  </div>
                </td>
                <td className="p-3 text-gray-800 font-bold whitespace-nowrap">
                  {formatCurrency(item.price, item.currency as SupportedCurrency)}
                </td>
                <td className="p-3 text-blue-600 text-sm">
                  {item.thumbnailUrl ? (
                    <a href={item.thumbnailUrl} target="_blank" rel="noopener noreferrer">
                      رابط الشراء
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            );
          })}
          {sceneItems.length === 0 && (
            <tr>
              <td colSpan={5} className="p-6 text-center text-gray-500">
                لا توجد قطع مضافة في هذا المشروع.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div className="fixed bottom-8 left-8 right-8 text-center text-sm text-gray-400 border-t border-gray-200 pt-4">
        تم إنشاء هذا التقرير آلياً بواسطة Rwaq AI Co-pilot — جميع الحقوق محفوظة لشركة رواق © {new Date().getFullYear()}
      </div>
    </div>
  );
}
