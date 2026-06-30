import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IccuLogo } from '../components/ui/IccuLogo';
import { CundinamarcaMap } from '../components/map/CundinamarcaMap';
import type { Process } from '../data/processes';
import { processesApi } from '../services/api';

export function MapaPage() {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    processesApi.getAll()
      .then((data) => {
        setProcesses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setProcesses([]);
      });
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: '#134174' }}
    >
      {/* Header */}
      <header className="relative flex items-center justify-between px-4 sm:px-8 py-2 sm:py-3 shrink-0 gap-2">
        {/* Izquierda: hamburguesa (mobile) | logo (desktop) */}
        <div className="shrink-0 self-start sm:self-auto">
          <div className="hidden sm:block">
            <IccuLogo height={100} />
          </div>
          <button
            className="sm:hidden flex items-center justify-center cursor-pointer"
            onClick={() => setMenuOpen(prev => !prev)}
            style={{
              width: 36,
              height: 36,
              marginTop: 6,
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.75)',
              flexShrink: 0,
            }}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú de procesos'}
          >
            {menuOpen ? (
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              </svg>
            ) : (
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Centro: título */}
        <div className="flex flex-col items-center gap-0.5 flex-1 sm:flex-none">
          <h2
            className="shimmer-text"
            style={{
              fontFamily: "'Antonio', sans-serif",
              fontSize: 'clamp(1.8rem, 5vw, 4.5rem)',
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
              fontSize: 'clamp(0.85rem, 2vw, 1.5rem)',
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            En Talento Humano
          </p>
        </div>

        {/* Derecha: texto en desktop, espaciador en mobile */}
        <div className="shrink-0">
          <span
            className="shimmer-text hidden sm:block"
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
          <div className="sm:hidden" style={{ width: 36 }} aria-hidden="true" />
        </div>
      </header>

      {/* Backdrop mobile — igual que en ProvinciaPage */}
      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-20"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar — igual que en ProvinciaPage, solo mobile */}
      <aside
        className={[
          'sm:hidden fixed z-30',
          'top-[60px] bottom-0 left-0',
          'w-[220px] transition-transform duration-300 ease-in-out border-r',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{
          borderColor: 'rgba(0,135,207,0.18)',
          background: 'rgba(13,52,96,0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <nav className="overflow-y-auto py-2 h-full">
          {processes.map(p => (
            <div key={p.id} style={{ padding: '2px 8px' }}>
              <button
                onClick={() => { navigate(`/provincia/${p.id}`); setMenuOpen(false); }}
                className="w-full text-left cursor-pointer transition-all duration-200"
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: 9999,
                  color: 'rgba(255,255,255,0.60)',
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={p.name}
              >
                {p.name}
              </button>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mapa */}
      <main className="flex-1 flex items-stretch justify-center px-4 pb-2 min-h-0">
        <div className="w-full max-w-6xl">
          <CundinamarcaMap processes={processes} />
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-4 sm:px-8 shrink-0" style={{ paddingBottom: 46 }}>
        <button
          onClick={() => navigate('/admin')}
          title="Acceso administrador"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.20)',
            padding: 6,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'Roboto Condensed', sans-serif",
            fontSize: 12,
            letterSpacing: '0.05em',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212,175,55,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.20)')}
        >
          <svg width={14} height={14} viewBox="0 0 16 16" fill="none">
            <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Admin
        </button>

        <img
          src="/logos/logo_completo.png"
          alt="ICCU"
          style={{ height: 56, width: 'auto', objectFit: 'contain', opacity: 0.75 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </footer>
    </div>
  );
}
