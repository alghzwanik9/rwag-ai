"use client";

import React, { useState, useEffect } from "react";
import { useSceneStore } from "@/lib/useSceneStore";

export default function CopilotSuggestions() {
  const [isOpen, setIsOpen] = useState(false);
  const isBudgetExceeded = useSceneStore((s) => s.isBudgetExceeded);
  const recommendations = useSceneStore((s) => s.recommendations);
  const fetchAlternatives = useSceneStore((s) => s.fetchAlternatives);
  const sceneItems = useSceneStore((s) => s.sceneItems);
  const updateSceneItem = useSceneStore((s) => s.updateSceneItem);
  const clearRecommendations = useSceneStore((s) => s.clearRecommendations);

  // Auto-open or prompt when budget exceeded
  useEffect(() => {
    if (isBudgetExceeded() && recommendations.length === 0) {
      // Find the most expensive item to find alternatives for
      if (sceneItems.length > 0) {
        const mostExpensive = sceneItems.reduce((prev, curr) => 
          prev.price > curr.price ? prev : curr
        );
        fetchAlternatives(mostExpensive.instanceId, mostExpensive.price);
      }
    }
  }, [isBudgetExceeded, sceneItems, recommendations.length, fetchAlternatives]);

  if (!isBudgetExceeded() && recommendations.length === 0) {
    return null;
  }

  const handleReplace = (rec: { price: number; brand: string; store_url?: string; sku?: string }) => {
    // Find the item we queried alternatives for (the most expensive one)
    if (sceneItems.length > 0) {
      const mostExpensive = sceneItems.reduce((prev, curr) => 
        prev.price > curr.price ? prev : curr
      );
      
      // Update store
      updateSceneItem(mostExpensive.instanceId, {
        price: rec.price,
        brand: rec.brand,
        store_url: rec.store_url,
        sku: rec.sku,
      });

      // Close panel and clear recommendations as budget might be fixed
      setIsOpen(false);
      clearRecommendations();
    }
  };

  return (
    <>
      {/* Subtle Badge Notification */}
      {!isOpen && isBudgetExceeded() && (
        <div 
          onClick={() => setIsOpen(true)}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-full shadow-lg cursor-pointer hover:bg-red-100 transition-all flex items-center gap-3 backdrop-blur-md"
        >
          <span className="material-symbols-outlined animate-pulse text-[20px]">warning</span>
          <span className="font-label-md font-bold">رواق رصد تجاوزاً للميزانية. اضغط لرؤية بدائل ذكية توفر المال وتناسب تصميمك.</span>
        </div>
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-[380px] bg-white border-r border-[#E0E0E0] shadow-2xl z-[120] transform transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 border-b border-[#E0E0E0] flex items-center justify-between bg-[#F5F7FA]">
          <div className="flex items-center gap-2 text-[#4A90E2]">
            <span className="material-symbols-outlined">auto_awesome</span>
            <h2 className="font-headline-sm font-bold text-[#1E1E1E]">مساعد رواق الذكي</h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="material-symbols-outlined p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            close
          </button>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
          <p className="font-body-md text-gray-600 mb-6 leading-relaxed">
            لقد تجاوزت الميزانية المحددة. بحثنا في المخزون ووجدنا هذه البدائل التي تحافظ على نفس الطابع البصري بتكلفة أقل:
          </p>

          <div className="flex flex-col gap-4">
            {recommendations.length > 0 ? (
              recommendations.map((rec, idx) => (
                <div key={idx} className="bg-white border border-[#E0E0E0] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-label-lg font-bold text-[#1E1E1E]">{rec.brand}</h4>
                      <p className="font-label-sm text-gray-400 text-[11px]">رمز المنتج: {rec.sku}</p>
                    </div>
                    <span className="bg-[#4A90E2]/10 text-[#4A90E2] font-bold px-3 py-1 rounded-full text-sm">
                      {rec.price} {rec.currency}
                    </span>
                  </div>
                  
                  <div className="bg-[#F5F7FA] p-3 rounded-lg border border-[#E0E0E0] mb-4">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="material-symbols-outlined text-[14px] text-[#4A90E2] align-middle ml-1">lightbulb</span>
                      {rec.justification}
                    </p>
                  </div>

                  <button 
                    onClick={() => handleReplace(rec)}
                    className="w-full bg-[#1E1E1E] text-white py-2 rounded-lg font-label-md font-bold hover:bg-black transition-colors flex justify-center items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">published_with_changes</span>
                    استبدال فوري
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-on-surface-variant opacity-70">
                <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                <p className="text-sm">لا توجد بدائل أرخص حالياً</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
