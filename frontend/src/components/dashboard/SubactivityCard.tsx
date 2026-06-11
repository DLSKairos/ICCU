import { useState } from 'react';
import type { Activity, Process } from '../../data/processes';
import type { SubactivityMetrics } from '../../utils/metrics';

interface SubactivityCardProps {
  metrics: SubactivityMetrics;
  process: Process;
}

export function SubactivityCard({ metrics, process }: SubactivityCardProps) {
  const [expanded, setExpanded] = useState(false);

  const recentActivities: Activity[] = process.activities
    .filter(a => a.subactivityId === metrics.subactivityId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-250"
      style={{
        background: 'rgba(0, 180, 166, 0.08)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderColor: expanded ? 'rgba(212,175,55,0.4)' : 'rgba(0, 180, 166, 0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
      }}
    >
      {/* Header colapsado */}
      <button
        className="w-full flex items-center gap-4 p-4 cursor-pointer text-left"
        onClick={() => setExpanded(e => !e)}
        style={{ background: 'transparent', border: 'none', color: 'inherit' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span
              className="font-medium truncate"
              style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 15, color: '#fff' }}
            >
              {metrics.subactivityName}
            </span>
            <span
              className="ml-4 shrink-0 text-lg font-bold"
              style={{ fontFamily: "'Antonio', sans-serif", color: '#D4AF37' }}
            >
              {metrics.percentage}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, metrics.percentage)}%`,
                background: 'linear-gradient(90deg, #C8A951, #D4AF37)',
              }}
            />
          </div>
        </div>
        <svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 transition-transform duration-250"
          style={{
            color: 'rgba(255,255,255,0.4)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Detalle expandido */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Ejecutado', value: metrics.executed },
              { label: 'Planeado', value: metrics.denominator },
              { label: 'Meta anual', value: metrics.annualTarget },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div
                  style={{
                    fontFamily: "'Antonio', sans-serif",
                    fontSize: '1.6rem',
                    color: '#D4AF37',
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Roboto Condensed', sans-serif" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {recentActivities.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Roboto Condensed', sans-serif" }}>
                Últimas actividades
              </p>
              <div className="flex flex-col gap-1">
                {recentActivities.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 text-sm"
                    style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    <span style={{ color: '#D4AF37', fontSize: 11 }}>
                      {new Date(a.date + 'T00:00:00').toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short',
                      })}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.75)' }} className="truncate">{a.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
