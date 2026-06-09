import type { Period } from '../../utils/metrics';
import { PERIOD_LABELS } from '../../utils/metrics';

const PERIODS: Period[] = ['semanal', 'mensual', 'trimestral', 'anual'];

interface PeriodSelectorProps {
  value: Period;
  onChange: (p: Period) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
      {PERIODS.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={[
            'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer',
            'font-body tracking-wide',
            value === p
              ? 'bg-[#D4AF37] text-[#134174] font-bold shadow'
              : 'text-white/70 hover:text-white hover:bg-white/10',
          ].join(' ')}
          style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}
