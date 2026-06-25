import { usePWAInstall } from '../hooks/usePWAInstall'

export function PWAInstallBanner() {
  const { isMobile, isIOS, isInstalled, canInstall, promptChecked, alreadyInstalledElsewhere, promptInstall } =
    usePWAInstall()

  // Desktop o ya corriendo como PWA → no bloquear
  if (!isMobile || isInstalled) return null

  // En Android esperamos a saber si el prompt llegará (máx 2 s)
  const isLoading = !isIOS && !promptChecked

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#134174',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 28px',
        fontFamily: "'Roboto Condensed', sans-serif",
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <img
        src="/logos/logo_inicio.png"
        alt="ICCU"
        style={{ height: 110, width: 'auto', objectFit: 'contain', marginBottom: 28, opacity: 0.92 }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />

      {isLoading && <LoadingState />}
      {!isLoading && isIOS && <IOSState />}
      {!isLoading && canInstall && <AndroidInstallState onInstall={promptInstall} />}
      {!isLoading && alreadyInstalledElsewhere && <AlreadyInstalledState />}
    </div>
  )
}

/* ─── Estado: cargando (esperando beforeinstallprompt en Android) ─── */
function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid rgba(212,175,55,0.25)',
          borderTopColor: '#D4AF37',
          animation: 'pwaSpinner 700ms linear infinite',
        }}
      />
      <style>{`@keyframes pwaSpinner { to { transform: rotate(360deg); } }`}</style>
      <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 13, letterSpacing: '0.06em' }}>
        CARGANDO…
      </p>
    </div>
  )
}

/* ─── Estado: Android — botón de instalación nativa ─── */
function AndroidInstallState({ onInstall }: { onInstall: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        textAlign: 'center',
        animation: 'pwaFadeIn 400ms ease both',
        width: '100%',
        maxWidth: 340,
      }}
    >
      <style>{`@keyframes pwaFadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <h2
        style={{
          margin: '0 0 10px',
          fontFamily: "'Antonio', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.04em',
        }}
      >
        ICCU · Talento Humano
      </h2>

      <p style={{ margin: '0 0 32px', fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, letterSpacing: '0.02em' }}>
        Para una mejor experiencia, instala la app en tu dispositivo y accede directamente desde tu pantalla de inicio.
      </p>

      <button
        onClick={onInstall}
        style={{
          width: '100%',
          background: '#D4AF37',
          color: '#134174',
          border: 'none',
          borderRadius: 10,
          padding: '16px 0',
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "'Roboto Condensed', sans-serif",
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(212,175,55,0.35)',
        }}
      >
        Instalar app
      </button>

      <p style={{ margin: '18px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Solo disponible en este dispositivo
      </p>
    </div>
  )
}

/* ─── Estado: iOS — instrucciones paso a paso ─── */
function IOSState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        textAlign: 'center',
        animation: 'pwaFadeIn 400ms ease both',
        width: '100%',
        maxWidth: 340,
      }}
    >
      <h2
        style={{
          margin: '0 0 6px',
          fontFamily: "'Antonio', sans-serif",
          fontSize: 24,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.04em',
        }}
      >
        Agregar a inicio
      </h2>

      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        Instala la app en tu iPhone para acceder rápidamente.
      </p>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          textAlign: 'left',
        }}
      >
        <Step number={1}>
          Toca el botón{' '}
          <ShareIcon />{' '}
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>Compartir</span> en la barra de Safari
        </Step>

        <Step number={2}>
          Desplázate y toca{' '}
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>"Agregar a pantalla de inicio"</span>
        </Step>

        <Step number={3}>
          Confirma tocando{' '}
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>Agregar</span> en la esquina superior derecha
        </Step>
      </div>

      <div
        style={{
          marginTop: 28,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          width: '100%',
        }}
      >
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, letterSpacing: '0.02em' }}>
          Esta pantalla solo aparece en Safari. Si usas otro navegador, ábrela en Safari para instalarla.
        </p>
      </div>
    </div>
  )
}

/* ─── Estado: ya instalada (Android, prompt no llegó) ─── */
function AlreadyInstalledState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        textAlign: 'center',
        animation: 'pwaFadeIn 400ms ease both',
        width: '100%',
        maxWidth: 320,
      }}
    >
      {/* Ícono de check dorado */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(212,175,55,0.15)',
          border: '2px solid rgba(212,175,55,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 22,
        }}
      >
        <svg width={30} height={30} viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2
        style={{
          margin: '0 0 12px',
          fontFamily: "'Antonio', sans-serif",
          fontSize: 24,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.04em',
        }}
      >
        Ya está instalada
      </h2>

      <p style={{ margin: '0 0 28px', fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
        La app ICCU ya se encuentra instalada en tu dispositivo.{'\n'}
        Ábrela directamente desde tu{' '}
        <span style={{ color: '#D4AF37', fontWeight: 600 }}>pantalla de inicio</span>{' '}
        para una mejor experiencia.
      </p>

      <div
        style={{
          padding: '14px 18px',
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 10,
          width: '100%',
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
          Busca el ícono de <strong style={{ color: 'rgba(255,255,255,0.7)' }}>ICCU</strong> en tu pantalla de inicio o en el cajón de apps.
        </p>
      </div>
    </div>
  )
}

/* ─── Helpers de UI ─── */
function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'rgba(212,175,55,0.2)',
          border: '1px solid rgba(212,175,55,0.5)',
          color: '#D4AF37',
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {number}
      </span>
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px', color: '#0087CF' }}
    >
      <rect x={5} y={9} width={14} height={12} rx={2} stroke="currentColor" strokeWidth={1.8} />
      <path d="M12 3v10M9 6l3-3 3 3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
