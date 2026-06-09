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
        background: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.1)',
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
