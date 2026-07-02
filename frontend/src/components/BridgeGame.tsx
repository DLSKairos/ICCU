import { useCallback, useEffect, useRef, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
const VW = 440;
const VH = 190;
const GY = 148;
const EDGE_X = 118;            // punto de construcción = borde derecho de la plataforma actual
const TW = 48;
const TH = 36;
const IDLE_X = EDGE_X - TW - 5; // posición de reposo del camión (65)
const GROW = 3.2;
const SPIN = 5;
const WALK = 3;
const FALL_Y = 6;
const PERFECT_TOL = 10;        // px de tolerancia respecto al centro para un aterrizaje "perfecto"
const GAP_MIN = 65;            // hueco mínimo hasta el borde izquierdo de la siguiente plataforma
const GAP_RAND = 110;
const W_MIN = 58;              // ancho de plataforma
const W_RAND = 78;
const FILL_MARGIN = 60;        // mantenemos plataformas hasta que la última pase VW+margen
const SCROLL_STEP = 0.055;     // avance por frame del scroll (~18 frames ≈ 0.3s)
const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212,175,55,0.45)';

// Provincias reales de Cundinamarca — el camión va "conectando" el departamento.
const PROVINCES = [
  'Rionegro', 'Almeidas', 'Ubaté', 'Guavio', 'Sabana Centro',
  'Sabana Occidente', 'Gualivá', 'Tequendama', 'Sumapaz', 'Alto Magdalena',
  'Magdalena Centro', 'Bajo Magdalena', 'Medina', 'Soacha', 'Oriente',
];
const provName = (seq: number) => PROVINCES[((seq % PROVINCES.length) + PROVINCES.length) % PROVINCES.length];

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// Fondo que deriva sutilmente por provincia — siempre azul ICCU, con matices.
// En seq=0 coincide con #134174 (mismo azul de la portada) para no dar saltos.
function bgFor(seq: number): string {
  const h = 211 + 10 * Math.sin(seq * 0.7);
  const l = 26.5 + 2.5 * Math.sin(seq * 0.55);
  return `hsl(${h.toFixed(1)}, 72%, ${l.toFixed(1)}%)`;
}

// Vibración táctil (móvil). Silencioso si el dispositivo/navegador no lo soporta.
function vibrate(pattern: number | number[]) {
  try { navigator.vibrate?.(pattern); } catch { /* no-op */ }
}

type Phase = 'idle' | 'growing' | 'rotating' | 'walking' | 'scrolling' | 'dying' | 'dead';

interface Plat {
  x: number;   // borde izquierdo (coords de escena, con scroll = 0)
  w: number;
  seq: number; // índice absoluto → provincia = provName(seq)
}

interface G {
  phase: Phase;
  stickLen: number;
  stickAngle: number;
  plats: Plat[];    // plats[0] = actual (borde der. en EDGE_X), plats[1] = siguiente, …
  scroll: number;   // desplazamiento de cámara durante la fase 'scrolling'
  scrollT: number;  // progreso 0→1 del scroll
  shift: number;    // desplazamiento objetivo de la ronda
  truckX: number;
  truckY: number;
  holding: boolean;
  landX: number;    // x del último aterrizaje (para el anillo de impacto)
  perfect: boolean; // si el último aterrizaje cayó cerca del centro
}

function makePlat(rightEdge: number, seq: number): Plat {
  return {
    x: rightEdge + GAP_MIN + Math.floor(Math.random() * GAP_RAND),
    w: W_MIN + Math.floor(Math.random() * W_RAND),
    seq,
  };
}

// Rellena la cola hasta que la última plataforma quede fuera de pantalla:
// así siempre hay una entrando por la derecha y nunca aparece de golpe.
function refill(plats: Plat[]): Plat[] {
  const out = plats.slice();
  while (out[out.length - 1].x + out[out.length - 1].w <= VW + FILL_MARGIN) {
    const last = out[out.length - 1];
    out.push(makePlat(last.x + last.w, last.seq + 1));
  }
  return out;
}

const initPlats = () => refill([{ x: 0, w: EDGE_X, seq: 0 }]);

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
function Platform({ x, w, seq }: { x: number; w: number; seq: number }) {
  return (
    <g>
      <rect x={x} y={GY} width={w} height={VH - GY + 40} fill="rgba(255,255,255,0.09)" />
      <rect x={x} y={GY} width={w} height={3} fill="rgba(255,255,255,0.22)" />
      {w > 80 && Array.from({ length: Math.floor(w / 28) }).map((_, i) => (
        <rect key={i} x={x + 10 + i * 28} y={GY + 9} width={14} height={2} rx={1}
          fill="rgba(255,255,255,0.1)" />
      ))}
      {/* Nombre de la provincia sobre la plataforma — pasa a la vista al avanzar */}
      <text
        x={x + w / 2} y={GY + 26} textAnchor="middle"
        style={{
          fontFamily: "'Roboto Condensed', sans-serif", fontSize: 9,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          fill: 'rgba(212,175,55,0.5)',
        }}
      >
        {provName(seq)}
      </text>
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
    plats: initPlats(), scroll: 0, scrollT: 0, shift: 0,
    truckX: IDLE_X, truckY: GY, holding: false,
    landX: 0, perfect: false,
  });
  const [, setTick] = useState(0);
  const redraw = useCallback(() => setTick(n => n + 1), []);

  // Barra de carga: avanza hasta 85% y ahí "respira". El fin real lo marca el
  // ping del backend (no el reloj), así que nunca fingimos un 100%.
  useEffect(() => {
    let r1: number, r2: number;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        if (barRef.current) barRef.current.style.width = '85%';
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
      const tip = EDGE_X + s.stickLen;
      const next = s.plats[1];
      s.phase = (tip >= next.x && tip <= next.x + next.w) ? 'walking' : 'dying';
    }

    if (s.phase === 'walking') {
      const next = s.plats[1];
      const target = next.x + next.w - TW - 5;
      if (s.truckX < target) {
        s.truckX = Math.min(target, s.truckX + WALK);
        redraw();
        rafId.current = requestAnimationFrame(loop);
        return;
      }
      const tip = EDGE_X + s.stickLen;
      const center = next.x + next.w / 2;
      s.perfect = Math.abs(tip - center) <= PERFECT_TOL;
      s.landX = tip;
      vibrate(s.perfect ? [10, 25, 10] : 12);
      onScore();
      // Arranca el desplazamiento de cámara hacia la nueva plataforma.
      s.shift = (next.x + next.w) - EDGE_X;
      s.scroll = 0;
      s.scrollT = 0;
      s.phase = 'scrolling';
      redraw();
      rafId.current = requestAnimationFrame(loop);
      return;
    }

    if (s.phase === 'scrolling') {
      s.scrollT += SCROLL_STEP;
      if (s.scrollT < 1) {
        s.scroll = s.shift * easeOut(s.scrollT);
        redraw();
        rafId.current = requestAnimationFrame(loop);
        return;
      }
      // Commit: la siguiente pasa a ser la actual (borde en EDGE_X) sin salto visual.
      const shifted = s.plats.slice(1).map(p => ({ ...p, x: p.x - s.shift }));
      s.plats = refill(shifted);
      s.truckX = IDLE_X; s.truckY = GY;
      s.stickLen = 0; s.stickAngle = -90;
      s.scroll = 0; s.scrollT = 0;
      s.phase = 'idle';
      redraw();
      return;
    }

    if (s.phase === 'dying') {
      const edge = EDGE_X + s.stickLen + 6;
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
      vibrate(55);
      redraw();
      tmId.current = setTimeout(() => {
        // Reintento: mismo tramo actual, se regenera lo que viene. Sin avanzar.
        s.plats = refill([s.plats[0]]);
        s.stickLen = 0; s.stickAngle = -90;
        s.truckX = IDLE_X; s.truckY = GY;
        s.phase = 'idle';
        redraw();
      }, 600);
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
  const wrap = s.scroll ? `translate(${-s.scroll},0)` : undefined;

  return (
    <div
      className="fixed inset-0 flex flex-col select-none overflow-hidden"
      style={{
        backgroundColor: bgFor(s.plats[0].seq),
        transition: 'background-color 0.7s ease',
        touchAction: 'none', cursor: 'pointer', zIndex: 10000,
      }}
      onPointerDown={startHold}
    >
      <style>{`
        @keyframes scoreFlash {
          0%   { color: ${GOLD_DIM}; transform: scale(1); }
          30%  { color: ${GOLD};     transform: scale(1.2); }
          100% { color: ${GOLD_DIM}; transform: scale(1); }
        }
        @keyframes ringPop {
          from { opacity: 0.6; transform: scale(0.25); }
          to   { opacity: 0;   transform: scale(2.6); }
        }
        @keyframes tipPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.5); }
        }
        @keyframes perfectFloat {
          0%   { opacity: 0; transform: translateY(4px) scale(0.85); }
          30%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-14px) scale(1.05); }
        }
        @keyframes barShimmer {
          0%        { transform: translateX(-100%); }
          60%, 100% { transform: translateX(100%); }
        }
        @keyframes tapRipple {
          0%   { opacity: 0.55; transform: scale(0.3); }
          70%  { opacity: 0; }
          100% { opacity: 0; transform: scale(2.4); }
        }
        @keyframes tapPress {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(5px); }
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
          {score === 1 ? 'tramo' : 'tramos'}
        </div>
      </div>

      {/* ── Contenido: título + juego + instrucciones en flujo ───────────── */}
      <div
        className="flex flex-col items-center flex-1 w-full"
        style={{ paddingTop: 84, paddingBottom: 24 }}
      >
        {/* Título */}
        <div className="text-center pointer-events-none" style={{ marginBottom: 6 }}>
          <h2 style={{
            fontFamily: "'Antonio', sans-serif",
            fontSize: 'clamp(26px, 8vw, 44px)',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: GOLD,
            lineHeight: 1,
          }}>
            TIENDE<br />EL PUENTE
          </h2>
          {/* Rumbo temático: hacia qué provincia se está tendiendo la vía */}
          <div style={{
            marginTop: 8,
            fontFamily: "'Roboto Condensed', sans-serif",
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
          }}>
            Vía a <span style={{ color: GOLD }}>{provName(s.plats[1].seq)}</span>
          </div>
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

            {/* Mundo desplazable: plataformas, abismos, camino y camión */}
            <g transform={wrap}>
              {/* Abismos entre plataformas */}
              {s.plats.slice(0, -1).map((p, i) => {
                const nx = s.plats[i + 1].x;
                const gx = p.x + p.w;
                return nx - gx > 4 ? (
                  <rect key={`ab-${p.seq}`} x={gx} y={GY} width={nx - gx} height={VH - GY + 40}
                    fill="url(#abyss)" />
                ) : null;
              })}

              {/* Plataformas con su nombre de provincia */}
              {s.plats.map(p => (
                <Platform key={p.seq} x={p.x} w={p.w} seq={p.seq} />
              ))}

              {/* Puente/camino: crece vertical, rota y queda tendido al cruzar */}
              {s.stickLen > 0 && (
                <rect
                  x={EDGE_X} y={GY}
                  width={s.stickLen} height={5} rx={2.5}
                  fill="rgba(255,255,255,0.82)"
                  transform={`rotate(${s.stickAngle},${EDGE_X},${GY})`}
                />
              )}

              <Truck x={s.truckX} y={s.truckY} tilt={tilt} />

              {/* Punta de energía pulsante mientras se carga el puente */}
              {s.phase === 'growing' && (
                <circle
                  cx={EDGE_X} cy={GY - s.stickLen} r={4.5} fill={GOLD}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'tipPulse 0.6s ease-in-out infinite' }}
                />
              )}

              {/* Anillo de impacto en el punto de aterrizaje */}
              {score > 0 && (
                <g key={`ring-${score}`}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'ringPop 0.5s ease-out forwards' }}>
                  <circle cx={s.landX} cy={GY} r={9} fill="none" stroke={GOLD} strokeWidth={2} />
                </g>
              )}

              {/* Recompensa por centro perfecto */}
              {score > 0 && s.perfect && (
                <text
                  key={`perfect-${score}`}
                  x={s.landX} y={GY - 12} textAnchor="middle"
                  style={{
                    fontFamily: "'Antonio', sans-serif", fontWeight: 700, fontSize: 15,
                    letterSpacing: '0.05em', fill: GOLD,
                    transformBox: 'fill-box', transformOrigin: 'center',
                    animation: 'perfectFloat 0.75s ease-out forwards',
                  }}
                >
                  ¡PERFECTO!
                </text>
              )}
            </g>

            {/* Onboarding: indicador de "mantén presionado" en el borde de construcción */}
            {isIdle && score === 0 && (
              <g pointerEvents="none">
                <circle cx={EDGE_X} cy={GY} r={10} fill="none" stroke={GOLD} strokeWidth={2}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'tapRipple 1.6s ease-out infinite' }} />
                <circle cx={EDGE_X} cy={GY} r={10} fill="none" stroke={GOLD} strokeWidth={2}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'tapRipple 1.6s ease-out infinite', animationDelay: '0.8s' }} />
                <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'tapPress 1.6s ease-in-out infinite' }}>
                  <circle cx={EDGE_X} cy={GY - 34} r={7} fill={GOLD} />
                  <circle cx={EDGE_X} cy={GY - 34} r={11} fill="none" stroke={GOLD} strokeWidth={1.5} opacity={0.4} />
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Spacer — empuja instrucciones al fondo */}
        <div style={{ flex: 1, minHeight: 12 }} />

        {/* ── Instrucción única en flujo ──────────────────────────────── */}
        <div
          className="pointer-events-none text-center w-full"
          style={{ padding: '0 28px', minHeight: 44, position: 'relative' }}
        >
          {/* Primera vez */}
          <div style={{
            position: 'absolute', inset: 0,
            opacity: isIdle && score === 0 ? 1 : 0,
            transition: 'opacity 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 13, letterSpacing: '0.09em', textTransform: 'uppercase', color: GOLD }}>
              Mantén presionado para tender el puente
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
              Mantén presionado para el siguiente tramo
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
              ¡Casi! Va de nuevo…
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
          Preparando el servidor…
        </div>
        <div style={{
          position: 'relative',
          height: 4,
          background: 'rgba(212,175,55,0.2)',
          borderRadius: 99,
          overflow: 'hidden',
        }}>
          <div
            ref={barRef}
            style={{
              height: '100%',
              width: '0%',
              background: `linear-gradient(90deg, rgba(212,175,55,0.4), ${GOLD})`,
              borderRadius: 99,
              transition: 'width 72s cubic-bezier(0.15,0.6,0.25,1)',
            }}
          />
          {/* Barrido continuo: comunica "sigo trabajando" sin fingir un final */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'barShimmer 1.9s ease-in-out infinite',
          }} />
        </div>
      </div>
    </div>
  );
}
