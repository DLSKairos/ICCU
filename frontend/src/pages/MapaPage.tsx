import { useEffect, useState } from 'react';
import { IccuLogo } from '../components/ui/IccuLogo';
import { CundinamarcaMap } from '../components/map/CundinamarcaMap';
import type { Process } from '../data/processes';
import { processesApi } from '../services/api';

export function MapaPage() {
  const [processes, setProcesses] = useState<Process[]>([]);

  useEffect(() => {
    processesApi.getAll()
      .then((data) => {
        setProcesses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // En caso de error, el mapa sigue funcionando sin nombres
        setProcesses([]);
      });
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: '#134174' }}
    >
      {/* Header — logo izq | título centro | "Talento Humano" der */}
      <header className="flex items-center justify-between px-8 py-3 shrink-0">
        <IccuLogo height={130} />

        <div className="flex flex-col items-center gap-0.5">
          <h2
            className="shimmer-text"
            style={{
              fontFamily: "'Antonio', sans-serif",
              fontSize: 'clamp(2.4rem, 5vw, 4.5rem)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}
          >
            NUESTRO DESARROLLO
          </h2>
          <p
            style={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 'clamp(1rem, 2vw, 1.5rem)',
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            En Talento Humano
          </p>
        </div>

        <span
          className="shimmer-text"
          style={{
            fontFamily: "'Antonio', sans-serif",
            fontSize: 'clamp(1rem, 1.8vw, 1.5rem)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Talento Humano
        </span>
      </header>

      {/* Mapa — ocupa todo el espacio disponible entre header y footer */}
      <main className="flex-1 flex items-stretch justify-center px-4 pb-2 min-h-0">
        <div className="w-full max-w-6xl">
          <CundinamarcaMap processes={processes} />
        </div>
      </main>

      {/* Footer — solo logo */}
      <footer className="flex items-center justify-end px-8 pb-4 shrink-0">
        <img
          src="/logos/logo_completo.png"
          alt="ICCU"
          style={{ height: 72, width: 'auto', objectFit: 'contain', opacity: 0.75 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </footer>
    </div>
  );
}
