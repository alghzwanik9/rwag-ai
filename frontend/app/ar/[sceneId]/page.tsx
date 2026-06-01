'use client';

import React, { useEffect, useState } from 'react';
import AdaptiveARViewer from '@/components/AdaptiveARViewer';

interface PageProps {
  params: {
    sceneId: string;
  };
}

type LoadState = 'resolving' | 'loading' | 'ready' | 'error';
type ErrorKind = 'network' | 'asset' | 'unknown';

function buildGlbUrl(sceneId: string): string {
  // Use window.location.origin so the URL is always protocol + host + port
  // as seen by the current browser — works for both localhost (desktop)
  // and the Wi-Fi IP (mobile after QR scan).
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (sceneId === 'default') {
    return `${origin}/outputs/default.glb`;
  }
  return `${origin}/outputs/output_${sceneId}.glb`;
}

async function probeUrl(url: string): Promise<{ ok: boolean; kind: ErrorKind }> {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (res.ok) return { ok: true, kind: 'unknown' };
    // 404 / 500 → asset problem
    return { ok: false, kind: 'asset' };
  } catch {
    // Fetch threw → network unreachable
    return { ok: false, kind: 'network' };
  }
}

export default function ARPage({ params }: PageProps) {
  const { sceneId } = params;
  const [glbUrl, setGlbUrl] = useState<string>('');
  const [loadState, setLoadState] = useState<LoadState>('resolving');
  const [errorKind, setErrorKind] = useState<ErrorKind>('unknown');
  const [errorDetail, setErrorDetail] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = buildGlbUrl(sceneId);
    setGlbUrl(url);
    setLoadState('loading');

    // Probe the asset URL before handing off to model-viewer so we can
    // give the user a discriminated error message immediately.
    probeUrl(url).then(({ ok, kind }) => {
      if (ok) {
        setLoadState('ready');
      } else {
        setLoadState('error');
        setErrorKind(kind);
        setErrorDetail(
          kind === 'network'
            ? 'تعذّر الاتصال بالخادم. تأكد أن الجهازين على نفس شبكة Wi-Fi وأن الخادم يعمل.'
            : `الملف المطلوب غير موجود أو فشل التحميل.\n(${url})`
        );
        console.error(`[AR Page] GLB probe failed — kind: ${kind}, url: ${url}`);
      }
    });
  }, [sceneId]);

  // ── Resolving / initial ──────────────────────────────────────────────────
  if (loadState === 'resolving' || !glbUrl) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black gap-4">
        <div
          style={{
            width: 48,
            height: 48,
            border: '4px solid rgba(255,255,255,0.15)',
            borderTopColor: '#60a5fa',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: '#9ca3af', fontFamily: 'IBM Plex Sans, sans-serif' }}>
          جاري تحميل مساحة العرض...
        </span>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (loadState === 'error') {
    const isNetwork = errorKind === 'network';
    return (
      <div
        className="w-full h-screen flex items-center justify-center bg-black p-6"
        dir="rtl"
        id="ar-error-screen"
      >
        <div
          style={{
            background: isNetwork
              ? 'linear-gradient(135deg, #1c1917 0%, #292524 100%)'
              : 'linear-gradient(135deg, #1e1b4b 0%, #1e3a5f 100%)',
            border: `1px solid ${isNetwork ? '#78350f' : '#1e40af'}`,
            borderRadius: 20,
            padding: '2rem',
            maxWidth: 400,
            width: '100%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          {/* Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: isNetwork ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 32,
                  color: isNetwork ? '#ef4444' : '#818cf8',
                }}
              >
                {isNetwork ? 'wifi_off' : 'broken_image'}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              color: '#f9fafb',
              fontSize: '1.125rem',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '0.75rem',
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}
          >
            {isNetwork ? 'تعذّر الاتصال بالشبكة' : 'فشل تحميل الملف'}
          </h1>

          {/* Body */}
          <p
            style={{
              color: '#9ca3af',
              fontSize: '0.875rem',
              textAlign: 'center',
              lineHeight: 1.7,
              marginBottom: '1.5rem',
              fontFamily: 'IBM Plex Sans, sans-serif',
              whiteSpace: 'pre-line',
            }}
          >
            {errorDetail}
          </p>

          {/* Type badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <span
              style={{
                background: isNetwork ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)',
                color: isNetwork ? '#fca5a5' : '#a5b4fc',
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: 9999,
                fontFamily: 'monospace',
              }}
            >
              {isNetwork ? 'NETWORK_ERROR' : 'ASSET_NOT_FOUND'}
            </span>
          </div>

          {/* Retry */}
          <button
            id="ar-retry-btn"
            onClick={() => window.location.reload()}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.75rem',
              borderRadius: 12,
              background: isNetwork ? '#dc2626' : '#4f46e5',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'IBM Plex Sans, sans-serif',
              transition: 'opacity 0.2s',
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // ── Ready ────────────────────────────────────────────────────────────────
  return (
    <div
      id="ar-viewer-container"
      style={{ width: '100vw', height: '100dvh', overflow: 'hidden', background: '#000' }}
    >
      <AdaptiveARViewer glbUrl={glbUrl} sceneId={sceneId} />
    </div>
  );
}
