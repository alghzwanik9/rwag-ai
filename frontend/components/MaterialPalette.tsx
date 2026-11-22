"use client";

import React, { useMemo, useState } from "react";
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
  const selectedAssetId = useSceneStore((s) => s.selectedAssetId);
  const sceneItems = useSceneStore((s) => s.sceneItems);
  const customMaterials = useSceneStore((s) => s.customMaterials);
  const applyCustomMaterial = useSceneStore((s) => s.applyCustomMaterial);
  const removeCustomMaterial = useSceneStore((s) => s.removeCustomMaterial);
  const setWallColor = useSceneStore((s) => s.setWallColor);
  const setFloorColor = useSceneStore((s) => s.setFloorColor);

  const [surfaceTarget, setSurfaceTarget] = useState<'wall' | 'floor'>('wall');

  const selectedAsset = useMemo(
    () => (selectedAssetId ? sceneItems.find((item) => item.instanceId === selectedAssetId) : undefined),
    [sceneItems, selectedAssetId]
  );

  // Furniture instance takes priority if selected, otherwise GLB room mesh
  const targetId = selectedAssetId || selectedObjectId;
  const activeTargetMaterial = targetId ? customMaterials[targetId] ?? activeMaterial : activeMaterial;

  const handleMaterialClick = (mat: RwaqMaterial) => {
    setActiveMaterial(mat);
    if (targetId) {
      applyCustomMaterial(targetId, mat);
      return;
    }
    // Procedural room fallback: apply preset directly to walls or floor so palette is never dead
    if (mat.color) {
      if (surfaceTarget === 'floor') {
        setFloorColor(mat.color);
      } else {
        setWallColor(mat.color);
      }
    }
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
        className="fixed top-0 right-0 h-full w-[340px] bg-white border-l border-[#E0E0E0] shadow-2xl z-120 flex flex-col animate-slide-in-right"
        dir="rtl"
      >
        <div className="p-6 border-b border-[#E0E0E0] flex items-center justify-between bg-[#F5F7FA]">
          <div className="flex items-center gap-2 text-[#4A90E2]">
            <span className="material-symbols-outlined">palette</span>
            <h2 className="font-headline-sm font-bold text-[#1E1E1E]">الخامات والألوان</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق لوحة الخامات"
            className="material-symbols-outlined p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            close
          </button>
        </div>

        <div className="p-6 grow overflow-y-auto">
          {targetId ? (
            <div className="bg-blue-50/70 text-[#1E1E1E] p-3 rounded-xl mb-6 flex items-center justify-between gap-2 text-xs border border-blue-200/70">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[18px] text-[#4A90E2] shrink-0">check_circle</span>
                <p className="truncate font-bold">
                  {selectedAsset ? `القطعة المحددة: ${selectedAsset.name}` : `العنصر المحدد: ${selectedObjectId}`}
                </p>
              </div>
              {customMaterials[targetId] && (
                <button
                  type="button"
                  onClick={() => {
                    removeCustomMaterial(targetId);
                    setActiveMaterial(null);
                  }}
                  className="shrink-0 text-[11px] font-bold text-[#4A90E2] hover:underline"
                >
                  استعادة
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#F5F7FA] text-gray-700 p-3.5 rounded-xl mb-6 border border-[#E0E0E0] space-y-3">
              <div className="flex items-start gap-2 text-xs">
                <span className="material-symbols-outlined text-[18px] text-[#4A90E2] shrink-0">touch_app</span>
                <p>اختر قطعة أثاث في المشهد لتخصيص خامتها، أو طبّق اللون مباشرة على أسطح الغرفة:</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSurfaceTarget('wall')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                    surfaceTarget === 'wall'
                      ? 'bg-[#4A90E2] text-white border-[#4A90E2]'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  تطبيق على الجدران
                </button>
                <button
                  type="button"
                  onClick={() => setSurfaceTarget('floor')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                    surfaceTarget === 'floor'
                      ? 'bg-[#4A90E2] text-white border-[#4A90E2]'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  تطبيق على الأرضية
                </button>
              </div>
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
                    const isActive = activeTargetMaterial?.id === mat.id;
                    return (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => handleMaterialClick(mat)}
                        className="flex flex-col items-center gap-2 group transition-all cursor-pointer"
                        title={mat.name}
                      >
                        {/* Swatch Circle */}
                        <div
                          className={`w-16 h-16 rounded-full shadow-inner border-2 transition-transform ${
                            isActive
                              ? 'border-[#4A90E2] scale-110 shadow-md'
                              : 'border-[#E0E0E0] group-hover:scale-105'
                          }`}
                          style={{
                            backgroundColor: mat.color,
                            backgroundImage: mat.textureUrl ? `url(${mat.textureUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            boxShadow:
                              mat.metalness && mat.metalness > 0.5
                                ? 'inset 0 0 10px rgba(255,255,255,0.8)'
                                : 'inset 0 2px 4px rgba(0,0,0,0.2)',
                          }}
                        />
                        <span
                          className={`text-[11px] font-label-sm text-center ${
                            isActive ? 'text-[#4A90E2] font-bold' : 'text-gray-500'
                          }`}
                        >
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
