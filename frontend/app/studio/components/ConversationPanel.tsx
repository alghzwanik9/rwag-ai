"use client";

import { useEffect, useRef } from "react";
import { REGION, Z } from "../config/regions";
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
    <div className="flex flex-col gap-4 px-1 py-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40">
          auto_awesome
        </span>
        <p className="text-[13px] leading-relaxed text-on-surface-variant">
          صف الغرفة التي تريدها بالعربية، وسيتولى رواق تحليل الطلب ومطابقة الأثاث وبناء المشهد
          وحساب التكلفة.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-on-surface-variant">جرّب أحد هذه الطلبات:</p>
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            onClick={() => onPick(example)}
            className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2.5 text-right text-[12px] leading-relaxed text-on-surface transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The right column: request history above, prompt input pinned to the bottom.
 * Replaces the floating bottom bar, which gave the user no context at all —
 * no history, no per-stage progress, no result surface.
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

  // Keep the newest request in view as stages advance.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [requests]);

  return (
    <aside
      className={`${REGION.conversation} ${Z.region} flex flex-col border-l border-outline-variant/60 bg-surface`}
      dir="rtl"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-outline-variant/50 px-4 py-3">
        <span className="material-symbols-outlined text-[19px] text-secondary">forum</span>
        <h2 className="font-label-md text-label-md font-bold text-on-surface">الطلبات</h2>
        {requests.length > 0 && (
          <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-plex-mono text-[10px] text-on-surface-variant">
            {requests.length}
          </span>
        )}
      </div>

      <div ref={scrollRef} className="grow overflow-y-auto px-3 py-3">
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
