"use client";

import React, { useEffect, useState } from "react";

export default function SupabaseConnectionBadge() {
  const [status, setStatus] = useState<"checking" | "connected" | "failed">("checking");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkConnection() {
      try {
        const res = await fetch("/api/v1/db-check");
        if (res.ok) {
          const data = await res.json();
          if (data.status === "success") {
            setStatus("connected");
          } else {
            setStatus("failed");
            setErrorMessage(data.message || "فشل الاتصال بقاعدة البيانات");
          }
        } else {
          setStatus("failed");
          setErrorMessage("خادم قاعدة البيانات غير مستجيب");
        }
      } catch {
        setStatus("failed");
        setErrorMessage("تعذر الاتصال بالخادم الرئيسي");
      }
    }
    checkConnection();
  }, []);

  if (status === "checking") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
        <span className="text-xs text-gray-500 font-bold">جاري فحص اتصال قاعدة البيانات...</span>
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span className="text-xs text-green-700 font-black">قاعدة البيانات: متصلة بنجاح</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 shadow-xs" title={errorMessage}>
      <span className="w-2 h-2 rounded-full bg-red-500"></span>
      <span className="text-xs text-red-700 font-black">قاعدة البيانات: فشل الاتصال</span>
    </div>
  );
}
