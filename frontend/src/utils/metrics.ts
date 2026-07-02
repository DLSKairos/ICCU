import type { Process, Subactivity } from '../data/processes';

export type Period = 'semanal' | 'mensual' | 'trimestral' | 'anual';

export interface SubactivityMetrics {
  subactivityId: string;
  subactivityName: string;
  annualTarget: number;
  denominator: number;
  executed: number;
  percentage: number;
}

export interface ProcessMetrics {
  period: Period;
  annualTotal: number;
  denominator: number;
  executed: number;
  percentage: number;
  attendeesInPeriod: number;
  annualExecuted: number;
  subactivities: SubactivityMetrics[];
}

export function getDenominator(annualTarget: number, period: Period): number {
  const divisors: Record<Period, number> = {
    anual: 1,
    trimestral: 4,
    mensual: 12,
    semanal: 52,
  };
  return Math.ceil(annualTarget / divisors[period]);
}

function getPeriodStart(period: Period, reference: Date): Date {
  const d = new Date(reference);
  if (period === 'semanal') {
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'mensual') {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  if (period === 'trimestral') {
    const quarter = Math.floor(d.getMonth() / 3);
    return new Date(d.getFullYear(), quarter * 3, 1);
  }
  // anual
  return new Date(d.getFullYear(), 0, 1);
}

// Parsea una fecha del backend ("YYYY-MM-DD") como medianoche LOCAL, no UTC.
// `new Date("2026-07-01")` se interpreta como UTC y, en zonas con offset
// negativo (Colombia UTC-5), queda 5h antes del inicio de mes/trimestre
// construido en hora local, lo que excluía erróneamente las ejecuciones
// registradas justo el primer día del período.
export function parseLocalDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const [y, m, d] = value.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getExecutedInPeriod(
  subactivity: Subactivity,
  period: Period,
  today: Date = new Date()
): number {
  const start = getPeriodStart(period, today);
  return (subactivity.executions ?? [])
    .filter(e => {
      const date = parseLocalDate(e.date);
      return date >= start && date <= today;
    })
    .reduce((sum, e) => sum + e.count, 0);
}

export function getExecutedTotal(subactivity: Subactivity): number {
  return (subactivity.executions ?? []).reduce((sum, e) => sum + e.count, 0);
}

export function calcPercentage(executed: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.min(100, Math.round((executed / denominator) * 100 * 10) / 10);
}

export function calcProcessMetrics(
  process: Process,
  period: Period,
  today: Date = new Date()
): ProcessMetrics {
  const annualTotal = process.subactivities.reduce(
    (sum, s) => sum + s.annualTarget,
    0
  );
  const denominator = getDenominator(annualTotal, period);

  const subMetrics = process.subactivities.map(s => {
    const executed = getExecutedInPeriod(s, period, today);
    const den = getDenominator(s.annualTarget, period);
    return {
      subactivityId: s.id,
      subactivityName: s.name,
      annualTarget: s.annualTarget,
      denominator: den,
      executed,
      percentage: calcPercentage(executed, den),
    };
  });

  const executed = subMetrics.reduce((sum, s) => sum + s.executed, 0);
  const annualExecuted = process.subactivities.reduce(
    (sum, s) => sum + getExecutedTotal(s),
    0
  );

  // Participantes en el período (suma de actividades dentro del período)
  const periodStart = getPeriodStart(period, today);
  const attendeesInPeriod = (process.activities ?? [])
    .filter(a => {
      const date = parseLocalDate(a.date);
      return date >= periodStart && date <= today;
    })
    .reduce((sum, a) => sum + a.attendees, 0);

  return {
    period,
    annualTotal,
    denominator,
    executed,
    percentage: calcPercentage(executed, denominator),
    attendeesInPeriod,
    annualExecuted,
    subactivities: subMetrics,
  };
}

export const PERIOD_LABELS: Record<Period, string> = {
  semanal: 'Semanal',
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  anual: 'Anual',
};
