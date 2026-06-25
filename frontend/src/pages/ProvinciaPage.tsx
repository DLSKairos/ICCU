import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AusentismoDashboard } from '../components/dashboard/AusentismoDashboard';
import { HistoricalBar } from '../components/dashboard/HistoricalBar';
import { MetricCard } from '../components/dashboard/MetricCard';
import { PeriodSelector } from '../components/dashboard/PeriodSelector';
import { PhotoGallery } from '../components/dashboard/PhotoGallery';
import { ProgressPie } from '../components/dashboard/ProgressPie';
import { SubactivitiesBar } from '../components/dashboard/SubactivitiesBar';
import { SubactivityCard } from '../components/dashboard/SubactivityCard';
import { Timeline } from '../components/dashboard/Timeline';
import { IccuLogo } from '../components/ui/IccuLogo';
import type { Process } from '../data/processes';
import { processesApi } from '../services/api';
import { calcProcessMetrics } from '../utils/metrics';
import type { Period } from '../utils/metrics';

const TODAY = new Date();

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg font-semibold mb-4 flex items-center gap-3"
      style={{ fontFamily: "'Antonio', sans-serif", color: '#D4AF37', fontSize: '1.3rem', letterSpacing: '0.04em' }}
    >
      <span className="w-1 h-5 rounded-full inline-block" style={{ background: '#D4AF37' }} />
      {children}
    </h2>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: '#134174' }}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className="inline-block w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mb-4"
            style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }}
          />
          <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>
            Cargando proceso...
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProvinciaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('mensual');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [process, setProcess] = useState<Process | null>(null);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      processesApi.getOne(id),
      processesApi.getAll(),
    ])
      .then(([proc, all]) => {
        setProcess(proc);
        setAllProcesses(Array.isArray(all) ? all : []);
      })
      .catch(() => {
        setError('No se pudo cargar el proceso. Verifica tu conexión.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (error || !process) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#134174' }}>
        <div className="text-center">
          <p style={{ fontFamily: "'Antonio', sans-serif", fontSize: '2rem', color: '#D4AF37' }}>
            {error ?? 'Proceso no encontrado'}
          </p>
          <button
            onClick={() => navigate('/mapa')}
            className="mt-4 px-6 py-2 rounded-lg cursor-pointer"
            style={{ background: '#0087CF', color: '#fff', fontFamily: "'Roboto Condensed', sans-serif", border: 'none', fontSize: 15 }}
          >
            Volver al mapa
          </button>
        </div>
      </div>
    );
  }

  const isAusentismo = process.type === 'AUSENTISMO';
  const metrics = isAusentismo ? null : calcProcessMetrics(process, period, TODAY);

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 15% 25%, rgba(0,135,207,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(0,180,166,0.12) 0%, transparent 55%), #134174' }}>
      {/* Header fijo */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: 'rgba(19,65,116,0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(212,175,55,0.2)' }}
      >
        <div className="px-4 sm:px-8 py-0 h-[76px] flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/mapa')}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer font-semibold shrink-0"
            style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', fontSize: 16 }}
          >
            <svg width={20} height={20} viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden xs:inline sm:inline">Volver al mapa</span>
            <span className="sm:hidden">Volver</span>
          </button>

          {/* Toggle menú — solo mobile */}
          <button
            className="md:hidden flex items-center justify-center cursor-pointer"
            onClick={() => setSidebarOpen(prev => !prev)}
            style={{ width: 36, height: 36, background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', flexShrink: 0 }}
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú de procesos'}
          >
            {sidebarOpen ? (
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              </svg>
            ) : (
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              </svg>
            )}
          </button>

          <div className="flex-1" />
          <IccuLogo height={76} />
          <span
            className="shimmer-text hidden sm:block uppercase"
            style={{ fontFamily: "'Antonio', sans-serif", fontSize: 28, letterSpacing: '0.1em', fontWeight: 700 }}
          >
            Talento Humano
          </span>
        </div>
      </header>

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-20"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Aside — mobile: overlay fijo | desktop: inline colapsable */}
        <aside
          className={[
            'shrink-0 border-r ease-in-out',
            'fixed md:relative z-30 md:z-auto',
            'top-[76px] md:top-auto bottom-0 md:bottom-auto left-0',
            'w-[220px] transition-[width,transform] duration-300',
            sidebarOpen
              ? 'translate-x-0 md:w-[220px]'
              : '-translate-x-full md:translate-x-0 md:w-9',
          ].join(' ')}
          style={{
            minHeight: 'calc(100vh - 77px)',
            borderColor: 'rgba(0,135,207,0.18)',
            background: 'rgba(13,52,96,0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {/* Nav sticky: se queda visible mientras se hace scroll */}
          <div
            className="sticky overflow-hidden"
            style={{ top: 77, height: 'calc(100vh - 77px)' }}
          >
            {/* Botón toggle */}
            <div className="flex items-center justify-end" style={{ height: 40 }}>
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 36,
                  height: 40,
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  flexShrink: 0,
                }}
                aria-label={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
              >
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                    transition: 'transform 300ms ease-in-out',
                  }}
                >
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Lista de procesos */}
            <nav className="overflow-y-auto py-2" style={{ height: 'calc(100% - 40px)' }}>
              {allProcesses.map(p => {
                const isActive = p.id === id;
                return (
                  <div key={p.id} style={{ padding: '2px 8px' }}>
                    <button
                      onClick={() => navigate(`/provincia/${p.id}`)}
                      className="w-full text-left cursor-pointer transition-all duration-200"
                      style={{
                        display: 'block',
                        padding: '10px 14px',
                        background: isActive ? 'rgba(255,255,255,0.22)' : 'transparent',
                        backdropFilter: isActive ? 'blur(12px) saturate(160%)' : 'none',
                        WebkitBackdropFilter: isActive ? 'blur(12px) saturate(160%)' : 'none',
                        border: isActive
                          ? '1px solid rgba(255,255,255,0.40)'
                          : '1px solid transparent',
                        borderRadius: 9999,
                        boxShadow: isActive
                          ? '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)'
                          : 'none',
                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.60)',
                        fontFamily: "'Roboto Condensed', sans-serif",
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={p.name}
                    >
                      {p.name}
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
            {/* Nombre del proceso */}
            <div className="mb-8">
              <h1
                style={{
                  fontFamily: "'Antonio', sans-serif",
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  color: '#D4AF37',
                  lineHeight: 1,
                  marginBottom: '0.5rem',
                  letterSpacing: '0.03em',
                }}
              >
                {process.name}
              </h1>
              <p
                className="max-w-2xl"
                style={{
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.6,
                }}
              >
                {process.description}
              </p>
            </div>

            {isAusentismo ? (
              /* ── Vista de ausentismo ── */
              <AusentismoDashboard
                processId={process.id}
                processName={process.name}
                processDescription={process.description}
              />
            ) : (
              /* ── Vista estándar de métricas ── */
              <>
                {/* Selector de período */}
                <div className="mb-8">
                  <PeriodSelector value={period} onChange={setPeriod} />
                </div>

                {/* Tarjetas de métricas */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <MetricCard
                    label="Avance del período"
                    value={`${metrics!.percentage}%`}
                    subtitle={`${metrics!.executed} de ${metrics!.denominator} actividades`}
                    highlight
                  />
                  <MetricCard
                    label="Total anual ejecutado"
                    value={`${metrics!.annualExecuted}`}
                    subtitle={`de ${metrics!.annualTotal} planeadas`}
                  />
                  <MetricCard
                    label="Participantes"
                    value={`${metrics!.attendeesInPeriod}`}
                    subtitle="en el período seleccionado"
                  />
                  <MetricCard
                    label="Subactividades"
                    value={`${process.subactivities.length}`}
                    subtitle="procesos activos"
                  />
                </div>

                {/* Gráficas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                  <ProgressPie
                    executed={metrics!.executed}
                    denominator={metrics!.denominator}
                    label={`Avance ${period}`}
                  />
                  <SubactivitiesBar subactivities={metrics!.subactivities} />
                </div>

                {/* Histórico */}
                <div className="mb-10">
                  <SectionTitle>Histórico de cumplimiento</SectionTitle>
                  <HistoricalBar
                    data={process.historicalPercentages}
                    currentYearPercentage={
                      calcProcessMetrics(process, 'anual', TODAY).percentage
                    }
                  />
                </div>

                {/* Subactividades */}
                <div className="mb-10">
                  <SectionTitle>Subactividades</SectionTitle>
                  <div className="flex flex-col gap-3">
                    {metrics!.subactivities.map(sub => (
                      <SubactivityCard
                        key={sub.subactivityId}
                        metrics={sub}
                        process={process}
                      />
                    ))}
                  </div>
                </div>

                {/* Línea de tiempo */}
                <div className="mb-10">
                  <SectionTitle>Línea de tiempo</SectionTitle>
                  <Timeline process={process} />
                </div>

                {/* Galería */}
                <div className="mb-10">
                  <SectionTitle>Galería fotográfica</SectionTitle>
                  <PhotoGallery process={process} />
                </div>
              </>
            )}
          </main>

          <footer
            className="border-t flex items-center justify-end px-4 sm:px-8"
            style={{ height: 72, borderColor: 'rgba(212,175,55,0.15)' }}
          >
            <img
              src="/logos/logo_completo.png"
              alt="ICCU"
              style={{ height: 72, width: 'auto', objectFit: 'contain', opacity: 0.75 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </footer>
        </div>
      </div>
    </div>
  );
}
