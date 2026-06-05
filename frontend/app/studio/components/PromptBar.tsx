"use client";

import React, { useRef } from "react";

interface PromptBarProps {
  prompt: string;
  setPrompt: (p: string) => void;
  imageBase64: string | null;
  setImageBase64: (s: string | null) => void;
  isLoading: boolean;
  handleGenerate: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PromptBar({
  prompt,
  setPrompt,
  imageBase64,
  setImageBase64,
  isLoading,
  handleGenerate,
  handleImageUpload
}: PromptBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[800px] z-50 px-container-padding pointer-events-none flex flex-col items-center">
      {imageBase64 && (
        <div className="relative pointer-events-auto bg-surface-container-lowest border border-outline-variant rounded-xl p-2 shadow-sm self-end mb-2 mr-6">
          <button 
            onClick={() => setImageBase64(null)}
            className="absolute -top-2 -right-2 bg-error text-on-error rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageBase64} alt="Upload Preview" className="h-16 w-16 object-cover rounded-lg border border-outline-variant" />
        </div>
      )}
      <div className="grow bg-surface border border-outline-variant rounded-full flex items-center px-4 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        <input 
          className="grow bg-transparent border-none focus:ring-0 font-body-lg text-body-lg placeholder-on-surface-variant text-on-surface text-right" 
          dir="rtl" 
          placeholder="اكتب طلبك هنا، مثال: غرفة جلوس مودرن، أو ارفع صورة..." 
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-high"
          title="إرفاق صورة"
        >
          <span className="material-symbols-outlined">attach_file</span>
        </button>
        <button 
          onClick={handleGenerate}
          disabled={isLoading}
          className={`${isLoading ? "bg-surface-tint" : "bg-primary"} text-on-primary rounded-full px-8 py-2 font-label-md text-label-md transition-all active:scale-95 flex items-center gap-2`}
        >
          <span>{isLoading ? "جاري..." : "توليد"}</span>
          {!isLoading && <span className="material-symbols-outlined text-sm">send</span>}
        </button>
      </div>
    </div>
  );
}
