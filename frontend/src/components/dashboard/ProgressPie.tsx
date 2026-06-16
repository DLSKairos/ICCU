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
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderColor: 'rgba(0, 135, 207, 0.28)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)',
      }}
    >
      <span
        className="uppercase tracking-widest"
        style={{ color: '#134174', fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 700, fontSize: 13 }}
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
            <Cell fill="#C8D8E8" />
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
            formatter={(value) => [value as number, '']}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 13,
              color: 'rgba(19,65,116,0.75)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
