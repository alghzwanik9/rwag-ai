"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import {
  Check,
  Copy,
  Layers,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useFormattedBudgetLimit, useSceneStore } from "@/lib/useSceneStore";

export default function TeamPage() {
  const { user, isSignedIn } = useUser();
  const sceneItems = useSceneStore((s) => s.sceneItems);
  const roomWidth = useSceneStore((s) => s.roomWidth);
  const roomDepth = useSceneStore((s) => s.roomDepth);
  const activeSceneId = useSceneStore((s) => s.activeSceneId);
  const formattedBudget = useFormattedBudgetLimit();

  const [copied, setCopied] = useState(false);

  const sharePath = activeSceneId ? `/ar/${activeSceneId}` : "/studio";

  const handleCopyStudioLink = async () => {
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}${sharePath}` : sharePath;

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  return (
    <main className="fixed top-[64px] left-0 right-0 md:right-[280px] bottom-0 bg-surface overflow-y-auto" dir="rtl">
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface flex items-center gap-3">
              <Users className="w-7 h-7 text-secondary shrink-0" />
              مساحة العمل والفريق
            </h2>
            <p className="text-on-surface-variant font-body-md text-sm sm:text-base mt-1">
              ملخص مساحة التصميم الحالية ومشاركة رابط الاستوديو مباشرة مع العملاء والزملاء.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyStudioLink}
            className={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-secondary text-white hover:bg-secondary/90"
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "تم نسخ الرابط" : "نسخ رابط الاستوديو"}
          </button>
        </div>

        {/* Workspace Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4">
            <p className="text-xs font-bold text-on-surface-variant mb-1">أبعاد الغرفة النشطة</p>
            <p className="text-lg font-bold font-mono text-on-surface">
              {roomWidth.toFixed(1)}م × {roomDepth.toFixed(1)}م
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4">
            <p className="text-xs font-bold text-on-surface-variant mb-1">القطع في المشهد</p>
            <p className="text-lg font-bold font-mono text-on-surface">
              {sceneItems.length} قطعة
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4">
            <p className="text-xs font-bold text-on-surface-variant mb-1">الميزانية المعتمدة</p>
            <p className="text-lg font-bold font-mono text-secondary">{formattedBudget}</p>
          </div>
        </div>

        {/* Team / Workspace Owner Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden mb-6">
          <div className="px-5 sm:px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-on-surface-variant">
              أعضاء مساحة العمل · 1 عضو نشط
            </p>
            <span className="text-xs font-mono text-on-surface-variant">
              {isSignedIn ? "Clerk Workspace" : "Local Session"}
            </span>
          </div>

          {/* Current User Row */}
          <div className="px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-low/60 transition-colors">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-outline-variant bg-surface-container shrink-0">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || "User"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-bold">
                    {user?.firstName?.charAt(0) || "ر"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-on-surface truncate">
                  {user?.fullName || "مصمم رواق (جلسة محلية)"}
                </p>
                <div className="flex items-center gap-1.5 text-on-surface-variant text-xs mt-0.5 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {user?.primaryEmailAddress?.emailAddress || "الوضع التجريبي المحلي"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-secondary bg-secondary-container px-3.5 py-1.5 rounded-full self-start sm:self-auto shrink-0">
              <ShieldCheck className="w-4 h-4" />
              مالك المساحة
            </div>
          </div>

          {/* Shareable Link & Collaboration Summary */}
          <div className="px-5 sm:px-6 py-6 border-t border-outline-variant bg-surface-container-low/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">مشاركة التصميم مع العملاء</p>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-md">
                  تعمل المساحة حالياً بوضع المصمم الفردي. يمكنك نسخ رابط{" "}
                  <span className="font-mono text-on-surface">{sharePath}</span> لمشاركة جلسة التصميم
                  أو الانتقال مباشرة للاستوديو لتصدير عرض سعر PDF للعميل.
                </p>
              </div>
            </div>
            <Link
              href="/studio"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold hover:bg-primary/90 transition-colors shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              فتح الاستوديو 3D
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
