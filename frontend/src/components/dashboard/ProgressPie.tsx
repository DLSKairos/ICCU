import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface ProgressPieProps {
  executed: number;
  denominator: number;
  label?: string;
}

export function ProgressPie({ executed, denominator, label = 'Avance del período' }: ProgressPieProps) {
  const pending = Math.max(0, denominator - executed);
  const data = [
    { name: 'Ejecutado', value: executed },
    { name: 'Pendiente', value: pending },
  ];

  return (
    <div
      className="rounded-xl p-5 border flex flex-col gap-3"
      style={{
        background: 'rgba(0, 180, 166, 0.08)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderColor: 'rgba(0, 180, 166, 0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
      }}
    >
      <span
        className="text-xs uppercase tracking-widest"
        style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Roboto Condensed', sans-serif" }}
      >
        {label}
      </span>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            <Cell fill="#D4AF37" />
            <Cell fill="rgba(255,255,255,0.1)" />
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#134174',
              border: '1px solid #D4AF37',
              borderRadius: 6,
              fontFamily: "'Roboto Condensed', sans-serif",
              color: '#fff',
              fontSize: 13,
            }}
            formatter={(value: number) => [value, '']}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 13,
              color: 'rgba(255,255,255,0.7)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
