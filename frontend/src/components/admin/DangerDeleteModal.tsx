import { useEffect, useState } from 'react';

interface DangerDeleteModalProps {
  open: boolean;
  /** Título del modal, ej. "Eliminar actividad registrada" */
  title: string;
  /** Nombre/título del elemento. Se muestra y es la frase que hay que escribir. */
  itemName: string;
  /** Descripción de las consecuencias del borrado. */
  warning: string;
  /** Texto del botón final. */
  confirmLabel?: string;
  loading: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

const DANGER = '#E00914';

/**
 * Modal de borrado destructivo en dos pasos, estilo GitHub:
 *  1) Confirmación con advertencia de consecuencias.
 *  2) Pide escribir (o copiar) el nombre exacto del elemento para habilitar
 *     el botón de borrado — evita borrados accidentales o maliciosos.
 */
export function DangerDeleteModal({
  open,
  title,
  itemName,
  warning,
  confirmLabel = 'Eliminar definitivamente',
  loading,
  error,
  onConfirm,
  onClose,
}: DangerDeleteModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState('');
  const [copied, setCopied] = useState(false);

  // Reiniciar estado cada vez que se abre
  useEffect(() => {
    if (open) {
      setStep(1);
      setTyped('');
      setCopied(false);
    }
  }, [open]);

  // Cerrar con Escape (si no está borrando)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  const matches = typed.trim() === itemName.trim();

  const copyPhrase = async () => {
    try {
      await navigator.clipboard.writeText(itemName);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible — el usuario puede escribir la frase */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border flex flex-col gap-5 p-6"
        style={{
          background: 'rgba(19,65,116,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'rgba(224,9,20,0.35)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center shrink-0 rounded-xl"
              style={{ width: 44, height: 44, background: 'rgba(224,9,20,0.14)', border: '1px solid rgba(224,9,20,0.30)' }}
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={DANGER} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Antonio', sans-serif", fontSize: '1.35rem', color: '#fff', letterSpacing: '0.03em', lineHeight: 1.1 }}>
              {title}
            </h3>
          </div>
          <button
            onClick={() => { if (!loading) onClose(); }}
            className="flex items-center justify-center cursor-pointer shrink-0"
            style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: 8 }}
            aria-label="Cerrar"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {step === 1 ? (
          <>
            <div className="flex flex-col gap-3">
              <p style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 14.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                {warning}
              </p>
              <div
                className="rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <span className="block truncate" style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 15, color: '#fff', fontWeight: 600 }} title={itemName}>
                  {itemName}
                </span>
              </div>
              <p style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 12.5, color: '#ff9aa2' }}>
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { if (!loading) onClose(); }}
                className="flex-1 rounded-xl cursor-pointer transition-all"
                style={{ height: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.65)', fontFamily: "'Roboto Condensed', sans-serif", fontSize: 15 }}
              >
                Cancelar
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl font-semibold cursor-pointer transition-all"
                style={{ height: 48, background: 'rgba(224,9,20,0.16)', border: '1px solid rgba(224,9,20,0.45)', color: '#ff9aa2', fontFamily: "'Antonio', sans-serif", fontSize: '1rem', letterSpacing: '0.05em' }}
              >
                Sí, continuar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <p style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                Para confirmar, escribe o copia el siguiente texto:
              </p>

              {/* Frase a copiar */}
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(224,9,20,0.08)', border: '1px dashed rgba(224,9,20,0.40)' }}
              >
                <code className="flex-1 truncate" style={{ fontFamily: "'Roboto Mono', ui-monospace, monospace", fontSize: 14, color: '#fff' }} title={itemName}>
                  {itemName}
                </code>
                <button
                  onClick={copyPhrase}
                  className="flex items-center gap-1.5 shrink-0 cursor-pointer rounded-md px-2.5 py-1.5 transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: copied ? '#86efac' : 'rgba(255,255,255,0.75)', fontFamily: "'Roboto Condensed', sans-serif", fontSize: 12 }}
                  title="Copiar"
                >
                  {copied ? (
                    <>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Copiado
                    </>
                  ) : (
                    <>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><rect x={9} y={9} width={13} height={13} rx={2} stroke="currentColor" strokeWidth={2} /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /></svg>
                      Copiar
                    </>
                  )}
                </button>
              </div>

              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && matches && !loading) onConfirm(); }}
                placeholder="Escribe el texto aquí"
                autoFocus
                autoComplete="off"
                className="outline-none"
                style={{
                  height: 46,
                  padding: '0 14px',
                  background: 'rgba(255,255,255,0.08)',
                  border: `1px solid ${matches ? 'rgba(74,222,128,0.55)' : 'rgba(255,255,255,0.18)'}`,
                  borderRadius: 10,
                  color: '#fff',
                  fontFamily: "'Roboto Mono', ui-monospace, monospace",
                  fontSize: 14,
                  caretColor: '#D4AF37',
                }}
              />

              {error && (
                <p style={{ fontFamily: "'Roboto Condensed', sans-serif", fontSize: 13, color: '#ff9aa2' }}>
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { if (!loading) setStep(1); }}
                disabled={loading}
                className="flex-1 rounded-xl cursor-pointer transition-all"
                style={{ height: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.65)', fontFamily: "'Roboto Condensed', sans-serif", fontSize: 15, opacity: loading ? 0.5 : 1 }}
              >
                Volver
              </button>
              <button
                onClick={() => { if (matches && !loading) onConfirm(); }}
                disabled={!matches || loading}
                className="flex-1 rounded-xl font-semibold transition-all"
                style={{
                  height: 48,
                  background: matches && !loading ? DANGER : 'rgba(224,9,20,0.25)',
                  border: 'none',
                  color: '#fff',
                  fontFamily: "'Antonio', sans-serif",
                  fontSize: '1rem',
                  letterSpacing: '0.05em',
                  cursor: matches && !loading ? 'pointer' : 'not-allowed',
                  opacity: matches ? 1 : 0.55,
                  boxShadow: matches && !loading ? '0 4px 16px rgba(224,9,20,0.35)' : 'none',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block rounded-full border-2 animate-spin" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    Eliminando...
                  </span>
                ) : confirmLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
