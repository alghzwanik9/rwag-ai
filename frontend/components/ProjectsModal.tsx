"use client";

import React, { useEffect, useState } from "react";
import { useSceneStore } from "@/lib/useSceneStore";
import { FolderOpen, Plus } from "lucide-react";

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  setModelUrl: (url: string) => void;
  setSceneId: (id: string) => void;
}

interface Project {
  id: string;
  name: string;
  savedAt: string;
  totalCost: number;
  sceneId?: string;
  glbUrl?: string;
  sceneItems?: any[];
  customMaterials?: Record<string, any>;
}

export default function ProjectsModal({ isOpen, onClose, onShowToast, setModelUrl, setSceneId }: ProjectsModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projectName, setProjectName] = useState("");

  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const sceneItems = useSceneStore((s) => s.sceneItems);
  const customMaterials = useSceneStore((s) => s.customMaterials);
  const currentTotalCost = useSceneStore((s) => s.currentTotalCost());
  
  // Use these to restore state when loading
  const clearScene = useSceneStore((s) => s.clearScene);
  const addSceneItem = useSceneStore((s) => s.addSceneItem);
  const setActiveSceneId = useSceneStore((s) => s.setActiveSceneId);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!projectName.trim()) {
      onShowToast("الرجاء إدخال اسم المشروع");
      return;
    }

    setIsLoading(true);
    try {
      // Use activeSceneId if exists, otherwise generate a unique manual scene ID
      const targetSceneId = activeSceneId || `manual_${Date.now()}`;
      const glbUrl = activeSceneId ? `/outputs/output_${activeSceneId}.glb` : null;
      
      const res = await fetch("/api/projects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          sceneId: targetSceneId,
          glbUrl: glbUrl,
          sceneItems: sceneItems,
          customMaterials: customMaterials,
          totalCost: currentTotalCost,
        })
      });

      if (res.ok) {
        onShowToast("تم حفظ مشروعك بنجاح في محفظة رواق");
        setProjectName("");
        fetchProjects();
      } else {
        onShowToast("حدث خطأ أثناء الحفظ");
      }
    } catch (error) {
      onShowToast("فشل الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (projectId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        
        // Restore scene state
        clearScene();
        setActiveSceneId(data.sceneId);
        setModelUrl(data.glbUrl);
        setSceneId(data.sceneId);
        
        // We need to access Zustand internals or just use actions. 
        // We'll map through sceneItems and add them back.
        if (data.sceneItems) {
          data.sceneItems.forEach((item: any) => {
            // Because addSceneItem auto-generates addedAt, it's fine.
            addSceneItem(item);
          });
        }
        
        // Restore custom materials. 
        // Since we don't have a bulk setCustomMaterials in store, we might need to add it,
        // or just iterate and apply.
        if (data.customMaterials) {
          useSceneStore.setState({ customMaterials: data.customMaterials });
        }
        
        onShowToast(`تم تحميل مشروع: ${data.name}`);
        onClose();
      }
    } catch (error) {
      onShowToast("فشل تحميل المشروع");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[85vh] border border-outline-variant">
        
        <div className="p-stack-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low rounded-t-2xl">
          <h2 className="font-headline-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">folder_special</span>
            محفظة مشاريع رواق
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-container-highest p-2 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-stack-lg flex-grow overflow-y-auto space-y-8">
          
          {/* Save Section */}
          <div className="bg-primary-container/20 p-6 rounded-xl border border-primary/20">
            <h3 className="font-label-lg font-bold text-on-surface mb-3">حفظ التصميم الحالي</h3>
            <div className="flex gap-3 mt-4">
              <input 
                type="text" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="اسم المشروع (مثال: صالة الضيوف الكلاسيكية)" 
                className="flex-grow bg-white border border-outline-variant rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-body-md"
              />
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">save</span>
                حفظ
              </button>
              <button 
                onClick={() => window.print()}
                disabled={sceneItems.length === 0}
                className="bg-tertiary-container text-on-tertiary-container px-4 py-2 rounded-lg font-bold hover:bg-tertiary/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                title="تصدير تقرير المشتريات (PDF)"
              >
                <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                تصدير التقرير
              </button>
            </div>
            {sceneItems.length === 0 && (
              <p className="text-sm text-error mt-2">عليك إضافة عناصر أو أثاث للمشهد لتتمكن من تصدير التقرير.</p>
            )}
          </div>

          {/* List Section */}
          <div>
            <h3 className="font-label-lg font-bold text-on-surface-variant mb-4">المشاريع المحفوظة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.length > 0 ? (
                projects.map((proj) => (
                  <div key={proj.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-primary/50 transition-colors group relative">
                    <h4 className="font-bold text-on-surface mb-1">{proj.name}</h4>
                    <p className="text-xs text-on-surface-variant mb-4 font-mono">
                      {new Date(proj.savedAt).toLocaleDateString('ar-SA')} - {proj.totalCost} ر.س
                    </p>
                    <button 
                      onClick={() => handleLoad(proj.id)}
                      disabled={isLoading}
                      className="w-full bg-secondary-container text-on-secondary-container py-2 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary/20 flex justify-center items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      تحميل التصميم
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest border border-dashed border-outline-variant rounded-2xl">
                  <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mb-6">
                    <FolderOpen className="w-10 h-10 text-secondary" />
                  </div>
                  <h4 className="font-headline-sm font-bold text-on-surface mb-2">لا توجد مشاريع حالياً</h4>
                  <p className="text-on-surface-variant mb-8 max-w-sm">يبدو أنك لم تقم بحفظ أي تصميم بعد. ابدأ الآن في تشكيل مساحتك المذهلة واحفظها هنا للعودة إليها لاحقاً.</p>
                  <button onClick={onClose} className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-lg font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    <Plus className="w-5 h-5" />
                    <span>إنشاء مشروع جديد</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
