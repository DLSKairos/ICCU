import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HistoricalBar } from '../components/dashboard/HistoricalBar';
import { MetricCard } from '../components/dashboard/MetricCard';
import { PeriodSelector } from '../components/dashboard/PeriodSelector';
import { PhotoGallery } from '../components/dashboard/PhotoGallery';
import { ProgressPie } from '../components/dashboard/ProgressPie';
import { SubactivitiesBar } from '../components/dashboard/SubactivitiesBar';
import { SubactivityCard } from '../components/dashboard/SubactivityCard';
import { Timeline } from '../components/dashboard/Timeline';
import { IccuLogo } from '../components/ui/IccuLogo';
import { getProcessById } from '../data/processes';
import { calcProcessMetrics } from '../utils/metrics';
import type { Period } from '../utils/metrics';

const TODAY = new Date('2025-06-08');

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

export function ProvinciaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('mensual');

  const process = id ? getProcessById(id) : undefined;

  if (!process) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#134174' }}>
        <div className="text-center">
          <p style={{ fontFamily: "'Antonio', sans-serif", fontSize: '2rem', color: '#D4AF37' }}>Proceso no encontrado</p>
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

  const metrics = calcProcessMetrics(process, period, TODAY);

  return (
    <div className="min-h-screen" style={{ background: '#134174' }}>
      {/* Header fijo */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: 'rgba(19,65,116,0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(212,175,55,0.2)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate('/mapa')}
            className="flex items-center gap-2 text-sm cursor-pointer transition-colors duration-150 hover:text-[#D4AF37]"
            style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}
          >
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver al mapa
          </button>
          <div className="flex-1" />
          <IccuLogo height={60} />
          <span
            className="shimmer-text hidden sm:block uppercase"
            style={{ fontFamily: "'Antonio', sans-serif", fontSize: 17, letterSpacing: '0.1em', fontWeight: 700 }}
          >
            Talento Humano
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
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

        {/* Selector de período */}
        <div className="mb-8">
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {/* Tarjetas de métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Avance del período"
            value={`${metrics.percentage}%`}
            subtitle={`${metrics.executed} de ${metrics.denominator} actividades`}
            highlight
          />
          <MetricCard
            label="Total anual ejecutado"
            value={`${metrics.annualExecuted}`}
            subtitle={`de ${metrics.annualTotal} planeadas`}
          />
          <MetricCard
            label="Participantes"
            value={`${metrics.attendeesInPeriod}`}
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
            executed={metrics.executed}
            denominator={metrics.denominator}
            label={`Avance ${period}`}
          />
          <SubactivitiesBar subactivities={metrics.subactivities} />
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
            {metrics.subactivities.map(sub => (
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
      </main>

      <footer
        className="border-t flex items-center justify-end px-8 py-4"
        style={{ borderColor: 'rgba(212,175,55,0.15)' }}
      >
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
