import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IccuLogo } from '../../components/ui/IccuLogo';
import { ErrorMessage } from '../../components/admin/ErrorMessage';
import { adminApi } from '../../services/api';

interface AdminProcess {
  id: string;
  name: string;
  description?: string;
  type?: string;
  isParametrized?: boolean;
  percentage?: number;
  subactivities?: Array<{ isLocked?: boolean }>;
  [key: string]: unknown;
}

function getParametrizationStatus(proc: AdminProcess): boolean {
  if (typeof proc.isParametrized === 'boolean') return proc.isParametrized;
  if (Array.isArray(proc.subactivities) && proc.subactivities.length > 0) {
    return proc.subactivities.some(s => s.isLocked);
  }
  return false;
}

function getPercentage(proc: AdminProcess): number {
  if (typeof proc.percentage === 'number') return proc.percentage;
  return 0;
}

// ── Skeleton card mientras carga ──────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-4"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="rounded flex-1 h-5 animate-pulse"
          style={{ background: 'rgba(255,255,255,0.07)', maxWidth: '70%' }}
        />
        <div
          className="rounded-full h-5 w-20 animate-pulse shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        />
      </div>
      {/* Barra skeleton */}
      <div>
        <div className="flex justify-between mb-2">
          <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-3 w-10 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div className="h-2 w-full rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
      </div>
      {/* Botón skeleton */}
      <div className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

// ── Tarjeta de resumen ────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

function SummaryCard({ label, value, accent = false }: SummaryCardProps) {
  return (
    <div
      className="rounded-xl p-4 border text-center"
      style={{
        background: accent ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.04)',
        borderColor: accent ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          fontFamily: "'Antonio', sans-serif",
          fontSize: '2rem',
          color: accent ? '#D4AF37' : '#fff',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'Roboto Condensed', sans-serif",
          fontSize: 12,
          color: 'rgba(255,255,255,0.45)',
          marginTop: 5,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Tarjeta de proceso ────────────────────────────────────────────────────────

interface ProcessCardProps {
  proc: AdminProcess;
  year: number;
  onManage: (id: string) => void;
  isAbsence?: boolean;
}

function ProcessCard({ proc, year, onManage, isAbsence = false }: ProcessCardProps) {
  const parametrized = getParametrizationStatus(proc);
  const pct = getPercentage(proc);

  const barColor =
    pct >= 75
      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
      : pct >= 40
        ? 'linear-gradient(90deg, #C8A951, #D4AF37)'
        : 'linear-gradient(90deg, #E00914, #ff6b75)';

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-4 transition-all duration-200"
      style={{
        background: isAbsence ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.04)',
        borderColor: isAbsence ? 'rgba(212,175,55,0.28)' : 'rgba(212,175,55,0.12)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.45)';
        (e.currentTarget as HTMLDivElement).style.background = isAbsence ? 'rgba(212,175,55,0.09)' : 'rgba(255,255,255,0.06)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = isAbsence ? 'rgba(212,175,55,0.28)' : 'rgba(212,175,55,0.12)';
        (e.currentTarget as HTMLDivElement).style.background = isAbsence ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.04)';
      }}
    >
      {/* Header: nombre + badge */}
      <div className="flex items-start justify-between gap-3">
        <h2
          style={{
            fontFamily: "'Antonio', sans-serif",
            fontSize: '1.05rem',
            color: '#ffffff',
            letterSpacing: '0.03em',
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {proc.name}
        </h2>
        {!isAbsence && (
          <span
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs"
            style={{
              background: parametrized ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.12)',
              border: `1px solid ${parametrized ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
              color: parametrized ? '#4ade80' : '#fbbf24',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 11,
              letterSpacing: '0.04em',
            }}
          >
            {parametrized ? (
              <>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Parametrizado
              </>
            ) : (
              <>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                  <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={2} />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
                Sin metas
              </>
            )}
          </span>
        )}
      </div>

      {/* Barra de progreso — solo para procesos normales */}
      {!isAbsence && (
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Avance {year}
            </span>
            <span
              style={{
                fontFamily: "'Antonio', sans-serif",
                fontSize: '1.35rem',
                color: '#D4AF37',
                lineHeight: 1,
              }}
            >
              {pct}%
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 6, background: 'rgba(255,255,255,0.08)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, pct))}%`,
                background: barColor,
              }}
            />
          </div>
        </div>
      )}

      {/* Botón */}
      <button
        onClick={() => onManage(proc.id)}
        className="w-full rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2"
        style={{
          height: 44,
          background: isAbsence ? 'rgba(212,175,55,0.14)' : 'rgba(0,135,207,0.14)',
          border: `1px solid ${isAbsence ? 'rgba(212,175,55,0.40)' : 'rgba(0,135,207,0.32)'}`,
          color: isAbsence ? '#D4AF37' : '#6dcff6',
          fontFamily: "'Roboto Condensed', sans-serif",
          fontSize: 14,
          letterSpacing: '0.04em',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = isAbsence ? '#D4AF37' : '#0087CF';
          e.currentTarget.style.color = isAbsence ? '#0e2d4f' : '#fff';
          e.currentTarget.style.borderColor = isAbsence ? '#D4AF37' : '#0087CF';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = isAbsence ? 'rgba(212,175,55,0.14)' : 'rgba(0,135,207,0.14)';
          e.currentTarget.style.color = isAbsence ? '#D4AF37' : '#6dcff6';
          e.currentTarget.style.borderColor = isAbsence ? 'rgba(212,175,55,0.40)' : 'rgba(0,135,207,0.32)';
        }}
      >
        {isAbsence ? 'Registrar ausentismo' : 'Gestionar proceso'}
        <svg width={14} height={14} viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();

  const [processes, setProcesses] = useState<AdminProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year] = useState(new Date().getFullYear());

  const loadProcesses = () => {
    setLoading(true);
    setError(null);
    adminApi
      .getProcesses(year)
      .then(data => {
        setProcesses(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setError('No se pudieron cargar los procesos. Verifica la conexión con el servidor.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProcesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const handleLogout = () => {
    logout();
    navigate('/admin', { replace: true });
  };

  // Separar ausentismo de los procesos estándar
  const absenceProcess = processes.find(p => p.type === 'AUSENTISMO') ?? null;
  const standardProcesses = processes.filter(p => p.type !== 'AUSENTISMO');

  // Métricas resumen — solo procesos estándar
  const totalParametrized = standardProcesses.filter(getParametrizationStatus).length;
  const avgPct = standardProcesses.length
    ? Math.round(standardProcesses.reduce((s, p) => s + getPercentage(p), 0) / standardProcesses.length)
    : 0;

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse at 15% 25%, rgba(0,135,207,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(0,180,166,0.12) 0%, transparent 55%), #134174',
        paddingBottom: 34,
      }}
    >
      {/* Header sticky */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(19,65,116,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: 'rgba(212,175,55,0.20)',
        }}
      >
        <div className="px-5 sm:px-8 h-[72px] flex items-center gap-4">
          <IccuLogo height={48} />

          <div className="flex-1 min-w-0">
            <h1
              className="leading-none"
              style={{
                fontFamily: "'Antonio', sans-serif",
                fontSize: 'clamp(1rem, 3vw, 1.4rem)',
                color: '#D4AF37',
                letterSpacing: '0.05em',
              }}
            >
              Panel de Administración
            </h1>
            <p
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                fontSize: 12,
                color: 'rgba(255,255,255,0.38)',
                marginTop: 2,
              }}
            >
              Talento Humano — {year}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg cursor-pointer transition-all"
            style={{
              height: 44,
              background: 'rgba(224,9,20,0.10)',
              border: '1px solid rgba(224,9,20,0.25)',
              color: '#ff9aa2',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 14,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(224,9,20,0.22)';
              e.currentTarget.style.borderColor = 'rgba(224,9,20,0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(224,9,20,0.10)';
              e.currentTarget.style.borderColor = 'rgba(224,9,20,0.25)';
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Estado de error */}
        {error && !loading && (
          <ErrorMessage
            message={error}
            onRetry={loadProcesses}
          />
        )}

        {/* Skeleton del resumen mientras carga */}
        {loading && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="rounded-xl p-4 border text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <div className="h-8 w-16 rounded animate-pulse mx-auto mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 w-24 rounded animate-pulse mx-auto" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </>
        )}

        {/* Contenido cargado */}
        {!loading && !error && (
          <>
            {/* Tarjetas resumen — excluyen ausentismo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <SummaryCard label="Total procesos" value={standardProcesses.length} />
              <SummaryCard label="Parametrizados" value={totalParametrized} />
              <SummaryCard
                label="Sin parametrizar"
                value={standardProcesses.length - totalParametrized}
              />
              <SummaryCard
                label="Avance promedio"
                value={standardProcesses.length ? `${avgPct}%` : '—'}
                accent
              />
            </div>

            {/* Ausentismo — destacado arriba, solo para admin */}
            {isAdmin && absenceProcess && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <h2
                    style={{
                      fontFamily: "'Antonio', sans-serif",
                      fontSize: '1.15rem',
                      color: 'rgba(255,255,255,0.7)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Control de Ausentismo
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ProcessCard
                    proc={absenceProcess}
                    year={year}
                    onManage={id => navigate(`/admin/provincia/${id}`)}
                    isAbsence
                  />
                </div>
              </div>
            )}

            {/* Título de sección */}
            <div className="flex items-center gap-3 mb-5">
              <h2
                style={{
                  fontFamily: "'Antonio', sans-serif",
                  fontSize: '1.15rem',
                  color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.04em',
                }}
              >
                Procesos de Talento Humano
              </h2>
              <span
                className="px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: 'rgba(212,175,55,0.12)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  color: '#D4AF37',
                  fontFamily: "'Roboto Condensed', sans-serif",
                }}
              >
                {standardProcesses.length}
              </span>
            </div>

            {/* Grid de procesos estándar */}
            {standardProcesses.length === 0 ? (
              <div
                className="rounded-2xl border py-20 text-center"
                style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}
              >
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeLinecap="round" />
                    <polyline points="13 2 13 9 20 9" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p
                  style={{
                    fontFamily: "'Roboto Condensed', sans-serif",
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: 15,
                  }}
                >
                  No hay procesos disponibles para {year}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {standardProcesses.map(proc => (
                  <ProcessCard
                    key={proc.id}
                    proc={proc}
                    year={year}
                    onManage={id => navigate(`/admin/provincia/${id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
