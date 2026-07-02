import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapTransition } from '../hooks/useMapTransition';
import { WakingUpScreen } from '../components/WakingUpScreen';

// Flujo de la portada:
//  intro  → esperando el click de "continuar"
//  waking → se hizo click: el ping despierta el backend y mostramos BridgeGame
//           + polling hasta que responda (en Render free siempre está dormido)
//  ready  → el backend respondió → CompletionScreen y luego zoom al mapa
type Flow = 'intro' | 'waking' | 'ready';

export function IntroPage() {
  const { state, trigger } = useMapTransition();
  const isZooming = state === 'zooming';
  const [flow, setFlow] = useState<Flow>('intro');
  const triggerRef = useRef(trigger);
  useEffect(() => { triggerRef.current = trigger; }, [trigger]);

  // Un ping cuenta como "despierto" SOLO con respuesta 2xx.
  // Render devuelve 502/503 mientras arranca; eso no debe pasar como despierto.
  const ping = useCallback(async (timeoutMs: number): Promise<boolean> => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(t);
    }
  }, []);

  // El usuario dio "click para continuar": mostramos el juego y arrancamos
  // el ping que despierta el backend. Nunca vamos al mapa con el backend dormido.
  const handleContinue = useCallback(() => {
    setFlow(f => (f === 'intro' ? 'waking' : f));
  }, []);

  // waking: BridgeGame en pantalla mientras hacemos polling hasta que despierte.
  // El primer ping ya arranca el cold start; si por casualidad estuviera despierto
  // (alguien entró hace <15 min) responde en <1s y saltamos al mapa enseguida.
  useEffect(() => {
    if (flow !== 'waking') return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      const up = await ping(8000);
      if (cancelled) return;
      if (up) { setFlow('ready'); return; }
      timer = setTimeout(poll, 3000);
    };
    poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [flow, ping]);

  // ready: dejamos ver el CompletionScreen un momento y luego zoom al mapa.
  useEffect(() => {
    if (flow !== 'ready') return;
    const t = setTimeout(() => triggerRef.current(), 1500);
    return () => clearTimeout(t);
  }, [flow]);

  if (flow === 'waking' || flow === 'ready') {
    return <WakingUpScreen isReady={flow === 'ready'} />;
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#134174', cursor: 'pointer' }}
      onClick={handleContinue}
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

      {/* Chevron pulsante / estado de conexión */}
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
