interface ProvinceTooltipProps {
  name: string;
  x: number;
  y: number;
  visible: boolean;
  svgWidth: number;
  svgHeight: number;
}

// SVG viewBox is 0 0 1346 1521. At ~600px rendered width, 1 unit ≈ 0.45px.
// Font and dimensions are expressed in SVG units accordingly.
const TOOLTIP_W = 560;
const TOOLTIP_H = 72;
const FONT_SIZE = 44;

export function ProvinceTooltip({ name, x, y, visible, svgWidth, svgHeight }: ProvinceTooltipProps) {
  if (!visible) return null;

  const halfW = TOOLTIP_W / 2;
  const halfH = TOOLTIP_H / 2;
  const gap = 20;

  // Clamp horizontally so the tooltip stays inside the viewBox
  const cx = Math.max(halfW + 4, Math.min(x, svgWidth - halfW - 4));
  // Place above the label; if too close to top, place below
  const cy = y < halfH + gap + 8 ? y + halfH + gap : y - halfH - gap;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={cx - halfW}
        y={cy - halfH}
        width={TOOLTIP_W}
        height={TOOLTIP_H}
        rx={6}
        fill="rgba(19,65,116,0.92)"
        stroke="#D4AF37"
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        style={{
          fontFamily: "'Antonio', sans-serif",
          fontSize: FONT_SIZE,
          fontWeight: 500,
          letterSpacing: '0.5px',
        }}
      >
        {name}
      </text>
    </g>
  );
}
