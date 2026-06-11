import type { Period } from '../../utils/metrics';
import { PERIOD_LABELS } from '../../utils/metrics';

const PERIODS: Period[] = ['semanal', 'mensual', 'trimestral', 'anual'];

interface PeriodSelectorProps {
  value: Period;
  onChange: (p: Period) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div
      className="flex gap-0.5 p-1 w-fit"
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 9999,
        boxShadow: '0 4px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)',
      }}
    >
      {PERIODS.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="px-5 py-2 cursor-pointer transition-all duration-200"
          style={{
            fontFamily: "'Roboto Condensed', sans-serif",
            fontSize: 12,
            fontWeight: value === p ? 700 : 400,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            borderRadius: 9999,
            border: value === p
              ? '1px solid rgba(212,175,55,0.45)'
              : '1px solid transparent',
            background: value === p
              ? 'rgba(212,175,55,0.18)'
              : 'transparent',
            backdropFilter: value === p ? 'blur(8px)' : 'none',
            WebkitBackdropFilter: value === p ? 'blur(8px)' : 'none',
            boxShadow: value === p
              ? '0 2px 12px rgba(212,175,55,0.18), inset 0 1px 0 rgba(255,255,255,0.2)'
              : 'none',
            color: value === p ? '#D4AF37' : 'rgba(255,255,255,0.55)',
          }}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
