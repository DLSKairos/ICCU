import type { HistoricalYear } from '../../data/processes';

interface HistoricalBarProps {
  data: HistoricalYear[];
  currentYearPercentage: number;
}

export function HistoricalBar({ data, currentYearPercentage }: HistoricalBarProps) {
  const currentYear = new Date().getFullYear();
  const allYears = [
    ...data,
    { year: currentYear, percentage: currentYearPercentage },
  ].sort((a, b) => a.year - b.year);

  return (
    <div
      className="rounded-xl p-5 border"
      style={{
        background: 'rgba(0, 180, 166, 0.08)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderColor: 'rgba(0, 180, 166, 0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
      }}
    >
      <span
        className="text-xs uppercase tracking-widest block mb-4"
        style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Roboto Condensed', sans-serif" }}
      >
        Histórico de cumplimiento anual
      </span>
      <div className="flex flex-col gap-3">
        {allYears.map(({ year, percentage }) => {
          const isCurrent = year === currentYear;
          return (
            <div key={year} className="flex items-center gap-3">
              <span
                className="w-12 text-right text-sm shrink-0"
                style={{
                  fontFamily: "'Roboto Condensed', sans-serif",
                  color: isCurrent ? '#D4AF37' : 'rgba(255,255,255,0.6)',
                  fontWeight: isCurrent ? 700 : 400,
                }}
              >
                {year}
              </span>
              <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    background: isCurrent
                      ? 'linear-gradient(90deg, #C8A951, #D4AF37)'
                      : 'rgba(0,135,207,0.6)',
                  }}
                />
                <span
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold"
                  style={{
                    fontFamily: "'Antonio', sans-serif",
                    color: percentage > 15 ? 'rgba(255,255,255,0.9)' : '#D4AF37',
                    fontSize: 13,
                  }}
                >
                  {percentage}%
                </span>
              </div>
              {isCurrent && (
                <span
                  className="text-xs shrink-0"
                  style={{ color: '#D4AF37', fontFamily: "'Roboto Condensed', sans-serif" }}
                >
                  en curso
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
