"use client";

import React from "react";
import { useSceneStore, useFormattedBudgetLimit, useFormattedTotalCost } from "@/lib/useSceneStore";

export function BudgetCards() {
  const isBudgetExceeded = useSceneStore((s) => s.isBudgetExceeded);
  const formattedBudget = useFormattedBudgetLimit();
  const formattedTotal = useFormattedTotalCost();

  return (
    <div className="fixed bottom-24 right-[300px] flex gap-4 pointer-events-none z-40">
      <div className="bg-surface/90 backdrop-blur p-4 rounded-xl border border-outline-variant shadow-sm w-48 pointer-events-auto">
        <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">الميزانية التقديرية</p>
        <h4 className="font-headline-md text-headline-md font-bold text-secondary">{formattedBudget}</h4>
      </div>
      <div className="bg-surface/90 backdrop-blur p-4 rounded-xl border border-outline-variant shadow-sm w-48 pointer-events-auto">
        <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">التكلفة الفعلية</p>
        <h4 className={`font-headline-md text-headline-md font-bold ${isBudgetExceeded() ? "text-error" : "text-primary"}`}>{formattedTotal}</h4>
      </div>
    </div>
  );
}
