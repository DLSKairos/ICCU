interface IccuLogoProps {
  height?: number;
  className?: string;
}

export function IccuLogo({ height = 40, className = '' }: IccuLogoProps) {
  const src = '/logos/logo_simple.png';

  return (
    <img
      src={src}
      alt="ICCU — Instituto de Caminos y Construcciones de Cundinamarca"
      height={height}
      style={{ height, width: 'auto', objectFit: 'contain' }}
      className={className}
      onError={e => {
        const img = e.currentTarget;
        img.style.display = 'none';
        const span = document.createElement('span');
        span.textContent = 'ICCU';
        span.style.cssText = `font-family:'Antonio',sans-serif;font-size:${height * 0.7}px;color:#D4AF37;letter-spacing:2px;font-weight:700;`;
        img.parentElement?.appendChild(span);
      }}
    />
  );
}
