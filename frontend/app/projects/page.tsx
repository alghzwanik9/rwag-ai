"use client";

import React, { useEffect, useState } from "react";
import { FolderOpen, Plus, Download, Loader2, AlertCircle, Share2, Trash2, Check, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Project {
  id: string;
  name: string;
  savedAt: string;
  totalCost: number;
  roomWidth?: number;
  roomDepth?: number;
  wallHeight?: number;
  roomStyle?: string;
  itemCount?: number;
  thumbnailUrl?: string | null;
  isLocal?: boolean;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const router = useRouter();

  const fetchProjects = (signal?: AbortSignal) => {
    setIsLoadingList(true);
    fetch("/api/projects", { signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => setProjects(Array.isArray(data.projects) ? data.projects : []))
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Error fetching projects:", err);
        }
      })
      .finally(() => setIsLoadingList(false));
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProjects(controller.signal);
    return () => controller.abort();
  }, []);

  const handleOpenStudio = (id: string) => {
    setOpeningId(id);
    router.push(`/studio?project=${id}`);
  };

  const handleCopyShareLink = async (id: string) => {
    const shareUrl = `${window.location.origin}/studio?share=${id}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف مشروع "${name}"؟`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("تعذر حذف المشروع حالياً");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="fixed top-[64px] left-0 right-0 md:right-[280px] bottom-0 bg-surface overflow-y-auto" dir="rtl">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface flex items-center gap-3">
              <FolderOpen className="w-7 h-7 text-secondary shrink-0" />
              مشاريعي المحفوظة
            </h2>
            <p className="text-on-surface-variant font-body-md text-sm sm:text-base mt-1">
              إدارة التصاميم ثلاثية الأبعاد، مشاركة الروابط مع العملاء، ومتابعة جداول الكميات.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/studio")}
            className="bg-secondary text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            تصميم جديد في 3D
          </button>
        </div>

        {loadError && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-error/30 bg-error-container/50 px-4 py-3 text-sm font-medium text-error">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Content */}
        {isLoadingList ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 animate-pulse flex flex-col gap-3"
              >
                <div className="aspect-16/10 bg-surface-container-high rounded-xl w-full" />
                <div className="h-4 bg-surface-container rounded w-3/4" />
                <div className="h-3 bg-surface-container rounded w-1/2" />
                <div className="h-10 bg-surface-container rounded-xl w-full mt-2" />
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map((proj) => {
              const isOpening = openingId === proj.id;
              const isDeleting = deletingId === proj.id;
              const isCopied = copiedId === proj.id;
              const formattedDate = new Date(proj.savedAt).toLocaleDateString("ar-SA", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={proj.id}
                  className="group bg-surface-container-lowest border border-outline-variant/60 hover:border-secondary/60 rounded-3xl p-4 hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Visual Thumbnail */}
                    <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-surface-container-high mb-3.5 border border-outline-variant/30 flex items-center justify-center">
                      {proj.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proj.thumbnailUrl}
                          alt={proj.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 text-on-surface-variant/60 p-4 text-center">
                          <span className="material-symbols-outlined text-[32px] text-secondary/60">view_in_ar</span>
                          <span className="text-[11px] font-bold text-on-surface-variant">منظور 3D تفاعلي</span>
                        </div>
                      )}

                      {/* Dimension Pill */}
                      <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md border border-white/10" dir="ltr">
                        {proj.roomWidth || 5.5}m × {proj.roomDepth || 4.8}m
                      </span>

                      {/* Style Pill */}
                      <span className="absolute top-2.5 right-2.5 rounded-lg bg-secondary/90 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md shadow-xs">
                        {proj.roomStyle || "مودرن"}
                      </span>

                      {/* Delete icon on hover */}
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(proj.id, proj.name)}
                        disabled={isDeleting}
                        title="حذف المشروع"
                        className="absolute top-2.5 left-2.5 h-7 w-7 rounded-full bg-black/60 text-white/70 hover:bg-error hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Metadata Header */}
                    <h4 className="font-bold text-base text-on-surface truncate mb-1" title={proj.name}>
                      {proj.name}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant mb-4">
                      <span>{formattedDate}</span>
                      <span className="font-bold text-secondary font-mono">
                        {proj.totalCost.toLocaleString("en-US")} ر.س
                      </span>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/40">
                    <button
                      type="button"
                      disabled={isOpening}
                      onClick={() => handleOpenStudio(proj.id)}
                      className="flex-1 bg-secondary text-white py-2 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 hover:bg-secondary/90 active:scale-95 transition-all disabled:opacity-60 shadow-xs"
                      title="فتح المشروع في الاستوديو 3D"
                    >
                      {isOpening ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
                      )}
                      <span>{isOpening ? "جاري الفتح..." : "فتح في الاستوديو"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyShareLink(proj.id)}
                      className={`h-9 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                        isCopied
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "border-outline-variant hover:bg-surface-container-high text-on-surface"
                      }`}
                      title="نسخ رابط المشاركة التفاعلي 3D"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{isCopied ? "تم النسخ" : "مشاركة"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center bg-surface-container-lowest border border-dashed border-outline-variant rounded-3xl">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-5 text-secondary">
              <FolderOpen className="w-10 h-10" />
            </div>
            <h4 className="font-headline-sm text-lg font-bold text-on-surface mb-2">لا توجد مشاريع محفوظة حالياً</h4>
            <p className="text-on-surface-variant text-sm mb-7 max-w-sm">
              ابدأ الآن في تأثيث وتصميم مساحتك ثلاثية الأبعاد، ثم احفظها وشاركها بنقرة زر واحدة.
            </p>
            <button
              type="button"
              onClick={() => router.push("/studio")}
              className="bg-secondary text-white px-7 py-3 rounded-full font-bold hover:bg-secondary/90 transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <Plus className="w-5 h-5" />
              بدء تصميم جديد
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
