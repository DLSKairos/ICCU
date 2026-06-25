import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { PeriodSelector } from '../dashboard/PeriodSelector';
import type { Period } from '../../utils/metrics';
import { absenceApi } from '../../services/api';
import type { AbsenceStats, PersonAbsenceStats, EmployeeSearchResult } from '../../services/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ── Subcomponentes internos ──────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Antonio', sans-serif",
        color: '#D4AF37',
        fontSize: '1.3rem',
        letterSpacing: '0.04em',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <span
        style={{
          background: '#D4AF37',
          width: 4,
          height: 20,
          display: 'inline-block',
          borderRadius: 9999,
          flexShrink: 0,
        }}
      />
      {children}
    </h2>
  );
}

function Spinner({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${Math.max(3, size / 10)}px solid rgba(212,175,55,0.2)`,
        borderTopColor: '#D4AF37',
        animation: 'spin 1s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}

// ── Modal de persona ─────────────────────────────────────────────────────────

interface PersonaModalProps {
  data: PersonAbsenceStats;
  loading: boolean;
  onClose: () => void;
}

function PersonaModal({ data, loading, onClose }: PersonaModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ausentismo — ${data.employeeName}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(10,30,60,0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(19,65,116,0.98)',
          border: '1px solid rgba(212,175,55,0.35)',
          borderRadius: 16,
          padding: '32px 28px',
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 18,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ×
        </button>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Spinner size={48} />
          </div>
        ) : (
          <>
            {/* Cabecera */}
            <div style={{ marginBottom: 24, paddingRight: 40 }}>
              <p
                style={{
                  fontFamily: "'Antonio', sans-serif",
                  fontSize: '1.8rem',
                  color: '#D4AF37',
                  lineHeight: 1.1,
                  marginBottom: 4,
                }}
              >
                {data.employeeName}
              </p>
              <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                CC {data.identification} &nbsp;·&nbsp; {data.department}
              </p>
            </div>

            {/* Tarjetas resumen del año */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 10, padding: '16px 20px' }}>
                <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.55)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Incapacidades año actual
                </p>
                <p style={{ fontFamily: "'Antonio', sans-serif", color: '#D4AF37', fontSize: '2.2rem', lineHeight: 1 }}>
                  {data.currentYearCases}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,135,207,0.25)', borderRadius: 10, padding: '16px 20px' }}>
                <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.55)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Días de ausentismo
                </p>
                <p style={{ fontFamily: "'Antonio', sans-serif", color: '#0087CF', fontSize: '2.2rem', lineHeight: 1 }}>
                  {data.currentYearDays}
                </p>
              </div>
            </div>

            {/* Días de inicio */}
            {data.byStartWeekday.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Día de inicio de incapacidades
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[...data.byStartWeekday]
                    .sort((a, b) => a.dayIndex - b.dayIndex)
                    .map(d => (
                      <div
                        key={d.dayIndex}
                        style={{
                          background: 'rgba(0,135,207,0.12)',
                          border: '1px solid rgba(0,135,207,0.3)',
                          borderRadius: 8,
                          padding: '6px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>{d.weekday}</span>
                        <span style={{ fontFamily: "'Antonio', sans-serif", color: '#0087CF', fontSize: '1.4rem' }}>{d.cases}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Diagnósticos */}
            {data.byDiagnostic.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Diagnósticos
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.byDiagnostic.map((dx, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '8px 14px',
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {dx.diagnosticCode && (
                          <span style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#D4AF37', fontSize: 12, marginRight: 8 }}>
                            {dx.diagnosticCode}
                          </span>
                        )}
                        <span style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                          {dx.diagnosticConcept ?? 'Sin diagnóstico'}
                        </span>
                      </div>
                      <span style={{ fontFamily: "'Antonio', sans-serif", color: '#D4AF37', fontSize: '1.1rem', flexShrink: 0 }}>
                        {dx.cases} caso{dx.cases !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Listado de ausencias individuales */}
            {data.absences.length > 0 && (
              <div>
                <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Historial de ausencias
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.absences.map(ab => (
                    <div
                      key={ab.id}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '10px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                            {formatDate(ab.startDate)} → {formatDate(ab.endDate)}
                          </span>
                          <span style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 10 }}>
                            ({ab.days} día{ab.days !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <span style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#0087CF', fontSize: 12, background: 'rgba(0,135,207,0.12)', border: '1px solid rgba(0,135,207,0.25)', borderRadius: 6, padding: '2px 8px', flexShrink: 0 }}>
                          {ab.incapacityType}
                        </span>
                      </div>
                      {(ab.diagnosticCode || ab.diagnosticConcept) && (
                        <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }}>
                          {ab.diagnosticCode ? `${ab.diagnosticCode} — ` : ''}{ab.diagnosticConcept ?? ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

interface AusentismoDashboardProps {
  processId: string;
  processName: string;
  processDescription: string;
}

export function AusentismoDashboard({ processId, processName: _processName, processDescription: _processDescription }: AusentismoDashboardProps) {
  // Estado principal
  const [period, setPeriod] = useState<Period>('mensual');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AbsenceStats | null>(null);

  // Estado del buscador
  const [empQuery, setEmpQuery] = useState('');
  const [empResults, setEmpResults] = useState<EmployeeSearchResult[]>([]);
  const [empSearching, setEmpSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estado del modal
  const [personData, setPersonData] = useState<PersonAbsenceStats | null>(null);
  const [personLoading, setPersonLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Cargar estadísticas cuando cambia el período
  useEffect(() => {
    setLoading(true);
    setError(null);
    absenceApi
      .getStats(processId, period)
      .then(data => setStats(data))
      .catch(() => setError('No se pudieron cargar las estadísticas. Verifica tu conexión.'))
      .finally(() => setLoading(false));
  }, [processId, period]);

  // Debounce en el buscador de empleados
  const handleEmpInput = useCallback((value: string) => {
    setEmpQuery(value);
    setDropdownOpen(false);
    setEmpResults([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setEmpSearching(false);
      return;
    }

    setEmpSearching(true);
    debounceRef.current = setTimeout(() => {
      absenceApi
        .searchEmployees(value.trim())
        .then(results => {
          setEmpResults(results);
          setDropdownOpen(results.length > 0);
        })
        .catch(() => setEmpResults([]))
        .finally(() => setEmpSearching(false));
    }, 300);
  }, []);

  // Seleccionar empleado del dropdown
  const handleSelectEmployee = useCallback((emp: EmployeeSearchResult) => {
    setEmpQuery(emp.employeeName);
    setDropdownOpen(false);
    setEmpResults([]);
    setPersonLoading(true);
    setPersonData(null);
    setModalOpen(true);

    absenceApi
      .getPerson(emp.identification, processId)
      .then(data => setPersonData(data))
      .catch(() => {
        setModalOpen(false);
        setPersonLoading(false);
      })
      .finally(() => setPersonLoading(false));
  }, [processId]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setPersonData(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Animación de spin inline */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Selector de período */}
      <div style={{ marginBottom: 28 }}>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Estado de carga */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '64px 0' }}>
          <Spinner size={36} />
          <span style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>
            Cargando estadísticas...
          </span>
        </div>
      )}

      {/* Estado de error */}
      {!loading && error && (
        <div
          style={{
            background: 'rgba(255,60,60,0.08)',
            border: '1px solid rgba(255,60,60,0.25)',
            borderRadius: 12,
            padding: '24px 28px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,120,120,0.9)', fontSize: 15 }}>
            {error}
          </p>
        </div>
      )}

      {/* Contenido principal */}
      {!loading && !error && stats && (
        <>
          {/* ── Tarjetas de resumen ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 36 }}>
            <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(212,175,55,0.65)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 0 20px rgba(212,175,55,0.12), 0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)' }}>
              <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#0087CF', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Total casos
              </p>
              <p style={{ fontFamily: "'Antonio', sans-serif", color: '#D4AF37', fontSize: '2.8rem', lineHeight: 1 }}>
                {stats.summary.totalCases}
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(0,135,207,0.28)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)' }}>
              <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#0087CF', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Total días
              </p>
              <p style={{ fontFamily: "'Antonio', sans-serif", color: '#134174', fontSize: '2.8rem', lineHeight: 1 }}>
                {stats.summary.totalDays}
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: '1px solid rgba(0,135,207,0.28)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)' }}>
              <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#0087CF', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Rango de fechas
              </p>
              <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(19,65,116,0.9)', fontSize: 15, lineHeight: 1.5 }}>
                {formatDate(stats.dateRange.from)} — {formatDate(stats.dateRange.to)}
              </p>
            </div>
          </div>

          {/* ── Buscador de persona ── */}
          <div style={{ marginBottom: 36 }}>
            <SectionTitle>Consulta por colaborador</SectionTitle>
            <div style={{ position: 'relative', maxWidth: 480 }}>
              <div style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={empQuery}
                  onChange={e => handleEmpInput(e.target.value)}
                  onFocus={() => empResults.length > 0 && setDropdownOpen(true)}
                  placeholder="Buscar por nombre o cédula..."
                  aria-label="Buscar colaborador"
                  aria-autocomplete="list"
                  aria-expanded={dropdownOpen}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.97)',
                    border: '1px solid rgba(0,135,207,0.28)',
                    borderRadius: 10,
                    padding: '12px 44px 12px 16px',
                    color: '#134174',
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  }}
                />
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  {empSearching ? (
                    <Spinner size={18} />
                  ) : (
                    <svg width={18} height={18} viewBox="0 0 20 20" fill="none">
                      <circle cx="9" cy="9" r="6" stroke="rgba(0,135,207,0.5)" strokeWidth="1.5" />
                      <path d="M13.5 13.5L17 17" stroke="rgba(0,135,207,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
              </div>

              {dropdownOpen && empResults.length > 0 && (
                <div
                  ref={dropdownRef}
                  role="listbox"
                  aria-label="Resultados de búsqueda"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(255,255,255,0.98)',
                    border: '1px solid rgba(0,135,207,0.28)',
                    borderRadius: 10,
                    zIndex: 50,
                    maxHeight: 240,
                    overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                >
                  {empResults.map(emp => (
                    <button
                      key={emp.identification}
                      role="option"
                      aria-selected={false}
                      onClick={() => handleSelectEmployee(emp)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '11px 16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(19,65,116,0.08)',
                        color: '#134174',
                        fontFamily: "'Roboto Condensed', sans-serif",
                        fontSize: 14,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.08)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                    >
                      <span style={{ color: '#134174', fontWeight: 600 }}>{emp.employeeName}</span>
                      <span style={{ color: '#0087CF', marginLeft: 8, fontSize: 12 }}>CC {emp.identification}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Gráfica: Ausentismo por dependencia ── */}
          {stats.byDepartment.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <SectionTitle>Ausentismo por dependencia</SectionTitle>
              <div
                style={{
                  background: 'rgba(255,255,255,0.97)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  border: '1px solid rgba(0,135,207,0.28)',
                  borderRadius: 12,
                  padding: '20px 16px 12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)',
                }}
              >
                <ResponsiveContainer width="100%" height={Math.max(220, stats.byDepartment.length * 42)}>
                  <BarChart
                    data={[...stats.byDepartment].sort((a, b) => b.cases - a.cases)}
                    layout="vertical"
                    margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(19,65,116,0.08)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: 'rgba(19,65,116,0.55)', fontSize: 11, fontFamily: "'Roboto Condensed', sans-serif" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="department"
                      width={180}
                      tick={{ fill: 'rgba(19,65,116,0.7)', fontSize: 11, fontFamily: "'Roboto Condensed', sans-serif" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 26) + '…' : v}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#134174',
                        border: '1px solid #D4AF37',
                        borderRadius: 8,
                        fontFamily: "'Roboto Condensed', sans-serif",
                        color: '#fff',
                        fontSize: 13,
                      }}
                      cursor={{ fill: 'rgba(19,65,116,0.06)' }}
                      formatter={(value: number, name: string) => [
                        value,
                        name === 'cases' ? 'Casos' : 'Días',
                      ]}
                    />
                    <Bar dataKey="cases" fill="#D4AF37" radius={[0, 4, 4, 0]} name="cases" maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Gráfica: Días de inicio de incapacidades ── */}
          {stats.byStartWeekday.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <SectionTitle>Días en que inician las incapacidades</SectionTitle>
              <div
                style={{
                  background: 'rgba(255,255,255,0.97)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  border: '1px solid rgba(0,135,207,0.28)',
                  borderRadius: 12,
                  padding: '20px 16px 12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)',
                }}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={[...stats.byStartWeekday].sort((a, b) => a.dayIndex - b.dayIndex)}
                    margin={{ top: 4, right: 16, left: -16, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(19,65,116,0.08)" vertical={false} />
                    <XAxis
                      dataKey="weekday"
                      tick={{ fill: 'rgba(19,65,116,0.65)', fontSize: 12, fontFamily: "'Roboto Condensed', sans-serif" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(19,65,116,0.55)', fontSize: 11, fontFamily: "'Roboto Condensed', sans-serif" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#134174',
                        border: '1px solid #0087CF',
                        borderRadius: 8,
                        fontFamily: "'Roboto Condensed', sans-serif",
                        color: '#fff',
                        fontSize: 13,
                      }}
                      cursor={{ fill: 'rgba(0,135,207,0.06)' }}
                      formatter={(value: number) => [value, 'Casos']}
                    />
                    <Bar dataKey="cases" fill="#0087CF" radius={[4, 4, 0, 0]} name="cases" maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Tabla: Diagnósticos más frecuentes ── */}
          {stats.topConcepts.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <SectionTitle>Diagnósticos más frecuentes</SectionTitle>
              <div
                style={{
                  background: 'rgba(255,255,255,0.97)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  border: '1px solid rgba(0,135,207,0.28)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(19,65,116,0.06)' }}>
                      <th style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#0087CF', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 20px', textAlign: 'left', fontWeight: 600, width: 90 }}>
                        Código
                      </th>
                      <th style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#0087CF', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 20px', textAlign: 'left', fontWeight: 600 }}>
                        Diagnóstico
                      </th>
                      <th style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#0087CF', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 20px', textAlign: 'right', fontWeight: 600, width: 80 }}>
                        Casos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topConcepts.map((concept, i) => (
                      <tr
                        key={i}
                        style={{
                          borderTop: '1px solid rgba(19,65,116,0.08)',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(19,65,116,0.03)',
                        }}
                      >
                        <td style={{ padding: '11px 20px' }}>
                          <span style={{ fontFamily: "'Roboto Condensed', sans-serif", color: '#D4AF37', fontSize: 13, fontWeight: 700 }}>
                            {concept.diagnosticCode ?? '—'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 20px' }}>
                          <span style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(19,65,116,0.85)', fontSize: 14 }}>
                            {concept.diagnosticConcept ?? 'Sin diagnóstico registrado'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                          <span style={{ fontFamily: "'Antonio', sans-serif", color: '#134174', fontSize: '1.15rem' }}>
                            {concept.cases}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de persona */}
      {modalOpen && (personData || personLoading) && (
        <PersonaModal
          data={personData ?? {
            identification: '',
            employeeName: empQuery,
            department: '',
            currentYearCases: 0,
            currentYearDays: 0,
            byStartWeekday: [],
            byDiagnostic: [],
            absences: [],
          }}
          loading={personLoading}
          onClose={closeModal}
        />
      )}
    </>
  );
}
