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
        background: 'rgba(255,255,255,0.04)',
        borderColor: highlight ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.1)',
        boxShadow: highlight ? '0 0 20px rgba(212,175,55,0.12)' : 'none',
      }}
    >
      <span
        className="text-xs uppercase tracking-widest"
        style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Roboto Condensed', sans-serif" }}
      >
        {label}
      </span>
      <span
        className="leading-none"
        style={{
          fontFamily: "'Antonio', sans-serif",
          fontSize: '2.8rem',
          color: highlight ? '#D4AF37' : '#ffffff',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {subtitle && (
        <span
          className="text-sm"
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'Roboto Condensed', sans-serif" }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}
