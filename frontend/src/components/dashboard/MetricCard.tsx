interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}

export function MetricCard({ label, value, subtitle, highlight = false }: MetricCardProps) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl p-5 border"
      style={{
        background: 'rgba(255, 255, 255, 0.97)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderColor: highlight ? 'rgba(212,175,55,0.65)' : 'rgba(0, 135, 207, 0.28)',
        boxShadow: highlight
          ? '0 0 20px rgba(212,175,55,0.12), 0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)'
          : '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)',
      }}
    >
      <span
        className="text-xs uppercase tracking-widest"
        style={{ color: '#0087CF', fontFamily: "'Roboto Condensed', sans-serif" }}
      >
        {label}
      </span>
      <span
        className="leading-none"
        style={{
          fontFamily: "'Antonio', sans-serif",
          fontSize: '2.8rem',
          color: highlight ? '#D4AF37' : '#134174',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {subtitle && (
        <span
          className="text-sm"
          style={{ color: 'rgba(19, 65, 116, 0.90)', fontFamily: "'Roboto Condensed', sans-serif" }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}
