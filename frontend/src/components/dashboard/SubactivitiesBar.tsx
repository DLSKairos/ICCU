import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import type { SubactivityMetrics } from '../../utils/metrics';

interface SubactivitiesBarProps {
  subactivities: SubactivityMetrics[];
}

export function SubactivitiesBar({ subactivities }: SubactivitiesBarProps) {
  const data = subactivities.map(s => ({
    name: s.subactivityName.length > 20
      ? s.subactivityName.slice(0, 18) + '…'
      : s.subactivityName,
    ejecutado: s.executed,
    planeado: s.denominator,
    pct: s.percentage,
  }));

  return (
    <div
      className="rounded-xl p-5 border flex flex-col gap-3"
      style={{
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderColor: 'rgba(0, 135, 207, 0.28)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)',
      }}
    >
      <span
        className="text-xs uppercase tracking-widest"
        style={{ color: '#134174', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700 }}
      >
        Comparativo subactividades
      </span>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(19,65,116,0.08)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'rgba(19,65,116,0.65)', fontSize: 11, fontFamily: "'Roboto Condensed', sans-serif" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(19,65,116,0.55)', fontSize: 11, fontFamily: "'Roboto Condensed', sans-serif" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#134174',
              border: '1px solid #D4AF37',
              borderRadius: 6,
              fontFamily: "'Roboto Condensed', sans-serif",
              color: '#fff',
              fontSize: 13,
            }}
            formatter={(value: number, name: string) => [
              value,
              name === 'ejecutado' ? 'Ejecutado' : 'Planeado',
            ]}
          />
          <Bar dataKey="planeado" fill="rgba(0,135,207,0.35)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ejecutado" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="#D4AF37" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
