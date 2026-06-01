"use client";

import React, { useMemo } from "react";
import { useSceneStore, RwaqMaterial } from "@/lib/useSceneStore";
import { MATERIAL_LIBRARY } from "@/lib/materials";

interface MaterialPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MaterialPalette({ isOpen, onClose }: MaterialPaletteProps) {
  const activeMaterial = useSceneStore((s) => s.activeMaterial);
  const setActiveMaterial = useSceneStore((s) => s.setActiveMaterial);
  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const applyCustomMaterial = useSceneStore((s) => s.applyCustomMaterial);

  const handleMaterialClick = (mat: RwaqMaterial) => {
    if (!selectedObjectId) return;
    setActiveMaterial(mat);
    applyCustomMaterial(selectedObjectId, mat);
  };

  // Group materials by category
  const groupedMaterials = useMemo(() => {
    const groups: Record<string, RwaqMaterial[]> = {
      Fabrics: [],
      Woods: [],
      Metals: [],
    };
    MATERIAL_LIBRARY.forEach((mat) => {
      groups[mat.category].push(mat);
    });
    return groups;
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Sidebar Panel */}
      <div 
        className="fixed top-0 right-0 h-full w-[340px] bg-white border-l border-[#E0E0E0] shadow-2xl z-[120] flex flex-col animate-slide-in-right"
      >
        <div className="p-6 border-b border-[#E0E0E0] flex items-center justify-between bg-[#F5F7FA]">
          <div className="flex items-center gap-2 text-[#4A90E2]">
            <span className="material-symbols-outlined">palette</span>
            <h2 className="font-headline-sm font-bold text-[#1E1E1E]">الخامات والألوان</h2>
          </div>
          <button 
            onClick={onClose}
            className="material-symbols-outlined p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            close
          </button>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
          {!selectedObjectId && (
            <div className="bg-[#F5F7FA] text-gray-600 p-3 rounded-lg mb-6 flex items-start gap-2 text-sm border border-[#E0E0E0]">
              <span className="material-symbols-outlined text-[18px]">touch_app</span>
              <p>اضغط على أي قطعة أثاث في المشهد الثلاثي الأبعاد لتخصيص خاماتها.</p>
            </div>
          )}

          <div className="space-y-8">
            {Object.entries(groupedMaterials).map(([category, materials]) => (
              <div key={category}>
                <h3 className="font-label-lg font-bold text-gray-500 mb-4 border-b border-[#E0E0E0] pb-2">
                  {category === 'Fabrics' ? 'الأقمشة والمخمل' : category === 'Woods' ? 'الأخشاب الطبيعية' : 'المعادن'}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {materials.map((mat) => {
                    const isActive = activeMaterial?.id === mat.id;
                    return (
                      <button
                        key={mat.id}
                        onClick={() => handleMaterialClick(mat)}
                        className={`flex flex-col items-center gap-2 group transition-all ${!selectedObjectId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!selectedObjectId}
                        title={mat.name}
                      >
                        {/* Swatch Circle */}
                        <div 
                          className={`w-16 h-16 rounded-full shadow-inner border-2 transition-transform ${isActive ? 'border-[#4A90E2] scale-110 shadow-md' : 'border-[#E0E0E0] group-hover:scale-105'}`}
                          style={{
                            backgroundColor: mat.color,
                            backgroundImage: mat.textureUrl ? `url(${mat.textureUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            // Basic visual hint of material type
                            boxShadow: mat.metalness && mat.metalness > 0.5 ? 'inset 0 0 10px rgba(255,255,255,0.8)' : 'inset 0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                        <span className={`text-[11px] font-label-sm text-center ${isActive ? 'text-[#4A90E2] font-bold' : 'text-gray-500'}`}>
                          {mat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}
