/* cspell:disable */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSceneStore } from "@/lib/useSceneStore";

interface SpatialAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

interface AuditResult {
  status: string;
  spatial_score: number;
  assessment_label: string;
  density_percentage: number;
  recommendations: string[];
  passed_checks: string[];
}

function getScoreColor(score: number): string {
  if (score >= 85) {
    return "text-emerald-600 bg-emerald-50 border-emerald-200";
  }
  if (score >= 70) {
    return "text-amber-600 bg-amber-50 border-amber-200";
  }
  return "text-red-600 bg-red-50 border-red-200";
}

function getDensityBarColor(density: number): string {
  if (density > 45) {
    return "bg-amber-500";
  }
  return "bg-emerald-500";
}

export function SpatialAuditModal({ isOpen, onClose, showToast }: SpatialAuditModalProps) {
  const sceneItems = useSceneStore((s) => s.sceneItems);
  const roomWidth = useSceneStore((s) => s.roomWidth);
  const roomDepth = useSceneStore((s) => s.roomDepth);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const runAudit = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const payload = {
        items: sceneItems.map((item) => ({
          instance_id: item.instanceId,
          asset_id: item.id || item.name,
          name: item.name,
          position: item.position,
          rotation: item.rotation,
          dimensions: item.dimensions || { width: 1.0, height: 1.0, depth: 0.8 }
        })),
        room_width: roomWidth,
        room_depth: roomDepth
      };

      const res = await fetch("/api/v1/spatial-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (res.ok) {
        const data = (await res.json()) as AuditResult;
        setResult(data);
      } else {
        showToast("❌ تعذر إتمام الفحص المعماري.");
      }
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name !== "AbortError") {
        showToast("❌ حدث خطأ أثناء الاتصال بخادم الفحص.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [sceneItems, roomWidth, roomDepth, showToast]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = setTimeout(() => {
      runAudit();
    }, 0);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, runAudit]);

  if (!isOpen) return null;

  const scoreColor = getScoreColor(result?.spatial_score || 0);
  const densityBarColor = getDensityBarColor(result?.density_percentage || 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-xl w-full flex flex-col border border-gray-100 animate-slide-up">
        {/* Header */}
        <div className="p-6 bg-linear-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#4A90E2]/20 rounded-2xl">
              <span className="material-symbols-outlined text-[#4A90E2] text-2xl">verified_user</span>
            </div>
            <div>
              <h3 className="font-black text-lg">الفحص المعماري الذكي (Spatial & Neufert Audit)</h3>
              <p className="text-gray-400 text-xs mt-0.5">تحليل مسارات الحركة والنسب والقياسات الإنسانية عبر وكلاء الذكاء الاصطناعي</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-[#4A90E2] text-5xl animate-spin mb-3">sync</span>
              <p className="font-bold text-gray-800 text-sm">يقوم وكيل الفحص المعماري بدراسة المسافات والتداخلات...</p>
              <p className="text-gray-400 text-xs mt-1">يتم قياس مسارات الحركة وخلوص الأثاث وفق كود Neufert</p>
            </div>
          ) : result ? (
            <>
              {/* Score Card */}
              <div className={`p-5 rounded-2xl border flex items-center justify-between ${scoreColor}`}>
                <div>
                  <span className="text-xs font-bold block mb-1">التقييم المعماري العام:</span>
                  <h4 className="text-2xl font-black">{result.assessment_label}</h4>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black">{result.spatial_score}</span>
                  <span className="text-xs font-bold text-gray-500"> / 100</span>
                </div>
              </div>

              {/* Density Bar */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                  <span>نسبة إشغال الفراغ بالأثاث (Footprint Density):</span>
                  <span className="text-[#4A90E2] font-black">{result.density_percentage}% (المعيار: 25% - 40%)</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${densityBarColor}`}
                    style={{ width: `${Math.min(100, result.density_percentage)}%` }}
                  />
                </div>
              </div>

              {/* Passed Checks */}
              {result.passed_checks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 mb-2.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                    عناصر مطابقة للمعايير الهندسية:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    {result.passed_checks.map((chk, i) => (
                      <li key={i} className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-start gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">done</span>
                        <span className="leading-relaxed">{chk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Recommendations */}
              {result.recommendations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-2.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-500 text-base">tips_and_updates</span>
                    توجيهات هندسية لتحسين الفراغ:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-xl flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">info</span>
                        <span className="leading-relaxed font-medium">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 text-xs py-8">لا توجد بيانات متاحة حالياً.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={runAudit}
            disabled={isLoading}
            className="text-[#4A90E2] hover:text-[#357abd] text-xs font-bold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            إعادة الفحص
          </button>
          <button
            onClick={onClose}
            className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
