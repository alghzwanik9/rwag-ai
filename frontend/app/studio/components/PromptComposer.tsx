"use client";

import { useRef } from "react";

interface PromptComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** Disables the input. Must be accompanied by `disabledReason`. */
  disabled?: boolean;
  /** Shown under the input so the user can see WHY they cannot type. */
  disabledReason?: string;
  imagePreview?: string | null;
  onAttachImage: (dataUrl: string) => void;
  onClearImage: () => void;
}

export default function PromptComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  disabledReason,
  imagePreview,
  onAttachImage,
  onClearImage,
}: PromptComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onAttachImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const canSubmit = !disabled && (value.trim().length > 0 || Boolean(imagePreview));

  return (
    <div className="shrink-0 border-t border-outline-variant/50 bg-surface p-3">
      {imagePreview && (
        <div className="relative mb-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="معاينة الصورة المرفقة"
            className="h-16 w-16 rounded-xl border border-outline-variant object-cover"
          />
          <button
            onClick={onClearImage}
            aria-label="إزالة الصورة"
            className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-error text-on-error shadow-sm transition-transform hover:scale-110"
          >
            <span className="material-symbols-outlined text-[13px]">close</span>
          </button>
        </div>
      )}

      <div
        className={`flex items-end gap-2 rounded-2xl border bg-surface-container-lowest px-3 py-2 transition-all ${
          disabled
            ? 'border-outline-variant/40 opacity-60'
            : 'border-outline-variant focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20'
        }`}
      >
        <textarea
          dir="rtl"
          rows={2}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSubmit) onSubmit();
            }
          }}
          placeholder="صف الغرفة التي تريدها…"
          className="max-h-32 grow resize-none border-none bg-transparent py-1 text-[13px] leading-relaxed text-on-surface placeholder-on-surface-variant/70 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
        />

        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFile} className="hidden" />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="إرفاق صورة مرجعية"
          title="إرفاق صورة مرجعية"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[19px]">attach_file</span>
        </button>

        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-label="إرسال الطلب"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:bg-outline-variant disabled:text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[19px]">send</span>
        </button>
      </div>

      {disabled && disabledReason && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-on-surface-variant">
          <span className="material-symbols-outlined text-[13px]">info</span>
          {disabledReason}
        </p>
      )}
    </div>
  );
}
