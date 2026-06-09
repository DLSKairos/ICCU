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
        background: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <span
        className="text-xs uppercase tracking-widest"
        style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Roboto Condensed', sans-serif" }}
      >
        Comparativo subactividades
      </span>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: "'Roboto Condensed', sans-serif" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: "'Roboto Condensed', sans-serif" }}
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
