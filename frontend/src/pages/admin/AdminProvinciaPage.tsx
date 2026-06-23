import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IccuLogo } from '../../components/ui/IccuLogo';
import { LoadingSpinner } from '../../components/admin/LoadingSpinner';
import { ErrorMessage } from '../../components/admin/ErrorMessage';
import { adminApi } from '../../services/api';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AdminSubactivity {
  id: string;
  name: string;
  target?: number;
  isLocked?: boolean;
  [key: string]: unknown;
}

interface AdminActivity {
  id: string;
  title: string;
  date: string;
  attendees?: number;
  subactivityId?: string;
  photos?: string[];
  [key: string]: unknown;
}

interface AdminProcess {
  id: string;
  name: string;
  description?: string;
  progress?: number;
  subactivities: AdminSubactivity[];
  activities: AdminActivity[];
  [key: string]: unknown;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPercentage(proc: AdminProcess): number {
  const p = typeof proc.progress === 'number' ? proc.progress : 0;
  return Number.isFinite(p) ? p : 0;
}

// ── Estilos compartidos ───────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: "'Roboto Condensed', sans-serif",
  fontSize: 11,
  color: 'rgba(255,255,255,0.50)',
  display: 'block',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.13)',
  color: '#fff',
  fontFamily: "'Roboto Condensed', sans-serif",
  fontSize: 16, // evita zoom en iOS
  height: 48,
  borderRadius: 10,
  paddingLeft: 14,
  paddingRight: 14,
  width: '100%',
  outline: 'none',
  caretColor: '#D4AF37',
  transition: 'border-color 150ms, background 150ms',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: 'auto',
  paddingTop: 12,
  paddingBottom: 12,
  resize: 'vertical' as const,
  lineHeight: 1.5,
};

// ── Dependencias hardcodeadas ─────────────────────────────────────────────────

const DEPARTMENTS: { id: string; label: string; sub?: boolean }[] = [
  { id: 'dir-general',       label: 'DIRECCIÓN GENERAL' },
  { id: 'planeacion',        label: 'OFICINA ASESORA DE PLANEACIÓN' },
  { id: 'control-disc',      label: 'OFICINA DE CONTROL DISCIPLINARIO INTERNO' },
  { id: 'tecnologia',        label: 'OFICINA DE TECNOLOGÍAS Y SISTEMAS DE INFORMACIÓN' },
  { id: 'control-interno',   label: 'OFICINA DE CONTROL INTERNO' },
  { id: 'dir-caminos',       label: 'DIRECCIÓN DE CAMINOS' },
  { id: 'subdir-infra',      label: 'SUBDIRECCIÓN DE INFRAESTRUCTURA VIAL',    sub: true },
  { id: 'subdir-vecinales',  label: 'SUBDIRECCIÓN DE CAMINOS VECINALES',       sub: true },
  { id: 'dir-concesiones',   label: 'DIRECCIÓN DE CONCESIONES' },
  { id: 'dir-construcciones',label: 'DIRECCIÓN DE CONSTRUCCIONES' },
  { id: 'dir-juridica',      label: 'DIRECCIÓN JURÍDICA' },
  { id: 'subdir-contractual',label: 'SUBDIRECCIÓN DE GESTIÓN CONTRACTUAL',     sub: true },
  { id: 'dir-admin',         label: 'DIRECCIÓN ADMINISTRATIVA Y FINANCIERA' },
  { id: 'subdir-financiera', label: 'SUBDIRECCIÓN FINANCIERA',                 sub: true },
  { id: 'subdir-talento',    label: 'SUBDIRECCIÓN DE TALENTO HUMANO',          sub: true },
];

// ── Componente SectionCard ────────────────────────────────────────────────────

function SectionCard({ title, children, accent }: {
  title: string;
  children: React.ReactNode;
  accent?: 'default' | 'danger';
}) {
  const isDanger = accent === 'danger';
  return (
    <section
      className="rounded-2xl border p-5 sm:p-6 mb-6"
      style={{
        background: isDanger ? 'rgba(224,9,20,0.05)' : 'rgba(255,255,255,0.04)',
        borderColor: isDanger ? 'rgba(224,9,20,0.22)' : 'rgba(212,175,55,0.15)',
      }}
    >
      <h2
        className="flex items-center gap-3 mb-5"
        style={{
          fontFamily: "'Antonio', sans-serif",
          fontSize: '1.2rem',
          color: isDanger ? '#ff9aa2' : '#D4AF37',
          letterSpacing: '0.04em',
        }}
      >
        <span
          className="inline-block w-1 h-5 rounded-full shrink-0"
          style={{ background: isDanger ? '#E00914' : '#D4AF37' }}
        />
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── Banner de feedback (éxito / error) ────────────────────────────────────────

function FeedbackBanner({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3"
      role="alert"
      aria-live="polite"
      style={{
        background:
          type === 'success' ? 'rgba(74,222,128,0.10)' : 'rgba(224,9,20,0.10)',
        border: `1px solid ${type === 'success' ? 'rgba(74,222,128,0.28)' : 'rgba(224,9,20,0.28)'}`,
      }}
    >
      {type === 'success' ? (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
          <path d="M20 6L9 17l-5-5" stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
          <circle cx={12} cy={12} r={10} stroke="#ff6b75" strokeWidth={2} />
          <path d="M12 8v4M12 16h.01" stroke="#ff6b75" strokeWidth={2} strokeLinecap="round" />
        </svg>
      )}
      <p
        style={{
          fontFamily: "'Roboto Condensed', sans-serif",
          color: type === 'success' ? '#86efac' : '#ff9aa2',
          fontSize: 14,
          lineHeight: 1.4,
        }}
      >
        {message}
      </p>
    </div>
  );
}

// ── Modal de Reinicio Anual ───────────────────────────────────────────────────

interface ResetModalProps {
  onClose: () => void;
}

function ResetModal({ onClose }: ResetModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [preview, setPreview] = useState<unknown>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const canProceed = confirmText === 'CONFIRMAR';

  useEffect(() => {
    adminApi
      .resetPreview(currentYear - 1)
      .then(data => setPreview(data))
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [currentYear]);

  const handleReset = async () => {
    setExecuting(true);
    setError(null);
    try {
      const res = await adminApi.resetYear(currentYear - 1);
      setResult(
        typeof res === 'object' && res !== null && 'message' in res
          ? String((res as { message: string }).message)
          : 'Reinicio ejecutado correctamente.'
      );
    } catch {
      setError('Error al ejecutar el reinicio. Intenta de nuevo.');
    } finally {
      setExecuting(false);
    }
  };

  // Cierra al hacer clic en el overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !executing) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-lg rounded-2xl border flex flex-col gap-5 p-6"
        style={{
          background: 'rgba(10,26,46,0.98)',
          borderColor: 'rgba(224,9,20,0.40)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        {/* Encabezado del modal */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              style={{
                fontFamily: "'Antonio', sans-serif",
                fontSize: '1.4rem',
                color: '#ff9aa2',
                letterSpacing: '0.04em',
                lineHeight: 1,
              }}
            >
              Reinicio Anual {currentYear - 1}
            </h3>
            <p
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                fontSize: 13,
                color: 'rgba(255,255,255,0.4)',
                marginTop: 4,
              }}
            >
              Esta acción no se puede deshacer
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={executing}
            className="flex items-center justify-center rounded-lg cursor-pointer"
            style={{
              width: 36,
              height: 36,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)',
              flexShrink: 0,
            }}
            aria-label="Cerrar modal"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(224,9,20,0.07)',
            border: '1px solid rgba(224,9,20,0.18)',
          }}
        >
          <p
            style={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 11,
              color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: 8,
            }}
          >
            Vista previa — lo que se archivará
          </p>
          {previewLoading ? (
            <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              Calculando...
            </p>
          ) : preview ? (
            <pre
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                color: 'rgba(255,255,255,0.65)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 180,
                overflowY: 'auto',
                margin: 0,
              }}
            >
              {JSON.stringify(preview, null, 2)}
            </pre>
          ) : (
            <p style={{ fontFamily: "'Roboto Condensed', sans-serif", color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              No se pudo obtener el preview.
            </p>
          )}
        </div>

        {/* Advertencia */}
        <p
          style={{
            fontFamily: "'Roboto Condensed', sans-serif",
            fontSize: 14,
            color: '#ff9aa2',
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Esta acción cierra el año {currentYear - 1} y archiva todas las actividades
          registradas. Los contadores se reiniciarán para {currentYear}.
        </p>

        {/* Resultado exitoso */}
        {result && <FeedbackBanner type="success" message={result} />}
        {error && <FeedbackBanner type="error" message={error} />}

        {!result && (
          <>
            {/* Input de confirmación */}
            <div>
              <label
                htmlFor="confirm-reset"
                style={{
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Escribe{' '}
                <strong style={{ color: '#ff9aa2', fontFamily: 'monospace' }}>CONFIRMAR</strong>
                {' '}para habilitar el botón:
              </label>
              <input
                id="confirm-reset"
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
                autoComplete="off"
                className="w-full outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${canProceed ? 'rgba(224,9,20,0.55)' : 'rgba(255,255,255,0.14)'}`,
                  color: canProceed ? '#ff9aa2' : '#fff',
                  fontFamily: 'monospace',
                  fontSize: 16,
                  height: 48,
                  borderRadius: 10,
                  padding: '0 14px',
                  letterSpacing: '0.1em',
                  caretColor: '#ff6b75',
                }}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={executing}
                className="flex-1 rounded-xl cursor-pointer transition-all"
                style={{
                  height: 48,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: 'rgba(255,255,255,0.65)',
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontSize: 15,
                  opacity: executing ? 0.5 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={!canProceed || executing}
                className="flex-1 rounded-xl font-semibold transition-all"
                style={{
                  height: 48,
                  background: canProceed && !executing ? '#E00914' : 'rgba(224,9,20,0.15)',
                  border: '1px solid rgba(224,9,20,0.45)',
                  color: canProceed ? '#fff' : 'rgba(255,255,255,0.25)',
                  fontFamily: "'Antonio', sans-serif",
                  fontSize: '1rem',
                  letterSpacing: '0.06em',
                  cursor: canProceed && !executing ? 'pointer' : 'not-allowed',
                  boxShadow: canProceed && !executing ? '0 4px 16px rgba(224,9,20,0.35)' : 'none',
                }}
              >
                {executing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="inline-block rounded-full border-2 animate-spin"
                      style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                    />
                    Ejecutando...
                  </span>
                ) : (
                  'Proceder'
                )}
              </button>
            </div>
          </>
        )}

        {result && (
          <button
            onClick={onClose}
            className="w-full rounded-xl cursor-pointer transition-all"
            style={{
              height: 48,
              background: 'rgba(74,222,128,0.12)',
              border: '1px solid rgba(74,222,128,0.28)',
              color: '#86efac',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 15,
            }}
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminProvinciaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [proc, setProc] = useState<AdminProcess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const year = new Date().getFullYear();

  // Metas (parametrización)
  const [targetValues, setTargetValues] = useState<Record<string, string>>({});
  const [savingTargets, setSavingTargets] = useState(false);
  const [targetsSuccess, setTargetsSuccess] = useState(false);
  const [targetsError, setTargetsError] = useState<string | null>(null);

  // Registro de actividad
  const [actSubactivity, setActSubactivity] = useState('');
  const [actTitle, setActTitle] = useState('');
  const [actDescription, setActDescription] = useState('');
  const [actMessage, setActMessage] = useState('');
  const [actDate, setActDate] = useState('');
  const [attendeesByDep, setAttendeesByDep] = useState<Record<string, number>>({});
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [modalDepDraft, setModalDepDraft] = useState<Record<string, number>>({});
  const [actPhotos, setActPhotos] = useState<File[]>([]);
  const [actPhotosPreviews, setActPhotosPreviews] = useState<string[]>([]);
  const [creatingActivity, setCreatingActivity] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    subactivity?: boolean;
    title?: boolean;
    date?: boolean;
  }>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag over estado
  const [isDragOver, setIsDragOver] = useState(false);

  // Eliminación de actividades registradas
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal reinicio
  const [showResetModal, setShowResetModal] = useState(false);

  // Parametrización inline
  const [localHasSubs, setLocalHasSubs] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubQty, setNewSubQty] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [addNewError, setAddNewError] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  // ── Carga de datos ──────────────────────────────────────────────────────────

  const loadProcess = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    adminApi
      .getProcess(id, year)
      .then(data => {
        setProc(data as AdminProcess);
        if (data && Array.isArray((data as AdminProcess).subactivities)) {
          const initial: Record<string, string> = {};
          (data as AdminProcess).subactivities.forEach((s: AdminSubactivity) => {
            initial[s.id] = String(s.target ?? '');
          });
          setTargetValues(initial);
        }
      })
      .catch(() => setError('No se pudo cargar el proceso. Verifica la conexión.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Manejo de fotos ─────────────────────────────────────────────────────────

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    setActPhotos(prev => [...prev, ...imageFiles]);
    const previews = imageFiles.map(f => URL.createObjectURL(f));
    setActPhotosPreviews(prev => [...prev, ...previews]);
  };

  const handlePhotosChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removePhoto = (idx: number) => {
    setActPhotos(prev => prev.filter((_, i) => i !== idx));
    setActPhotosPreviews(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── Guardar metas ───────────────────────────────────────────────────────────

  const handleSaveTargets = async () => {
    if (!proc) return;
    setSavingTargets(true);
    setTargetsError(null);
    setTargetsSuccess(false);
    try {
      const unlockedSubs = proc.subactivities.filter(s => !s.isLocked);
      await Promise.all(
        unlockedSubs.map(s =>
          adminApi.setTarget(s.id, year, Number(targetValues[s.id] ?? 0))
        )
      );
      await Promise.all(unlockedSubs.map(s => adminApi.lockTargets(s.id, year)));
      setTargetsSuccess(true);
      loadProcess();
    } catch {
      setTargetsError('Error al guardar las metas. Intenta de nuevo.');
    } finally {
      setSavingTargets(false);
    }
  };

  // ── Registrar actividad ─────────────────────────────────────────────────────

  const handleCreateActivity = async (e: FormEvent) => {
    e.preventDefault();

    // Validación inline
    const errors: typeof formErrors = {};
    if (!actSubactivity) errors.subactivity = true;
    if (!actTitle.trim()) errors.title = true;
    if (!actDate) errors.date = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setCreateError('Completa los campos obligatorios marcados en rojo.');
      return;
    }

    setFormErrors({});
    setCreatingActivity(true);
    setCreateError(null);
    setCreateSuccess(false);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('subactivityId', actSubactivity);
    formData.append('title', actTitle);
    formData.append('description', actDescription);
    formData.append('message', actMessage);
    formData.append('date', actDate);
    const totalAtt = Object.values(attendeesByDep).reduce((s, v) => s + (v || 0), 0);
    formData.append('attendees', String(totalAtt));
    DEPARTMENTS.filter(d => (attendeesByDep[d.id] || 0) > 0)
      .forEach(d => formData.append('departments', d.label));
    actPhotos.forEach(photo => formData.append('photos', photo));

    // Simula progreso de upload si hay fotos
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    if (actPhotos.length > 0) {
      progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 8, 88));
      }, 200);
    }

    try {
      await adminApi.createActivity(formData);
      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);

      setCreateSuccess(true);
      // Limpiar formulario
      setActSubactivity('');
      setActTitle('');
      setActDescription('');
      setActMessage('');
      setActDate('');
      setAttendeesByDep({});
      setActPhotos([]);
      setActPhotosPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadProcess();
    } catch {
      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(0);
      setCreateError('Error al registrar la actividad. Verifica los datos e intenta de nuevo.');
    } finally {
      setCreatingActivity(false);
      setTimeout(() => setUploadProgress(0), 1500);
    }
  };

  // ── Eliminar actividad ──────────────────────────────────────────────────────

  const handleDeleteActivity = async (actId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta actividad? Esta acción no se puede deshacer.')) return;
    setDeletingId(actId);
    try {
      await adminApi.deleteActivity(actId);
      loadProcess();
    } catch {
      alert('No se pudo eliminar la actividad. Intenta de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddActivity = async () => {
    const name = newSubName.trim();
    const target = parseInt(newSubQty);
    if (!name) { setAddNewError('El nombre es obligatorio.'); return; }
    if (!target || target < 1) { setAddNewError('La cantidad debe ser mayor a 0.'); return; }
    if (!proc) return;
    setAddingNew(true);
    setAddNewError(null);
    try {
      await adminApi.createSubactivity(proc.id, name, year, target);
      setNewSubName('');
      setNewSubQty('');
      setShowAddModal(false);
      loadProcess();
    } catch {
      setAddNewError('Error al agregar. Intenta de nuevo.');
    } finally {
      setAddingNew(false);
    }
  };

  const handleDeleteSub = async (subId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta actividad del plan? Se eliminarán sus registros asociados.')) return;
    setDeletingSubId(subId);
    try {
      await adminApi.deleteSubactivity(subId);
      loadProcess();
    } catch {
      alert('No se pudo eliminar. Intenta de nuevo.');
    } finally {
      setDeletingSubId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin', { replace: true });
  };

  // ── Estados de carga / error ────────────────────────────────────────────────

  if (loading) {
    return <LoadingSpinner fullScreen message="Cargando proceso..." />;
  }

  if (error || !proc) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#134174' }}>
        <div className="text-center max-w-sm w-full">
          <ErrorMessage
            message={error ?? 'Proceso no encontrado.'}
            onRetry={loadProcess}
          />
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="mt-4 px-6 py-2.5 rounded-lg cursor-pointer transition-all"
            style={{
              background: 'rgba(0,135,207,0.18)',
              border: '1px solid rgba(0,135,207,0.35)',
              color: '#6dcff6',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 14,
            }}
          >
            Volver al panel
          </button>
        </div>
      </div>
    );
  }

  const hasUnlockedSubs = proc.subactivities.some(s => !s.isLocked);
  const allLocked = proc.subactivities.length > 0 && !hasUnlockedSubs;
  const allActivities = Array.isArray(proc.activities) ? proc.activities : [];
  const pct = getPercentage(proc);

  // Parametrización inline
  const hasSubs = localHasSubs || proc.subactivities.length > 1;
  const switchEditable = proc.subactivities.length <= 1 && !allLocked;
  const showAddForm = !allLocked && (proc.subactivities.length === 0 || hasSubs);

  const barColor =
    pct >= 75
      ? '#22c55e'
      : pct >= 40
        ? '#D4AF37'
        : '#E00914';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse at 10% 20%, rgba(0,135,207,0.10) 0%, transparent 50%), #134174',
      }}
    >
      {showResetModal && <ResetModal onClose={() => setShowResetModal(false)} />}

      {/* Modal asistentes por dependencia */}
      {showAttendeesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAttendeesModal(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border flex flex-col"
            style={{
              background: 'rgba(10,26,46,0.98)',
              borderColor: 'rgba(0,135,207,0.40)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
              maxHeight: '90dvh',
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <h3 style={{ fontFamily: "'Antonio', sans-serif", fontSize: '1.4rem', color: '#D4AF37', letterSpacing: '0.04em', lineHeight: 1 }}>
                  Asistentes por dependencia
                </h3>
                <p style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.40)', marginTop: 4 }}>
                  Ingresa la cantidad de asistentes de cada área
                </p>
              </div>
              <button
                onClick={() => setShowAttendeesModal(false)}
                className="flex items-center justify-center cursor-pointer shrink-0"
                style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: 8 }}
                aria-label="Cerrar"
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Lista de dependencias */}
            <div className="overflow-y-auto flex flex-col gap-1.5 p-6 py-4" style={{ flex: 1 }}>
              {DEPARTMENTS.map(dep => (
                <div
                  key={dep.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{
                    background: (modalDepDraft[dep.id] || 0) > 0 ? 'rgba(0,135,207,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${(modalDepDraft[dep.id] || 0) > 0 ? 'rgba(0,135,207,0.28)' : 'rgba(255,255,255,0.06)'}`,
                    paddingLeft: dep.sub ? 28 : 12,
                  }}
                >
                  {dep.sub && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', flexShrink: 0, display: 'inline-block' }} />
                  )}
                  <span className="flex-1" style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: dep.sub ? 12 : 13, color: dep.sub ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.85)', lineHeight: 1.3 }}>
                    {dep.label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={modalDepDraft[dep.id] || ''}
                    placeholder="0"
                    onChange={e => {
                      const v = parseInt(e.target.value) || 0;
                      setModalDepDraft(prev => ({ ...prev, [dep.id]: v }));
                    }}
                    className="outline-none text-center"
                    style={{
                      width: 72, height: 36,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      color: '#D4AF37',
                      fontFamily: "'Antonio', sans-serif",
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Total + botones */}
            <div className="p-6 pt-4 flex flex-col gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.22)' }}>
                <span style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Total
                </span>
                <span style={{ fontFamily: "'Antonio', sans-serif", fontSize: '1.6rem', color: '#D4AF37', lineHeight: 1 }}>
                  {Object.values(modalDepDraft).reduce((s, v) => s + (v || 0), 0) || 0}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAttendeesModal(false)}
                  className="flex-1 rounded-xl cursor-pointer"
                  style={{ height: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.65)', fontFamily: "'Roboto Condensed', sans-serif", fontSize: 15 }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => { setAttendeesByDep({ ...modalDepDraft }); setShowAttendeesModal(false); }}
                  className="flex-1 rounded-xl font-semibold cursor-pointer"
                  style={{ height: 48, background: '#0087CF', border: 'none', color: '#fff', fontFamily: "'Antonio', sans-serif", fontSize: '1rem', letterSpacing: '0.06em', boxShadow: '0 4px 16px rgba(0,135,207,0.30)' }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar actividad/subactividad */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget && !addingNew) { setShowAddModal(false); } }}
        >
          <div
            className="w-full max-w-md rounded-2xl border flex flex-col gap-5 p-6"
            style={{
              background: 'rgba(10,26,46,0.98)',
              borderColor: 'rgba(0,135,207,0.40)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
            }}
          >
            {/* Header modal */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 style={{ fontFamily: "'Antonio', sans-serif", fontSize: '1.4rem', color: '#D4AF37', letterSpacing: '0.04em', lineHeight: 1 }}>
                  {hasSubs ? 'Nueva subactividad' : 'Nueva actividad'}
                </h3>
                <p style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  Plan {year} — {proc.name}
                </p>
              </div>
              <button
                onClick={() => { if (!addingNew) setShowAddModal(false); }}
                className="flex items-center justify-center cursor-pointer shrink-0"
                style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: 8 }}
                aria-label="Cerrar"
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Campos */}
            <div className="flex flex-col gap-3">
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input
                  type="text"
                  placeholder={hasSubs ? 'Ej: Atenciones Individuales' : 'Ej: Jornada de Salud'}
                  value={newSubName}
                  onChange={e => { setNewSubName(e.target.value); if (addNewError) setAddNewError(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); }}
                  className="outline-none"
                  autoFocus
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Cantidad (veces al año) *</label>
                <input
                  type="number"
                  placeholder="Ej: 12"
                  min={1}
                  value={newSubQty}
                  onChange={e => { setNewSubQty(e.target.value); if (addNewError) setAddNewError(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddActivity(); }}
                  className="outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            {addNewError && <FeedbackBanner type="error" message={addNewError} />}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => { if (!addingNew) setShowAddModal(false); }}
                disabled={addingNew}
                className="flex-1 rounded-xl cursor-pointer transition-all"
                style={{ height: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.65)', fontFamily: "'Roboto Condensed', sans-serif", fontSize: 15, opacity: addingNew ? 0.5 : 1 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddActivity}
                disabled={addingNew}
                className="flex-1 rounded-xl font-semibold transition-all"
                style={{
                  height: 48,
                  background: addingNew ? 'rgba(0,135,207,0.30)' : '#0087CF',
                  border: 'none',
                  color: '#fff',
                  fontFamily: "'Antonio', sans-serif",
                  fontSize: '1rem',
                  letterSpacing: '0.06em',
                  cursor: addingNew ? 'not-allowed' : 'pointer',
                  boxShadow: addingNew ? 'none' : '0 4px 16px rgba(0,135,207,0.30)',
                }}
              >
                {addingNew ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block rounded-full border-2 animate-spin" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    Guardando...
                  </span>
                ) : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header sticky */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: 'rgba(19,65,116,0.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: 'rgba(212,175,55,0.16)',
        }}
      >
        <div className="px-4 sm:px-6 h-[64px] flex items-center gap-3">
          {/* Volver */}
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1.5 cursor-pointer shrink-0 rounded-lg px-2 py-1.5 transition-all"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.65)',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 14,
              height: 44,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
          >
            <svg width={20} height={20} viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Panel</span>
          </button>

          <IccuLogo height={44} />

          {/* Nombre del proceso */}
          <div className="flex-1 min-w-0">
            <h1
              className="truncate leading-none"
              style={{
                fontFamily: "'Antonio', sans-serif",
                fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
                color: '#D4AF37',
                letterSpacing: '0.04em',
              }}
            >
              {proc.name}
            </h1>
            <p
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                fontSize: 11,
                color: 'rgba(255,255,255,0.35)',
                marginTop: 2,
              }}
            >
              Administración — {year}
            </p>
          </div>

          {/* Salir */}
          <button
            onClick={handleLogout}
            className="shrink-0 flex items-center gap-1.5 px-3 rounded-lg cursor-pointer transition-all"
            style={{
              height: 44,
              background: 'rgba(224,9,20,0.09)',
              border: '1px solid rgba(224,9,20,0.22)',
              color: '#ff9aa2',
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 13,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,9,20,0.20)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(224,9,20,0.09)'; }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── S1: Estado actual ─────────────────────────────────────────────── */}
        <SectionCard title="Estado actual">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Avance */}
            <div
              className="rounded-xl p-4 border text-center col-span-2 sm:col-span-1"
              style={{
                background: 'rgba(212,175,55,0.08)',
                borderColor: 'rgba(212,175,55,0.25)',
              }}
            >
              <div
                style={{
                  fontFamily: "'Antonio', sans-serif",
                  fontSize: '2.5rem',
                  color: '#D4AF37',
                  lineHeight: 1,
                }}
              >
                {pct || 0}%
              </div>
              <div
                className="mt-2"
                style={{
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Avance {year}
              </div>
              {/* Mini barra de progreso */}
              <div
                className="mt-3 rounded-full overflow-hidden mx-auto"
                style={{ height: 4, background: 'rgba(255,255,255,0.1)', maxWidth: 100 }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, pct)}%`, background: barColor }}
                />
              </div>
            </div>

            {[
              { label: 'Subactividades', value: proc.subactivities.length },
              { label: 'Actividades registradas', value: allActivities.length },
            ].map(card => (
              <div
                key={card.label}
                className="rounded-xl p-4 border text-center"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.07)',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Antonio', sans-serif",
                    fontSize: '2rem',
                    color: '#fff',
                    lineHeight: 1,
                  }}
                >
                  {card.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: 5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {card.label}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── S2: Parametrización anual ─────────────────────────────────────── */}
        <SectionCard title="Parametrización anual">
          <div className="flex flex-col gap-3">

            {/* Switch: ¿tiene subactividades? */}
            {!allLocked && (
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div>
                  <p style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 14, color: '#fff' }}>
                    ¿Este proceso tiene subactividades?
                  </p>
                  <p style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {hasSubs
                      ? 'Puedes agregar más de una actividad'
                      : 'Solo habrá una actividad para este proceso'}
                  </p>
                </div>
                <button
                  onClick={() => { if (switchEditable) setLocalHasSubs(v => !v); }}
                  className="relative rounded-full transition-all"
                  style={{
                    width: 44, height: 24,
                    background: hasSubs ? '#0087CF' : 'rgba(255,255,255,0.15)',
                    border: 'none', flexShrink: 0,
                    cursor: switchEditable ? 'pointer' : 'default',
                    opacity: switchEditable ? 1 : 0.55,
                  }}
                  role="switch"
                  aria-checked={hasSubs}
                >
                  <span
                    className="absolute rounded-full transition-all"
                    style={{ width: 18, height: 18, background: '#fff', top: 3, left: hasSubs ? 23 : 3 }}
                  />
                </button>
              </div>
            )}

            {/* Lista de actividades configuradas */}
            {proc.subactivities.map(sub => (
              <div
                key={sub.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 border transition-all"
                style={{
                  background: sub.isLocked ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.04)',
                  borderColor: sub.isLocked ? 'rgba(74,222,128,0.22)' : 'rgba(255,255,255,0.09)',
                }}
              >
                {sub.isLocked && (
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <rect x={3} y={11} width={18} height={11} rx={2} stroke="#4ade80" strokeWidth={2} />
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="#4ade80" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 15, color: sub.isLocked ? 'rgba(255,255,255,0.75)' : '#fff' }} title={sub.name}>
                    {sub.name}
                  </p>
                  {sub.isLocked && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(74,222,128,0.12)', color: '#86efac', fontFamily: "'Roboto Condensed', sans-serif", border: '1px solid rgba(74,222,128,0.25)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Confirmada
                    </span>
                  )}
                </div>
                {sub.isLocked ? (
                  <>
                    <span style={{ fontFamily: "'Antonio', sans-serif", fontSize: '1.5rem', color: '#4ade80', minWidth: 56, textAlign: 'right', lineHeight: 1 }}>
                      {sub.target || 0}
                    </span>
                    <button
                      onClick={() => handleDeleteSub(sub.id)}
                      disabled={deletingSubId === sub.id}
                      className="flex items-center justify-center shrink-0 cursor-pointer rounded-lg"
                      style={{ width: 36, height: 44, background: 'rgba(224,9,20,0.10)', border: '1px solid rgba(224,9,20,0.22)', color: '#ff9aa2', opacity: deletingSubId === sub.id ? 0.5 : 1 }}
                      title="Eliminar del plan"
                    >
                      {deletingSubId === sub.id ? (
                        <span className="inline-block rounded-full border-2 animate-spin" style={{ width: 12, height: 12, borderColor: 'rgba(255,154,162,0.3)', borderTopColor: '#ff9aa2' }} />
                      ) : (
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      min={0}
                      value={targetValues[sub.id] ?? ''}
                      onChange={e => setTargetValues(prev => ({ ...prev, [sub.id]: e.target.value }))}
                      className="outline-none transition-all text-center"
                      style={{ width: 88, height: 44, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, color: '#fff', fontFamily: "'Antonio', sans-serif", fontSize: '1.15rem', caretColor: '#D4AF37', flexShrink: 0 }}
                      placeholder="Meta"
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.55)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    />
                    <button
                      onClick={() => handleDeleteSub(sub.id)}
                      disabled={deletingSubId === sub.id}
                      className="flex items-center justify-center shrink-0 cursor-pointer rounded-lg"
                      style={{ width: 36, height: 44, background: 'rgba(224,9,20,0.10)', border: '1px solid rgba(224,9,20,0.22)', color: '#ff9aa2', opacity: deletingSubId === sub.id ? 0.5 : 1 }}
                      title="Eliminar del plan"
                    >
                      {deletingSubId === sub.id ? (
                        <span className="inline-block rounded-full border-2 animate-spin" style={{ width: 12, height: 12, borderColor: 'rgba(255,154,162,0.3)', borderTopColor: '#ff9aa2' }} />
                      ) : (
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </>
                )}
              </div>
            ))}

            {/* Botón para abrir modal de agregar */}
            {showAddForm && (
              <button
                onClick={() => { setNewSubName(''); setNewSubQty(''); setAddNewError(null); setShowAddModal(true); }}
                className="flex items-center justify-center gap-2 w-full rounded-xl cursor-pointer transition-all"
                style={{ height: 44, background: 'rgba(212,175,55,0.10)', border: '1px dashed rgba(212,175,55,0.40)', color: '#D4AF37', fontFamily: "'Roboto Condensed', sans-serif", fontSize: 14 }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
                </svg>
                {hasSubs ? 'Agregar subactividad' : 'Agregar actividad'}
              </button>
            )}

            {/* Feedback y confirmar */}
            {targetsSuccess && <FeedbackBanner type="success" message="Metas confirmadas y bloqueadas para el año." />}
            {targetsError && <FeedbackBanner type="error" message={targetsError} />}

            {hasUnlockedSubs && (
              <button
                onClick={handleSaveTargets}
                disabled={savingTargets}
                className="w-full rounded-xl font-semibold transition-all mt-1"
                style={{ height: 52, background: savingTargets ? 'rgba(0,135,207,0.30)' : '#0087CF', border: 'none', color: '#fff', fontFamily: "'Antonio', sans-serif", fontSize: '1.05rem', letterSpacing: '0.06em', cursor: savingTargets ? 'not-allowed' : 'pointer', boxShadow: savingTargets ? 'none' : '0 4px 16px rgba(0,135,207,0.30)' }}
              >
                {savingTargets ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block rounded-full border-2 animate-spin" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    Guardando metas...
                  </span>
                ) : 'Confirmar metas del año'}
              </button>
            )}

            {allLocked && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)' }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 14, color: '#86efac' }}>
                  Todas las metas están confirmadas para {year}.
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── S3: Registrar actividad ───────────────────────────────────────── */}
        <SectionCard title="Registrar actividad">
          <form onSubmit={handleCreateActivity} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Subactividad */}
              <div className="sm:col-span-2">
                <label htmlFor="act-subactivity" style={{
                  ...labelStyle,
                  color: formErrors.subactivity ? '#ff9aa2' : labelStyle.color,
                }}>
                  Subactividad *
                </label>
                <select
                  id="act-subactivity"
                  value={actSubactivity}
                  onChange={e => {
                    setActSubactivity(e.target.value);
                    if (formErrors.subactivity) setFormErrors(p => ({ ...p, subactivity: false }));
                  }}
                  style={{
                    ...inputStyle,
                    borderColor: formErrors.subactivity ? 'rgba(224,9,20,0.55)' : 'rgba(255,255,255,0.13)',
                    background: formErrors.subactivity ? 'rgba(224,9,20,0.08)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <option value="" style={{ background: '#0e2d4f' }}>
                    Selecciona una subactividad
                  </option>
                  {proc.subactivities.map(s => (
                    <option key={s.id} value={s.id} style={{ background: '#0e2d4f' }}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título */}
              <div className="sm:col-span-2">
                <label htmlFor="act-title" style={{
                  ...labelStyle,
                  color: formErrors.title ? '#ff9aa2' : labelStyle.color,
                }}>
                  Título *
                </label>
                <input
                  id="act-title"
                  type="text"
                  value={actTitle}
                  onChange={e => {
                    setActTitle(e.target.value);
                    if (formErrors.title) setFormErrors(p => ({ ...p, title: false }));
                  }}
                  placeholder="Título de la actividad"
                  style={{
                    ...inputStyle,
                    borderColor: formErrors.title ? 'rgba(224,9,20,0.55)' : 'rgba(255,255,255,0.13)',
                    background: formErrors.title ? 'rgba(224,9,20,0.08)' : 'rgba(255,255,255,0.06)',
                  }}
                  onFocus={e => {
                    if (!formErrors.title) {
                      e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                    }
                  }}
                  onBlur={e => {
                    if (!formErrors.title) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }
                  }}
                />
              </div>

              {/* Descripción */}
              <div className="sm:col-span-2">
                <label htmlFor="act-description" style={labelStyle}>Descripción</label>
                <textarea
                  id="act-description"
                  rows={3}
                  value={actDescription}
                  onChange={e => setActDescription(e.target.value)}
                  placeholder="Describe la actividad realizada..."
                  style={textareaStyle}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                />
              </div>

              {/* Mensaje institucional */}
              <div className="sm:col-span-2">
                <label htmlFor="act-message" style={labelStyle}>Mensaje institucional</label>
                <input
                  id="act-message"
                  type="text"
                  value={actMessage}
                  onChange={e => setActMessage(e.target.value)}
                  placeholder="Mensaje o frase motivacional"
                  style={inputStyle}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.45)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                />
              </div>

              {/* Fecha */}
              <div>
                <label htmlFor="act-date" style={{
                  ...labelStyle,
                  color: formErrors.date ? '#ff9aa2' : labelStyle.color,
                }}>
                  Fecha *
                </label>
                <input
                  id="act-date"
                  type="date"
                  value={actDate}
                  onChange={e => {
                    setActDate(e.target.value);
                    if (formErrors.date) setFormErrors(p => ({ ...p, date: false }));
                  }}
                  style={{
                    ...inputStyle,
                    borderColor: formErrors.date ? 'rgba(224,9,20,0.55)' : 'rgba(255,255,255,0.13)',
                    background: formErrors.date ? 'rgba(224,9,20,0.08)' : 'rgba(255,255,255,0.06)',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              {/* Asistentes por dependencia */}
              <div className="sm:col-span-2">
                <label style={labelStyle}>Asistentes por dependencia</label>

                {/* Botón abre modal */}
                <button
                  type="button"
                  onClick={() => { setModalDepDraft({ ...attendeesByDep }); setShowAttendeesModal(true); }}
                  className="flex items-center gap-2 w-full rounded-xl cursor-pointer transition-all"
                  style={{ height: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.60)', fontFamily: "'Roboto Condensed', sans-serif", fontSize: 14, paddingLeft: 14, paddingRight: 14, textAlign: 'left' }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.8} />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
                  </svg>
                  {Object.values(attendeesByDep).some(v => v > 0)
                    ? 'Editar asistentes por dependencia'
                    : 'Agregar asistentes por dependencia'}
                </button>

                {/* Resumen inline */}
                {DEPARTMENTS.some(d => (attendeesByDep[d.id] || 0) > 0) && (
                  <div className="mt-2 flex flex-col gap-1">
                    {DEPARTMENTS.filter(d => (attendeesByDep[d.id] || 0) > 0).map(d => (
                      <div key={d.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.55)', paddingLeft: d.sub ? 12 : 0 }}>{d.label}</span>
                        <span style={{ fontFamily: "'Antonio', sans-serif", fontSize: '1rem', color: '#D4AF37', minWidth: 32, textAlign: 'right' }}>{attendeesByDep[d.id] || 0}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="mt-3">
                  <label style={labelStyle}>Asistentes totales</label>
                  <div
                    className="flex items-center px-4 rounded-xl"
                    style={{ height: 48, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}
                  >
                    <span style={{ fontFamily: "'Antonio', sans-serif", fontSize: '1.4rem', color: '#D4AF37', lineHeight: 1 }}>
                      {Object.values(attendeesByDep).reduce((s, v) => s + (v || 0), 0) || 0}
                    </span>
                    <span style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>
                      asistentes en total
                    </span>
                  </div>
                </div>
              </div>

              {/* Zona de fotos con drag and drop */}
              <div className="sm:col-span-2">
                <label style={labelStyle}>Fotos</label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handlePhotosChange}
                  className="hidden"
                  id="act-photos-input"
                />

                {/* Área de drop */}
                <div
                  role="button"
                  tabIndex={0}
                  className="rounded-xl transition-all cursor-pointer"
                  style={{
                    border: `2px dashed ${isDragOver ? '#0087CF' : 'rgba(0,135,207,0.30)'}`,
                    background: isDragOver
                      ? 'rgba(0,135,207,0.12)'
                      : 'rgba(0,135,207,0.05)',
                    padding: '20px 16px',
                    textAlign: 'center',
                  }}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                  aria-label="Área para subir fotos. Haz clic o arrastra imágenes aquí."
                >
                  <svg
                    width={28}
                    height={28}
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mx-auto mb-2"
                    style={{ color: isDragOver ? '#0087CF' : 'rgba(0,135,207,0.6)' }}
                  >
                    <path
                      d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p
                    style={{
                      fontFamily: "'Roboto Condensed', sans-serif",
                      color: isDragOver ? '#6dcff6' : 'rgba(0,135,207,0.75)',
                      fontSize: 14,
                      lineHeight: 1.4,
                    }}
                  >
                    {isDragOver
                      ? 'Suelta las fotos aquí'
                      : 'Haz clic para agregar fotos o arrastra aquí'}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Roboto Condensed', sans-serif",
                      color: 'rgba(255,255,255,0.25)',
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    En móvil se abre la cámara directamente
                  </p>
                  {actPhotos.length > 0 && (
                    <span
                      className="inline-block mt-3 px-3 py-1 rounded-full"
                      style={{
                        background: 'rgba(0,135,207,0.20)',
                        border: '1px solid rgba(0,135,207,0.35)',
                        color: '#6dcff6',
                        fontFamily: "'Roboto Condensed', sans-serif",
                        fontSize: 13,
                      }}
                    >
                      {actPhotos.length} foto{actPhotos.length !== 1 ? 's' : ''} seleccionada{actPhotos.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Preview grid de fotos */}
                {actPhotosPreviews.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                    {actPhotosPreviews.map((src, i) => (
                      <div
                        key={i}
                        className="relative rounded-lg overflow-hidden border"
                        style={{
                          aspectRatio: '1',
                          borderColor: 'rgba(212,175,55,0.22)',
                        }}
                      >
                        <img
                          src={src}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removePhoto(i); }}
                          className="absolute top-1 right-1 flex items-center justify-center rounded-full cursor-pointer"
                          style={{
                            width: 22,
                            height: 22,
                            background: 'rgba(14,0,0,0.75)',
                            border: '1px solid rgba(224,9,20,0.6)',
                            color: '#fff',
                          }}
                          aria-label={`Eliminar foto ${i + 1}`}
                        >
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Barra de progreso de upload */}
            {creatingActivity && actPhotos.length > 0 && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="flex justify-between mb-1.5">
                  <span
                    style={{
                      fontFamily: "'Roboto Condensed', sans-serif",
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.45)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Subiendo fotos
                  </span>
                  <span
                    style={{
                      fontFamily: "'Roboto Condensed', sans-serif",
                      fontSize: 12,
                      color: '#D4AF37',
                    }}
                  >
                    {uploadProgress}%
                  </span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: 4, background: 'rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                      background: 'linear-gradient(90deg, #0087CF, #6dcff6)',
                    }}
                  />
                </div>
              </div>
            )}

            {createSuccess && (
              <div className="mt-4">
                <FeedbackBanner type="success" message="Actividad registrada correctamente." />
              </div>
            )}
            {createError && (
              <div className="mt-4">
                <FeedbackBanner type="error" message={createError} />
              </div>
            )}

            {/* Botón registrar */}
            <button
              type="submit"
              disabled={creatingActivity}
              className="w-full rounded-xl font-semibold mt-5 transition-all"
              style={{
                height: 52,
                background: creatingActivity ? 'rgba(0,135,207,0.30)' : '#0087CF',
                border: 'none',
                color: '#fff',
                fontFamily: "'Antonio', sans-serif",
                fontSize: '1.05rem',
                letterSpacing: '0.06em',
                cursor: creatingActivity ? 'not-allowed' : 'pointer',
                boxShadow: creatingActivity ? 'none' : '0 4px 16px rgba(0,135,207,0.28)',
              }}
              onMouseEnter={e => {
                if (!creatingActivity) {
                  e.currentTarget.style.background = '#0099e6';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,135,207,0.40)';
                }
              }}
              onMouseLeave={e => {
                if (!creatingActivity) {
                  e.currentTarget.style.background = '#0087CF';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,135,207,0.28)';
                }
              }}
            >
              {creatingActivity ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block rounded-full border-2 animate-spin"
                    style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                  />
                  Registrando...
                </span>
              ) : (
                'Registrar actividad'
              )}
            </button>
          </form>
        </SectionCard>

        {/* ── S4: Actividades registradas ───────────────────────────────────── */}
        <SectionCard title={`Actividades registradas (${allActivities.length})`}>
          {allActivities.length === 0 ? (
            <div
              className="text-center py-12"
              style={{ borderRadius: 12 }}
            >
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p
                style={{
                  fontFamily: "'Roboto Condensed', sans-serif",
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: 15,
                }}
              >
                Aún no hay actividades registradas para {year}.
              </p>
              <p
                style={{
                  fontFamily: "'Roboto Condensed', sans-serif",
                  color: 'rgba(255,255,255,0.2)',
                  fontSize: 13,
                  marginTop: 6,
                }}
              >
                Usa el formulario anterior para agregar la primera.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {allActivities.map(act => {
                const subName = proc.subactivities.find(s => s.id === act.subactivityId)?.name ?? '';
                const photos: string[] = Array.isArray(act.photos) ? act.photos : [];
                const isDeleting = deletingId === act.id;

                return (
                  <div
                    key={act.id}
                    className="rounded-xl border p-4 transition-all"
                    style={{
                      background: isDeleting ? 'rgba(224,9,20,0.06)' : 'rgba(255,255,255,0.04)',
                      borderColor: isDeleting ? 'rgba(224,9,20,0.25)' : 'rgba(255,255,255,0.07)',
                      opacity: isDeleting ? 0.7 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        {/* Título */}
                        <p
                          className="truncate"
                          style={{
                            fontFamily: "'Antonio', sans-serif",
                            fontSize: '1rem',
                            color: '#fff',
                            letterSpacing: '0.02em',
                          }}
                          title={act.title}
                        >
                          {act.title}
                        </p>

                        {/* Meta-info */}
                        <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                          {subName && (
                            <span
                              className="inline-block px-2 py-0.5 rounded"
                              style={{
                                background: 'rgba(0,135,207,0.12)',
                                color: '#6dcff6',
                                fontFamily: "'Roboto Condensed', sans-serif",
                                border: '1px solid rgba(0,135,207,0.22)',
                                fontSize: 11,
                              }}
                            >
                              {subName}
                            </span>
                          )}
                          <span
                            style={{
                              fontFamily: "'Roboto Condensed', sans-serif",
                              fontSize: 12,
                              color: '#D4AF37',
                            }}
                          >
                            {new Date(act.date + 'T00:00:00').toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {typeof act.attendees === 'number' && act.attendees > 0 && (
                            <span
                              style={{
                                fontFamily: "'Roboto Condensed', sans-serif",
                                fontSize: 12,
                                color: 'rgba(255,255,255,0.4)',
                              }}
                            >
                              {act.attendees} asistente{act.attendees !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botón eliminar con ícono papelera */}
                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        disabled={isDeleting}
                        title="Eliminar actividad"
                        className="shrink-0 flex items-center justify-center rounded-lg cursor-pointer transition-all"
                        style={{
                          width: 40,
                          height: 40,
                          background: 'rgba(224,9,20,0.08)',
                          border: '1px solid rgba(224,9,20,0.20)',
                          color: '#ff9aa2',
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          opacity: isDeleting ? 0.5 : 1,
                        }}
                        onMouseEnter={e => {
                          if (!isDeleting) {
                            e.currentTarget.style.background = 'rgba(224,9,20,0.22)';
                            e.currentTarget.style.borderColor = 'rgba(224,9,20,0.45)';
                          }
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(224,9,20,0.08)';
                          e.currentTarget.style.borderColor = 'rgba(224,9,20,0.20)';
                        }}
                        aria-label={`Eliminar actividad: ${act.title}`}
                      >
                        {isDeleting ? (
                          <span
                            className="inline-block rounded-full border-2 animate-spin"
                            style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#ff9aa2' }}
                          />
                        ) : (
                          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                            <path
                              d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Miniaturas de fotos */}
                    {photos.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {photos.slice(0, 3).map((photo, i) => (
                          <div
                            key={i}
                            className="shrink-0 rounded-lg overflow-hidden border"
                            style={{
                              width: 52,
                              height: 52,
                              borderColor: 'rgba(212,175,55,0.18)',
                            }}
                          >
                            <img
                              src={photo}
                              alt={`Foto ${i + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                        {photos.length > 3 && (
                          <div
                            className="shrink-0 rounded-lg flex items-center justify-center border"
                            style={{
                              width: 52,
                              height: 52,
                              borderColor: 'rgba(255,255,255,0.08)',
                              background: 'rgba(255,255,255,0.05)',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Antonio', sans-serif",
                                color: 'rgba(255,255,255,0.45)',
                                fontSize: 13,
                              }}
                            >
                              +{photos.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── S5: Zona de peligro ───────────────────────────────────────────── */}
        <SectionCard title="Zona de peligro" accent="danger">
          <p
            style={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 14,
              color: 'rgba(255,255,255,0.50)',
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            El reinicio anual cierra el año <strong style={{ color: '#ff9aa2' }}>{year - 1}</strong> y archiva
            todas las actividades registradas. Se borrarán también los contadores y se liberarán las metas
            para reparametrización. <strong style={{ color: '#ff9aa2' }}>Esta acción no se puede deshacer.</strong>
          </p>

          <button
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-2 px-6 rounded-xl font-semibold cursor-pointer transition-all"
            style={{
              height: 48,
              background: 'rgba(224,9,20,0.10)',
              border: '1px solid rgba(224,9,20,0.40)',
              color: '#ff9aa2',
              fontFamily: "'Antonio', sans-serif",
              fontSize: '1rem',
              letterSpacing: '0.05em',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#E00914';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = '#E00914';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(224,9,20,0.40)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(224,9,20,0.10)';
              e.currentTarget.style.color = '#ff9aa2';
              e.currentTarget.style.borderColor = 'rgba(224,9,20,0.40)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Iniciar reinicio anual
          </button>
        </SectionCard>

      </main>
    </div>
  );
}
