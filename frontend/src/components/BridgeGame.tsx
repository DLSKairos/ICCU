import { useCallback, useEffect, useRef, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
const VW = 440;
const VH = 190;
const GY = 148;
const P1W = 118;
const TW = 48;
const TH = 36;
const IDLE_X = P1W - TW - 5;
const GROW = 3.2;
const SPIN = 5;
const WALK = 3;
const FALL_Y = 6;
const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212,175,55,0.45)';

type Phase = 'idle' | 'growing' | 'rotating' | 'walking' | 'dying' | 'dead';

interface G {
  phase: Phase;
  stickLen: number;
  stickAngle: number;
  p2x: number;
  p2w: number;
  truckX: number;
  truckY: number;
  holding: boolean;
}

function newP2(): { p2x: number; p2w: number } {
  return {
    p2x: P1W + 65 + Math.floor(Math.random() * 110),
    p2w: 58 + Math.floor(Math.random() * 78),
  };
}

// ── Truck ─────────────────────────────────────────────────────────────────────
function Truck({ x, y, tilt }: { x: number; y: number; tilt: number }) {
  const px = TW / 2;
  const py = -TH / 2;
  return (
    <g transform={`translate(${x},${y})`}>
      <g transform={tilt !== 0 ? `rotate(${tilt},${px},${py})` : undefined}>
        <rect x={0} y={-TH} width={TW - 13} height={TH - 11} rx={3} fill="#E9A020" />
        <rect x={TW - 15} y={-TH - 8} width={15} height={TH - 3} rx={3} fill="#E9A020" />
        <rect x={TW - 14} y={-TH - 5} width={12} height={8} rx={2} fill="rgba(19,65,116,0.52)" />
        <rect x={2} y={-TH + 5} width={TW - 17} height={3} rx={1} fill="rgba(255,255,255,0.22)" />
        {([10, TW - 8] as number[]).map(cx => (
          <g key={cx}>
            <circle cx={cx} cy={-9} r={9} fill="#0f172a" />
            <circle cx={cx} cy={-9} r={4} fill="rgba(255,255,255,0.1)" />
            <circle cx={cx} cy={-9} r={1.5} fill="rgba(255,255,255,0.25)" />
          </g>
        ))}
      </g>
    </g>
  );
}

// ── Platform ──────────────────────────────────────────────────────────────────
function Platform({ x, w }: { x: number; w: number }) {
  return (
    <g>
      <rect x={x} y={GY} width={w} height={VH - GY + 40} fill="rgba(255,255,255,0.09)" />
      <rect x={x} y={GY} width={w} height={3} fill="rgba(255,255,255,0.22)" />
      {w > 80 && Array.from({ length: Math.floor(w / 28) }).map((_, i) => (
        <rect key={i} x={x + 10 + i * 28} y={GY + 9} width={14} height={2} rx={1}
          fill="rgba(255,255,255,0.1)" />
      ))}
    </g>
  );
}

// ── Game ──────────────────────────────────────────────────────────────────────
interface Props {
  score: number;
  onScore: () => void;
}

export function BridgeGame({ score, onScore }: Props) {
  const rafId  = useRef(0);
  const tmId   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const g = useRef<G>({
    phase: 'idle', stickLen: 0, stickAngle: -90,
    ...newP2(), truckX: IDLE_X, truckY: GY, holding: false,
  });
  const [, setTick] = useState(0);
  const redraw = useCallback(() => setTick(n => n + 1), []);

  // Start the 90-second loading bar after first paint
  useEffect(() => {
    let r1: number, r2: number;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        if (barRef.current) barRef.current.style.width = '100%';
      });
    });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, []);

  const loop = useCallback(() => {
    const s = g.current;

    if (s.phase === 'growing') {
      if (s.holding) {
        s.stickLen += GROW;
        redraw();
        rafId.current = requestAnimationFrame(loop);
        return;
      }
      s.phase = 'rotating';
    }

    if (s.phase === 'rotating') {
      s.stickAngle = Math.min(0, s.stickAngle + SPIN);
      redraw();
      if (s.stickAngle < 0) { rafId.current = requestAnimationFrame(loop); return; }
      const tip = P1W + s.stickLen;
      s.phase = (tip >= s.p2x && tip <= s.p2x + s.p2w) ? 'walking' : 'dying';
    }

    if (s.phase === 'walking') {
      const target = s.p2x + 16;
      if (s.truckX < target) {
        s.truckX = Math.min(target, s.truckX + WALK);
        redraw();
        rafId.current = requestAnimationFrame(loop);
        return;
      }
      onScore();
      const next = newP2();
      s.p2x = next.p2x; s.p2w = next.p2w;
      s.stickLen = 0; s.stickAngle = -90;
      s.truckX = IDLE_X; s.truckY = GY;
      s.phase = 'idle';
      redraw();
      return;
    }

    if (s.phase === 'dying') {
      const edge = P1W + s.stickLen + 6;
      if (s.truckX < edge) {
        s.truckX = Math.min(edge, s.truckX + WALK);
        redraw();
        rafId.current = requestAnimationFrame(loop);
        return;
      }
      if (s.truckY < GY + 30) {
        s.truckY += FALL_Y; s.truckX += 1.8;
        redraw();
        rafId.current = requestAnimationFrame(loop);
        return;
      }
      s.phase = 'dead';
      redraw();
      tmId.current = setTimeout(() => {
        const next = newP2();
        s.p2x = next.p2x; s.p2w = next.p2w;
        s.stickLen = 0; s.stickAngle = -90;
        s.truckX = IDLE_X; s.truckY = GY;
        s.phase = 'idle';
        redraw();
      }, 1200);
      return;
    }
  }, [onScore, redraw]);

  const startHold = useCallback(() => {
    if (g.current.phase !== 'idle') return;
    g.current.phase = 'growing';
    g.current.holding = true;
    rafId.current = requestAnimationFrame(loop);
  }, [loop]);

  const endHold = useCallback(() => { g.current.holding = false; }, []);

  useEffect(() => {
    window.addEventListener('pointerup', endHold);
    return () => {
      window.removeEventListener('pointerup', endHold);
      cancelAnimationFrame(rafId.current);
      if (tmId.current) clearTimeout(tmId.current);
    };
  }, [endHold]);

  const s = g.current;
  const tilt = s.phase === 'dying' && s.truckY > GY + 24 ? 22 : 0;
  const isIdle = s.phase === 'idle';
  const isDead = s.phase === 'dead';

  return (
    <div
      className="fixed inset-0 flex flex-col select-none overflow-hidden"
      style={{ background: '#134174', touchAction: 'none', cursor: 'pointer', zIndex: 10000 }}
      onPointerDown={startHold}
    >
      <style>{`
        @keyframes scoreFlash {
          0%   { color: ${GOLD_DIM}; transform: scale(1); }
          30%  { color: ${GOLD};     transform: scale(1.2); }
          100% { color: ${GOLD_DIM}; transform: scale(1); }
        }
      `}</style>

      {/* ── Logo — grande y nítido ─────────────────────────────────────────── */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-none">
        <img
          src="/logos/logo_simple.png"
          alt="ICCU"
          style={{ height: 62, width: 'auto', objectFit: 'contain', opacity: 0.72 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* ── Score — top right en dorado ───────────────────────────────────── */}
      <div className="absolute top-5 right-5 text-right pointer-events-none">
        <div
          key={score}
          style={{
            fontFamily: "'Antonio', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: GOLD_DIM,
            lineHeight: 1,
            animation: score > 0 ? 'scoreFlash 0.55s ease-out forwards' : 'none',
          }}
        >
          {score}
        </div>
        <div style={{
          fontFamily: "'Roboto Condensed', sans-serif",
          fontSize: 9,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: 'rgba(212,175,55,0.3)',
        }}>
          {score === 1 ? 'puente' : 'puentes'}
        </div>
      </div>

      {/* ── Contenido: título + juego + instrucciones en flujo ───────────── */}
      <div
        className="flex flex-col items-center flex-1 w-full"
        style={{ paddingTop: 88, paddingBottom: 24 }}
      >
        {/* Título */}
        <div className="text-center pointer-events-none" style={{ marginBottom: 12 }}>
          <h2 style={{
            fontFamily: "'Antonio', sans-serif",
            fontSize: 'clamp(28px, 8.5vw, 48px)',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: GOLD,
            lineHeight: 1,
          }}>
            TIENDE<br />EL PUENTE
          </h2>
        </div>

        {/* Escena SVG */}
        <div style={{ width: '100%', maxWidth: VW + 24, padding: '0 8px', overflow: 'hidden' }}>
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            style={{ width: '100%', display: 'block' }}
          >
            <defs>
              <linearGradient id="abyss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
            </defs>
            {s.p2x > P1W + 4 && (
              <rect x={P1W} y={GY} width={s.p2x - P1W} height={VH - GY + 40}
                fill="url(#abyss)" />
            )}
            <Platform x={0} w={P1W} />
            <Platform x={s.p2x} w={s.p2w} />
            {s.stickLen > 0 && (
              <rect
                x={P1W} y={GY}
                width={s.stickLen} height={5} rx={2.5}
                fill="rgba(255,255,255,0.82)"
                transform={`rotate(${s.stickAngle},${P1W},${GY})`}
              />
            )}
            <Truck x={s.truckX} y={s.truckY} tilt={tilt} />
          </svg>
        </div>

        {/* Spacer — empuja instrucciones al fondo */}
        <div style={{ flex: 1, minHeight: 16 }} />

        {/* ── Instrucciones en flujo, nunca tocan el juego ────────────── */}
        <div
          className="pointer-events-none text-center w-full"
          style={{ padding: '0 28px', minHeight: 82, position: 'relative' }}
        >
          {/* Primera vez */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: isIdle && score === 0 ? 1 : 0,
            transition: 'opacity 0.3s',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 13, letterSpacing: '0.09em', textTransform: 'uppercase', color: GOLD }}>
              Mantén presionado para crear el puente
            </span>
            <span style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 13, letterSpacing: '0.09em', textTransform: 'uppercase', color: GOLD }}>
              Debe tener la longitud exacta del hueco
            </span>
            <span style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 13, letterSpacing: '0.09em', textTransform: 'uppercase', color: GOLD_DIM }}>
              Muy corto o muy largo → pierdes
            </span>
          </div>

          {/* Repetir */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: isIdle && score > 0 ? 1 : 0,
            transition: 'opacity 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 13, letterSpacing: '0.09em', textTransform: 'uppercase', color: GOLD }}>
              Mantén presionado para el siguiente puente
            </span>
          </div>

          {/* Muerto */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: isDead ? 1 : 0,
            transition: 'opacity 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 13, letterSpacing: '0.09em', textTransform: 'uppercase', color: GOLD_DIM }}>
              ¡El puente no alcanzó! Reintentando...
            </span>
          </div>
        </div>
      </div>

      {/* ── Barra de carga — en flujo, siempre visible al fondo ─────────── */}
      <div style={{ padding: '10px 16px 22px', flexShrink: 0 }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 8,
          fontFamily: "'Roboto Condensed', sans-serif",
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(212,175,55,0.5)',
        }}>
          El servidor estará listo en aprox. 1:30
        </div>
        <div style={{
          height: 3,
          background: 'rgba(212,175,55,0.2)',
          borderRadius: 99,
        }}>
          <div
            ref={barRef}
            style={{
              height: '100%',
              width: '0%',
              background: `linear-gradient(90deg, rgba(212,175,55,0.4), ${GOLD})`,
              borderRadius: 99,
              transition: 'width 90s linear',
            }}
          />
        </div>
      </div>
    </div>
  );
}
