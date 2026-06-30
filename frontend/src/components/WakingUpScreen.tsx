import { useState } from 'react';
import { BridgeGame } from './BridgeGame';

interface Props {
  isReady: boolean;
}

export function WakingUpScreen({ isReady }: Props) {
  const [score, setScore] = useState(0);

  if (isReady) {
    return <CompletionScreen score={score} />;
  }

  return <BridgeGame score={score} onScore={() => setScore(s => s + 1)} />;
}

function CompletionScreen({ score }: { score: number }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#134174', zIndex: 10000 }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes readyPulse {
          0%, 100% { opacity: 0.88; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* Logo */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2" style={{ opacity: 0.4 }}>
        <img
          src="/logos/logo_simple.png"
          alt="ICCU"
          style={{ height: 44, width: 'auto', objectFit: 'contain' }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      <div
        className="flex flex-col items-center text-center px-8"
        style={{ animation: 'fadeUp 0.5s ease-out forwards' }}
      >
        {/* Title */}
        <div style={{ lineHeight: 1 }}>
          <div style={{
            fontFamily: "'Antonio', sans-serif",
            fontSize: 'clamp(3rem, 10vw, 6.5rem)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: 'rgba(90,210,120,0.92)',
            animation: 'readyPulse 1.6s ease-in-out infinite',
          }}>
            ¡RUTA
          </div>
          <div style={{
            fontFamily: "'Antonio', sans-serif",
            fontSize: 'clamp(3rem, 10vw, 6.5rem)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: 'rgba(90,210,120,0.92)',
            animation: 'readyPulse 1.6s ease-in-out infinite',
          }}>
            HABILITADA!
          </div>
        </div>

        {/* Score section */}
        {score > 0 && (
          <div style={{ marginTop: 36, animation: 'fadeUp 0.5s 0.2s ease-out both' }}>
            <div style={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 'clamp(10px, 2.5vw, 13px)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 8,
            }}>
              Mientras esperabas construiste
            </div>
            <div style={{
              fontFamily: "'Antonio', sans-serif",
              fontSize: 'clamp(4rem, 14vw, 8rem)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'rgba(255,255,255,0.92)',
              lineHeight: 1,
            }}>
              {score}
            </div>
            <div style={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)',
              marginTop: 6,
            }}>
              {score === 1 ? 'puente' : 'puentes'}
            </div>
          </div>
        )}

        {/* Iniciando */}
        <div style={{
          marginTop: score > 0 ? 40 : 28,
          fontFamily: "'Roboto Condensed', sans-serif",
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)',
          animation: 'fadeUp 0.5s 0.4s ease-out both',
        }}>
          Iniciando...
        </div>
      </div>
    </div>
  );
}
