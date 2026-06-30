import { useEffect, useRef, useState } from 'react';
import { useMapTransition } from '../hooks/useMapTransition';
import { WakingUpScreen } from '../components/WakingUpScreen';

type BackendState = 'checking' | 'awake' | 'sleeping' | 'ready';

export function IntroPage() {
  const { state, trigger } = useMapTransition();
  const isZooming = state === 'zooming';
  const devForce = new URLSearchParams(window.location.search).get('waking') as BackendState | null;
  const [backendState, setBackendState] = useState<BackendState>(devForce ?? 'checking');
  const triggerRef = useRef(trigger);
  useEffect(() => { triggerRef.current = trigger; }, [trigger]);

  useEffect(() => {
    if (devForce) return;
    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const ping = async (timeoutMs: number): Promise<boolean> => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/health`, { signal: controller.signal });
        clearTimeout(t);
        return true;
      } catch {
        clearTimeout(t);
        return false;
      }
    };

    (async () => {
      const awake = await ping(3000);
      if (cancelled) return;

      if (awake) {
        setBackendState('awake');
        return;
      }

      setBackendState('sleeping');

      pollInterval = setInterval(async () => {
        const ok = await ping(8000);
        if (ok && !cancelled) {
          clearInterval(pollInterval!);
          pollInterval = null;
          setBackendState('ready');
          setTimeout(() => { if (!cancelled) triggerRef.current(); }, 1500);
        }
      }, 5000);
    })();

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  if (backendState === 'sleeping' || backendState === 'ready') {
    return <WakingUpScreen isReady={backendState === 'ready'} />;
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#134174', cursor: 'pointer' }}
      onClick={trigger}
    >
      {/* Logo ICCU — esquina superior */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 transition-opacity duration-300"
        style={{ opacity: isZooming ? 0 : 0.7 }}
      >
        <img
          src="/logos/logo_simple.png"
          alt="ICCU"
          style={{ height: 60, width: 'auto', objectFit: 'contain' }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* Contenido central */}
      <div
        className="flex flex-col items-center gap-5 text-center px-8 select-none"
        style={{
          animation: isZooming
            ? 'titleZoomOut 700ms cubic-bezier(0.4,0,0.2,1) forwards'
            : undefined,
          transformOrigin: 'center center',
        }}
      >
        <h1
          className="shimmer-text leading-none"
          style={{
            fontFamily: "'Antonio', sans-serif",
            fontSize: 'clamp(4.5rem, 12vw, 10rem)',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          TALENTO HUMANO
        </h1>

        <p
          className="max-w-xl"
          style={{
            fontFamily: "'Roboto Condensed', sans-serif",
            fontSize: 'clamp(1rem, 2.2vw, 1.3rem)',
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Instituto de Caminos y Construcciones de Cundinamarca
        </p>

        <img
          src="/logos/logo_inicio.png"
          alt="ICCU"
          style={{ height: 'clamp(130px, 20vw, 210px)', width: 'auto', objectFit: 'contain', marginTop: '0.5rem', opacity: 0.9 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* Fade-out de la pantalla completa al hacer zoom */}
      {isZooming && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: '#134174',
            animation: 'screenFadeOut 400ms ease-in 500ms forwards',
            opacity: 0,
          }}
        />
      )}

      {/* Chevron pulsante */}
      <div
        className="absolute bottom-10 flex flex-col items-center gap-2 transition-opacity duration-300"
        style={{ opacity: isZooming ? 0 : 1 }}
      >
        <span
          style={{
            fontFamily: "'Roboto Condensed', sans-serif",
            fontSize: 11,
            letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
          }}
        >
          Haz clic para explorar
        </span>
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          style={{ animation: 'chevronPulse 1800ms ease-in-out infinite', color: 'rgba(255,255,255,0.4)' }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
