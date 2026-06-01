"use client";

import React, { useEffect, useState } from "react";
import { FolderOpen, Plus, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSceneStore } from "@/lib/useSceneStore";

interface Project {
  id: string;
  name: string;
  savedAt: string;
  totalCost: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();
  const clearScene = useSceneStore((s) => s.clearScene);
  const addSceneItem = useSceneStore((s) => s.addSceneItem);
  const setActiveSceneId = useSceneStore((s) => s.setActiveSceneId);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((data) => setProjects(data.projects || []))
      .catch(() => {});
  }, []);

  const handleLoad = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      if (data) {
        clearScene();
        setActiveSceneId(data.sceneId || null);
        if (data.sceneItems) data.sceneItems.forEach((item: any) => addSceneItem(item));
        if (data.customMaterials) useSceneStore.setState({ customMaterials: data.customMaterials });
        router.push("/studio");
      }
    } catch (e) { console.error(e); }
  };

  return (
    <main className="fixed top-[64px] left-0 right-[280px] bottom-0 bg-surface overflow-y-auto" dir="rtl">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-headline-lg font-bold text-on-surface flex items-center gap-3">
              <FolderOpen className="w-7 h-7 text-secondary" />
              مشاريعي
            </h2>
            <p className="text-on-surface-variant font-body-md mt-1">إدارة التصاميم المحفوظة ومتابعة التكاليف.</p>
          </div>
          <button
            onClick={() => router.push("/studio")}
            className="bg-secondary text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-secondary/90 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            تصميم جديد
          </button>
        </div>

        {/* Content */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map((proj) => (
              <div key={proj.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 hover:border-secondary/50 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center mb-3">
                  <FolderOpen className="w-5 h-5 text-secondary" />
                </div>
                <h4 className="font-bold text-on-surface mb-1">{proj.name}</h4>
                <p className="text-xs text-on-surface-variant font-mono mb-4">
                  {new Date(proj.savedAt).toLocaleDateString('ar-SA')} — {proj.totalCost} ر.س
                </p>
                <button
                  onClick={() => handleLoad(proj.id)}
                  className="w-full bg-secondary-container text-on-secondary-container py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-secondary hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  فتح التصميم
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-surface-container-lowest border border-dashed border-outline-variant rounded-3xl">
            <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mb-5">
              <FolderOpen className="w-10 h-10 text-secondary" />
            </div>
            <h4 className="font-headline-sm font-bold text-on-surface mb-2">لا توجد مشاريع حالياً</h4>
            <p className="text-on-surface-variant text-sm mb-7 max-w-sm">ابدأ الآن في تشكيل مساحتك المذهلة واحفظها هنا.</p>
            <button
              onClick={() => router.push("/studio")}
              className="bg-secondary text-white px-7 py-3 rounded-full font-bold hover:bg-secondary/90 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              إنشاء مشروع جديد
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
