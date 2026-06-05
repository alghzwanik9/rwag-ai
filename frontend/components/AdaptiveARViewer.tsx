'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import { useSceneStore, RwaqMaterial } from '@/lib/useSceneStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelViewerElement extends HTMLElement {
  src: string;
  dismissPoster?: () => void;
  model?: {
    materials: { name: string; pbrMetallicRoughness: { setBaseColorFactor: (color: string) => void; setRoughnessFactor: (r: number) => void; setMetallicFactor: (m: number) => void; } }[];
    getMaterialByName: (name: string) => { name: string; pbrMetallicRoughness: { setBaseColorFactor: (color: string) => void; setRoughnessFactor: (r: number) => void; setMetallicFactor: (m: number) => void; } } | undefined;
  };
}

/* eslint-disable @typescript-eslint/no-namespace */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { 
          src?: string; 
          ar?: boolean; 
          'ar-modes'?: string; 
          'camera-controls'?: boolean; 
          'auto-rotate'?: boolean; 
          'environment-image'?: string; 
          'shadow-intensity'?: string; 
      };
    }
  }
}

// ─── Model-viewer wrapper (no SSR) ───────────────────────────────────────────

const ModelViewerWrapper = dynamic(
  () =>
    import('@google/model-viewer').then(() => {
      return function Viewer({
        url,
        customMaterials,
        onLoad,
        onError,
      }: {
        url: string;
        customMaterials?: Record<string, RwaqMaterial>;
        onLoad?: () => void;
        onError?: (detail: string) => void;
      }) {
        const [isLoaded, setIsLoaded] = useState(false);
        const internalRef = useRef<ModelViewerElement>(null);

        useEffect(() => {
          const el = internalRef.current;
          if (!el) return;

          const handleLoad = () => {
            console.info('[model-viewer] ✅ Model loaded:', url);
            setIsLoaded(true);
            onLoad?.();
          };

          const handleError = (e: Event) => {
            const detail = (e as CustomEvent)?.detail?.type ?? 'unknown';
            console.error('[model-viewer] ❌ Load error:', detail, url);
            setIsLoaded(false);
            onError?.(detail);
          };

          el.addEventListener('load', handleLoad);
          el.addEventListener('error', handleError);

          return () => {
            el.removeEventListener('load', handleLoad);
            el.removeEventListener('error', handleError);
          };
        }, [url, onLoad, onError]);

        useEffect(() => {
          if (!isLoaded || !internalRef.current || !customMaterials) return;
          const el = internalRef.current;
          
          if (el.model && el.model.materials) {
            Object.entries(customMaterials).forEach(([matName, customMat]) => {
              const material = el.model?.getMaterialByName(matName);
              if (material) {
                if (customMat.color) {
                  material.pbrMetallicRoughness.setBaseColorFactor(customMat.color);
                }
                if (customMat.roughness !== undefined) {
                  material.pbrMetallicRoughness.setRoughnessFactor(customMat.roughness);
                }
                if (customMat.metalness !== undefined) {
                  material.pbrMetallicRoughness.setMetallicFactor(customMat.metalness);
                }
              }
            });
          }
        }, [isLoaded, customMaterials]);

        return (
          <model-viewer
            ref={internalRef}
            src={url}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            environment-image="neutral"
            shadow-intensity="1"
            style={{ width: '100%', height: '100%' }}
            className="w-full h-full object-contain rounded-xl bg-linear-to-tr from-[#e5e8ec] to-[#f8f9fa] dark:from-gray-800 dark:to-gray-900"
          >
            <button
              slot="ar-button"
              id="ar-launch-btn"
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-md text-white px-8 py-3 rounded-full font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-blue-700 transition-all z-10 border border-white/20 whitespace-nowrap"
            >
              شاهده في مساحتك
            </button>
          </model-viewer>
        );
      };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl gap-3">
        <div
          style={{
            width: 40,
            height: 40,
            border: '4px solid rgba(0,0,0,0.1)',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span className="text-gray-400 font-medium font-sans text-sm">
          جاري تحميل العرض ثلاثي الأبعاد...
        </span>
      </div>
    ),
  }
);

// ─── Main component ───────────────────────────────────────────────────────────

interface AdaptiveARViewerProps {
  glbUrl: string;
  sceneId: string;
}

export default function AdaptiveARViewer({ glbUrl, sceneId }: AdaptiveARViewerProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [modelState, setModelState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [modelError, setModelError] = useState<string>('');
  
  const customMaterials = useSceneStore((s) => s.customMaterials);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        setIsMobile(mobile);
        
        if (mobile) {
          setTargetUrl(`${window.location.origin}/ar/${sceneId}`);
        } else {
          setTargetUrl(`${window.location.origin}/ar/${sceneId}`);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [sceneId]);

  const handleModelLoad = () => setModelState('ready');

  const handleModelError = (detail: string) => {
    setModelState('error');
    setModelError(detail);
  };

  return (
    <div
      id="adaptive-ar-viewer"
      className="relative w-full h-full min-h-[500px] flex flex-col rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800"
    >
      <div className="w-full h-full grow relative">
        {glbUrl && (
          <ModelViewerWrapper
            url={glbUrl}
            customMaterials={customMaterials}
            onLoad={handleModelLoad}
            onError={handleModelError}
          />
        )}
      </div>

      {modelState === 'error' && (
        <div
          id="model-viewer-error-overlay"
          className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-30 p-6"
          dir="rtl"
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a5f 100%)',
              border: '1px solid #1e40af',
              borderRadius: 16,
              padding: '1.5rem',
              maxWidth: 340,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 40, color: '#818cf8', display: 'block', marginBottom: 12 }}
            >
              broken_image
            </span>
            <h3
              style={{ color: '#f9fafb', fontWeight: 700, marginBottom: 8, fontFamily: 'IBM Plex Sans, sans-serif' }}
            >
              فشل تحميل النموذج
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: 16, fontFamily: 'IBM Plex Sans, sans-serif' }}>
              لم يتمكن عارض AR من تحميل الملف. قد يكون سبب ذلك انقطاع الشبكة أو أن الملف غير مدعوم.
            </p>
            <code
              style={{
                display: 'block',
                background: 'rgba(0,0,0,0.4)',
                color: '#a5b4fc',
                fontSize: '0.7rem',
                padding: '0.4rem 0.75rem',
                borderRadius: 8,
                marginBottom: 16,
                wordBreak: 'break-all',
                fontFamily: 'monospace',
              }}
            >
              {modelError || 'render-error'}
            </code>
            <button
              id="model-retry-btn"
              onClick={() => {
                setModelState('loading');
                setModelError('');
                setTimeout(() => setModelState('loading'), 100);
              }}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: 10,
                background: '#4f46e5',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'IBM Plex Sans, sans-serif',
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {isMobile === false && targetUrl && modelState !== 'error' && (
        <div
          id="ar-qr-overlay"
          className="absolute top-6 right-6 bg-white/95 backdrop-blur p-4 rounded-2xl shadow-2xl flex flex-col items-center justify-center border border-gray-100/50 z-20 hover:scale-105 transition-transform duration-300"
        >
          <div className="grow bg-white p-2 rounded-xl">
            <QRCodeSVG value={targetUrl} size={110} level="H" />
          </div>
          <p className="text-xs text-gray-700 mt-3 font-semibold text-center max-w-[130px] leading-relaxed">
            امسح الكود للعرض بالواقع المعزز (AR) على جوالك
          </p>
          <p
            className="text-[10px] text-gray-400 mt-1 text-center font-mono"
            style={{ wordBreak: 'break-all', maxWidth: 130 }}
          >
            {targetUrl}
          </p>
        </div>
      )}
    </div>
  );
}
