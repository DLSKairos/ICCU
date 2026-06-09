import type { ProvinceState } from '../../hooks/useTwinkle';

interface ProvinceProps {
  id: string;
  d: string;
  state: ProvinceState;
  fadeDelay: number;
  appeared: boolean;
  color: string;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function Province({
  id, d, state, fadeDelay, appeared, color, onClick, onMouseEnter, onMouseLeave,
}: ProvinceProps) {
  const fillOpacity = state === 'hovered' ? 0.82 : 0.22;

  return (
    <path
      id={`province-${id}`}
      d={d}
      fill={color}
      stroke="rgba(255,255,255,0.40)"
      strokeWidth={2.5}
      strokeLinejoin="round"
      style={{
        fillOpacity,
        opacity: appeared ? 1 : 0,
        animation: !appeared
          ? `fadeInProvince 400ms ease-out ${fadeDelay}ms forwards`
          : state === 'pulsing'
            ? `twinklePulse ${600 + Math.random() * 600}ms ease-in-out infinite`
            : undefined,
        cursor: 'pointer',
        transition: state !== 'pulsing' ? 'fill-opacity 150ms ease-out' : undefined,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}
