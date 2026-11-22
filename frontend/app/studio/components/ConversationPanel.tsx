"use client";

import { useEffect, useRef, useState } from "react";
import { EXAMPLE_PROMPTS, type StudioRequest, type StudioUiState } from "../config/pipeline";
import PromptComposer from "./PromptComposer";
import RequestCard from "./RequestCard";

interface ConversationPanelProps {
  uiState: StudioUiState;
  requests: StudioRequest[];
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  /** Only reachable from a `failed` card. */
  onRetry?: (request: StudioRequest) => void;
  imagePreview: string | null;
  onAttachImage: (dataUrl: string) => void;
  onClearImage: () => void;
}

function IdleHint({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col gap-4 px-1 py-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="material-symbols-outlined text-[28px] text-primary/60">
          auto_awesome
        </span>
        <p className="text-[12px] leading-relaxed text-on-surface-variant">
          صف الغرفة التي تريدها بالعربية، وسيتولى رواق تحليل الطلب ومطابقة الأثاث وبناء المشهد وحساب التكلفة.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-bold text-on-surface-variant">جرّب أحد هذه الطلبات:</p>
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            onClick={() => onPick(example)}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest/80 px-3 py-2 text-right text-[11px] leading-relaxed text-on-surface transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Collapsible floating popover on the right: request history above, prompt input pinned to bottom.
 * Keeps the 3D canvas full-screen and unblocked while giving easy 1-click access.
 */
export default function ConversationPanel({
  uiState,
  requests,
  prompt,
  onPromptChange,
  onSubmit,
  onRetry,
  imagePreview,
  onAttachImage,
  onClearImage,
}: ConversationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isGenerating = uiState === 'generating';
  const [isOpen, setIsOpen] = useState(isGenerating);
  const [prevIsGenerating, setPrevIsGenerating] = useState(isGenerating);

  // Open popover automatically when generating so user sees progress
  if (isGenerating !== prevIsGenerating) {
    setPrevIsGenerating(isGenerating);
    if (isGenerating) {
      setIsOpen(true);
    }
  }

  // Keep newest request in view as stages advance
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [requests]);

  if (!isOpen) {
    return (
      <div className="fixed top-20 right-4 z-40" dir="rtl">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 rounded-2xl bg-surface/90 hover:bg-surface border border-outline-variant/60 px-4 py-2.5 text-on-surface shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:border-primary/50 group"
          title="فتح لوحة المساعد الذكي والطلبات"
        >
          <span className="material-symbols-outlined text-[22px] text-primary group-hover:rotate-12 transition-transform">
            auto_awesome
          </span>
          <div className="flex flex-col text-right">
            <span className="text-[12px] font-bold text-on-surface">الطلبات والمساعد الذكي</span>
            <span className="text-[10px] text-on-surface-variant">انقر للتوليد والوصف</span>
          </div>
          {requests.length > 0 && (
            <span className="mr-1 rounded-full bg-primary/20 px-2 py-0.5 font-plex-mono text-[10px] font-bold text-primary">
              {requests.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <aside
      className="fixed top-20 right-4 z-40 flex flex-col w-[380px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] rounded-2xl border border-outline-variant/70 bg-surface/95 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300"
      dir="rtl"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/50 px-4 py-3 bg-surface-container-low/60">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[19px] text-primary">auto_awesome</span>
          <h2 className="font-label-md text-label-md font-bold text-on-surface">الطلبات والمساعد الذكي</h2>
          {requests.length > 0 && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 font-plex-mono text-[10px] font-bold text-primary">
              {requests.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          title="إغلاق / تصغير اللوحة"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div ref={scrollRef} className="grow overflow-y-auto px-3 py-3 max-h-[50vh]">
        {requests.length === 0 ? (
          <IdleHint onPick={onPromptChange} />
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onRetry={onRetry}
                isBusy={isGenerating}
              />
            ))}
          </div>
        )}
      </div>

      <PromptComposer
        value={prompt}
        onChange={onPromptChange}
        onSubmit={onSubmit}
        disabled={isGenerating}
        disabledReason="جارٍ التوليد — لا يمكن إرسال طلب جديد حتى يكتمل الطلب الحالي."
        imagePreview={imagePreview}
        onAttachImage={onAttachImage}
        onClearImage={onClearImage}
      />
    </aside>
  );
}
