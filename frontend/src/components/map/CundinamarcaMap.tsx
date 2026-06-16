import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROVINCE_PATHS, SVG_VIEWBOX, SVG_TRANSFORM } from '../../data/cundinamarca-svg';
import { PROVINCE_TO_PROCESS } from '../../data/processes';
import type { Process } from '../../data/processes';
import { useTwinkle } from '../../hooks/useTwinkle';
import { Province } from './Province';
import { ProvinceTooltip } from './ProvinceTooltip';

interface CundinamarcaMapProps {
  processes?: Process[];
}

const RENDER_PATHS = PROVINCE_PATHS
  .sort((a, b) => b.d.length - a.d.length);

const PROVINCE_IDS = RENDER_PATHS.map(p => p.id);
const STAGGER_END_MS = 800 + 400;

function getZoneColor(labelY: number): string {
  if (labelY < 600) return '#87C8E1';   // norte — azul celeste
  if (labelY < 950) return '#FADC0A';   // centro — amarillo tostado
  return '#DC1419';                      // sur — rojo punzó
}

export function CundinamarcaMap({ processes = [] }: CundinamarcaMapProps) {
  const navigate = useNavigate();
  const [appeared, setAppeared] = useState(false);
  const [twinkleEnabled, setTwinkleEnabled] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [clickingId, setClickingId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const fadeDelays = useRef(
    Object.fromEntries(PROVINCE_IDS.map(id => [id, Math.random() * 800]))
  );

  // Twinkle se pausa mientras hay hover activo
  const { getState, onHoverStart, onHoverEnd, resetPulsing } = useTwinkle(
    PROVINCE_IDS,
    twinkleEnabled && hoveredId === null,
  );

  useEffect(() => {
    const t1 = setTimeout(() => setAppeared(true), 50);
    const t2 = setTimeout(() => setTwinkleEnabled(true), STAGGER_END_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleProvinceClick = (provinceId: string) => {
    const processId = PROVINCE_TO_PROCESS[provinceId];
    if (!processId) return;
    setClickingId(provinceId);
    setTimeout(() => navigate(`/provincia/${processId}`), 200);
  };

  const hoveredProvince = hoveredId
    ? PROVINCE_PATHS.find(p => p.id === hoveredId)
    : null;

  const hoveredProcessName = hoveredId
    ? (processes.find(p => p.id === PROVINCE_TO_PROCESS[hoveredId])?.name ?? '')
    : '';

  return (
    <svg
      ref={svgRef}
      viewBox={SVG_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      style={{ filter: 'drop-shadow(0 0 24px rgba(212,175,55,0.08))' }}
      onMouseLeave={() => {
        if (hoveredId) {
          onHoverEnd(hoveredId);
          setHoveredId(null);
        }
      }}
    >
      <g transform={SVG_TRANSFORM}>
        {RENDER_PATHS.map(province => (
          <Province
            key={province.id}
            id={province.id}
            d={province.d}
            state={clickingId === province.id ? 'hovered' : getState(province.id)}
            fadeDelay={fadeDelays.current[province.id]}
            appeared={appeared}
            color={getZoneColor(province.labelY)}
            onClick={() => handleProvinceClick(province.id)}
            onMouseEnter={() => {
              resetPulsing();
              onHoverStart(province.id);
              setHoveredId(province.id);
            }}
            onMouseLeave={() => {
              onHoverEnd(province.id);
              setHoveredId(null);
            }}
          />
        ))}
      </g>

      {hoveredProvince && (
        <ProvinceTooltip
          name={hoveredProcessName}
          x={hoveredProvince.labelX}
          y={hoveredProvince.labelY}
          visible={true}
          svgWidth={1346}
          svgHeight={1521}
        />
      )}
    </svg>
  );
}
