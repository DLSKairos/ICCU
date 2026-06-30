import type { Period } from '../../utils/metrics';
import { PERIOD_LABELS } from '../../utils/metrics';

const PERIODS: Period[] = ['semanal', 'mensual', 'trimestral', 'anual'];

interface PeriodSelectorProps {
  value: Period;
  onChange: (p: Period) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="w-full overflow-x-auto">
    <div
      className="flex gap-0.5 p-1 w-fit"
      style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(0,135,207,0.28)',
        borderRadius: 9999,
        boxShadow: '0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,1)',
      }}
    >
      {PERIODS.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="px-2.5 sm:px-5 py-1.5 sm:py-2 cursor-pointer transition-all duration-200 whitespace-nowrap"
          style={{
            fontFamily: "'Roboto Condensed', sans-serif",
            fontSize: 12,
            fontWeight: value === p ? 700 : 400,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            borderRadius: 9999,
            border: value === p ? '1px solid rgba(19,65,116,0.30)' : '1px solid transparent',
            background: value === p ? 'rgba(19,65,116,0.16)' : 'transparent',
            backdropFilter: value === p ? 'blur(8px) saturate(160%)' : 'none',
            WebkitBackdropFilter: value === p ? 'blur(8px) saturate(160%)' : 'none',
            boxShadow: value === p
              ? '0 2px 10px rgba(19,65,116,0.12), inset 0 1px 0 rgba(255,255,255,0.6)'
              : 'none',
            color: value === p ? '#134174' : 'rgba(19,65,116,0.55)',
          }}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
    </div>
  );
}
