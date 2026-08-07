'use client';

import { useEffect, useState } from 'react';

export type HealthState = 'checking' | 'live' | 'down' | 'unconfigured';

/**
 * Polls a reachability probe on an interval.
 *
 * `probe` resolves true when the dependency answered. Any HTTP status counts
 * as reachable — a 401 from PostgREST still proves the database is serving.
 */
function useHealthProbe(probe: (signal: AbortSignal) => Promise<HealthState>, intervalMs = 60_000) {
  const [state, setState] = useState<HealthState>('checking');

  useEffect(() => {
    let cancelled = false;
    let controller: AbortController | undefined;

    const run = async () => {
      controller?.abort();
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 6000);

      try {
        const result = await probe(controller.signal);
        if (!cancelled) setState(result);
      } catch {
        if (!cancelled) setState('down');
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void run();
    const timer = window.setInterval(run, intervalMs);

    return () => {
      cancelled = true;
      controller?.abort();
      window.clearInterval(timer);
    };
  }, [probe, intervalMs]);

  return state;
}

const TONE: Record<HealthState, { dot: string; ring: string; text: string }> = {
  checking: { dot: 'bg-rwaq-sand', ring: 'bg-rwaq-sand/40', text: 'text-rwaq-ink-muted' },
  live: { dot: 'bg-rwaq-live', ring: 'bg-rwaq-live/40', text: 'text-rwaq-ink-muted' },
  down: { dot: 'bg-rwaq-ink-faint', ring: 'bg-transparent', text: 'text-rwaq-ink-faint' },
  unconfigured: { dot: 'bg-rwaq-ink-faint', ring: 'bg-transparent', text: 'text-rwaq-ink-faint' },
};

function StatusDot({ state }: { state: HealthState }) {
  const tone = TONE[state];
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {state === 'live' && (
        <span
          className={`absolute inline-flex h-full w-full rounded-pill ${tone.ring} motion-safe:animate-[rwaq-halo_2.4s_ease-out_infinite]`}
        />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-pill ${tone.dot}`} />
    </span>
  );
}

/* ── Supabase ───────────────────────────────────────────────────────────── */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const probeSupabase = async (signal: AbortSignal): Promise<HealthState> => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return 'unconfigured';

  // Hitting the PostgREST root is the cheapest proof of life: it needs no
  // table, no row and no RLS policy, and it never returns user data.
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/`, {
    method: 'GET',
    headers: { apikey: SUPABASE_KEY },
    signal,
    cache: 'no-store',
  });

  return response.status > 0 ? 'live' : 'down';
};

const SUPABASE_LABEL: Record<HealthState, string> = {
  checking: 'جارٍ فحص الاتصال',
  live: 'قاعدة البيانات متصلة',
  down: 'تعذّر الاتصال بقاعدة البيانات',
  unconfigured: 'قاعدة البيانات غير مهيّأة',
};

export function SupabaseStatusBadge({ className = '' }: { className?: string }) {
  const state = useHealthProbe(probeSupabase);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={SUPABASE_LABEL[state]}
      title={SUPABASE_LABEL[state]}
      className={`inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.04] px-3 py-1.5 ${className}`}
    >
      <StatusDot state={state} />
      <span className={`font-tech text-[11px] font-medium tracking-wide ${TONE[state].text}`}>
        Supabase
      </span>
      <span className="hidden text-[11px] text-rwaq-ink-faint lg:inline">
        {state === 'live' ? 'مباشر' : state === 'checking' ? '...' : 'غير متصل'}
      </span>
    </div>
  );
}

/* ── Backend API ────────────────────────────────────────────────────────── */

const probeServer = async (signal: AbortSignal): Promise<HealthState> => {
  const response = await fetch('/api/server-ip', { signal, cache: 'no-store' });
  return response.ok ? 'live' : 'down';
};

const SERVER_LABEL: Record<HealthState, string> = {
  checking: 'جارٍ فحص حالة الخادم',
  live: 'جميع الخدمات تعمل بشكل طبيعي',
  down: 'الخادم غير متاح حالياً',
  unconfigured: 'الخادم غير مهيّأ',
};

export function ServerHealthIndicator({ className = '' }: { className?: string }) {
  const state = useHealthProbe(probeServer, 90_000);

  const text =
    state === 'live'
      ? 'جميع الخدمات تعمل'
      : state === 'checking'
        ? 'جارٍ فحص الحالة'
        : 'الخدمات غير متاحة';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={SERVER_LABEL[state]}
      className={`inline-flex items-center gap-2.5 rounded-pill border border-white/10 bg-white/[0.03] px-3.5 py-2 ${className}`}
    >
      <StatusDot state={state} />
      <span className={`text-xs ${TONE[state].text}`}>{text}</span>
      <span className="font-tech text-[10px] uppercase tracking-[0.14em] text-rwaq-ink-faint">
        status
      </span>
    </div>
  );
}
