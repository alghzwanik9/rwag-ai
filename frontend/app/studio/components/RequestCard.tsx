"use client";

import type { PipelineStage, StageStatus, StudioRequest } from "../config/pipeline";
import { STAGE_LABELS } from "../config/pipeline";

const STATUS_GLYPH: Record<StageStatus, { icon: string; className: string; spin?: boolean }> = {
  done: { icon: 'check', className: 'text-emerald-600' },
  running: { icon: 'progress_activity', className: 'text-secondary', spin: true },
  pending: { icon: 'fiber_manual_record', className: 'text-on-surface-variant/35' },
  failed: { icon: 'close', className: 'text-error' },
  skipped: { icon: 'remove', className: 'text-amber-600' },
};

function StageRow({ stage }: { stage: PipelineStage }) {
  const glyph = STATUS_GLYPH[stage.status];
  const isIdleRow = stage.status === 'pending';

  return (
    <li className="flex flex-col gap-0.5 py-1">
      <div className="flex items-center gap-2.5">
        <span
          className={`material-symbols-outlined shrink-0 ${glyph.className} ${
            glyph.spin ? 'animate-spin' : ''
          } ${isIdleRow ? 'text-[9px]' : 'text-[16px]'}`}
        >
          {glyph.icon}
        </span>
        <span
          className={`grow text-[13px] ${
            isIdleRow ? 'text-on-surface-variant/60' : 'font-bold text-on-surface'
          }`}
        >
          {STAGE_LABELS[stage.id]}
        </span>
      </div>

      {/* A failed or skipped stage always states its reason — never a silent dot. */}
      {stage.note && (
        <p
          className={`pr-[26px] text-[11px] leading-relaxed ${
            stage.status === 'failed' ? 'text-error' : 'text-on-surface-variant'
          }`}
        >
          {stage.note}
        </p>
      )}
    </li>
  );
}

function Badge({
  icon,
  children,
  tone,
}: {
  icon: string;
  children: React.ReactNode;
  tone: 'good' | 'warn' | 'neutral';
}) {
  const toneClass = {
    good: 'border-emerald-600/30 bg-emerald-600/10 text-emerald-700',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
    neutral: 'border-outline-variant/50 bg-surface-container-high text-on-surface-variant',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-bold ${toneClass}`}
    >
      <span className="material-symbols-outlined text-[13px]">{icon}</span>
      {children}
    </span>
  );
}

/** Match count, substitutions, and the real cost — the result surface the old UI never had. */
function OutcomeSummary({ request }: { request: StudioRequest }) {
  const { matchedCount, itemCount, fallbackCount, totalCost, currency } = request;
  const fullyMatched = matchedCount === itemCount && itemCount > 0;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-outline-variant/30 pt-3">
      <Badge icon={fullyMatched ? 'inventory_2' : 'rule'} tone={fullyMatched ? 'good' : 'warn'}>
        مطابقة الكتالوج: {matchedCount.toLocaleString('ar-SA')}/{itemCount.toLocaleString('ar-SA')}
      </Badge>

      {fallbackCount > 0 && (
        <Badge icon="category" tone="neutral">
          بدائل مؤقتة: {fallbackCount.toLocaleString('ar-SA')}
        </Badge>
      )}

      <Badge icon="payments" tone={totalCost > 0 ? 'good' : 'warn'}>
        التكلفة: {totalCost.toLocaleString('ar-SA')} {currency === 'SAR' ? 'ر.س' : currency}
      </Badge>
    </div>
  );
}

interface RequestCardProps {
  request: StudioRequest;
  onRetry?: (request: StudioRequest) => void;
  /** Disables retry while another run is in flight. */
  isBusy?: boolean;
}

export default function RequestCard({ request, onRetry, isBusy = false }: RequestCardProps) {
  const time = new Date(request.createdAt).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isComplete = request.state === 'success' || request.state === 'partial';

  return (
    <article className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-3.5 shadow-sm">
      <header className="mb-3 flex items-start justify-between gap-3 border-b border-outline-variant/30 pb-2.5">
        <p className="grow text-[13px] font-bold leading-relaxed text-on-surface">{request.prompt}</p>
        <time className="shrink-0 font-plex-mono text-[10px] text-on-surface-variant">{time}</time>
      </header>

      {request.imagePreview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={request.imagePreview}
          alt="صورة مرجعية مرفقة"
          className="mb-3 h-20 w-full rounded-xl border border-outline-variant/40 object-cover"
        />
      )}

      <ul className="flex flex-col">
        {request.stages.map((stage) => (
          <StageRow key={stage.id} stage={stage} />
        ))}
      </ul>

      {isComplete && <OutcomeSummary request={request} />}

      {request.state === 'failed' && onRetry && (
        <button
          onClick={() => onRetry(request)}
          disabled={isBusy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-error/40 bg-error-container/60 py-2 text-[12px] font-bold text-on-error-container transition-colors hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          إعادة المحاولة
        </button>
      )}
    </article>
  );
}
