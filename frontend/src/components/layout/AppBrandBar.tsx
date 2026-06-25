export function AppBrandBar() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 34,
        zIndex: 9999,
        background: '#134174',
        borderTop: '1px solid rgba(212,175,55,0.14)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {/* Desktop */}
      <p
        className="hidden sm:block"
        style={{
          fontFamily: "'Roboto Condensed', sans-serif",
          fontSize: 13,
          color: 'rgba(212,175,55,0.55)',
          letterSpacing: '0.07em',
          whiteSpace: 'nowrap',
        }}
      >
        🇨🇴 Hecho con orgullo en Colombia &nbsp;·&nbsp; © 2026 Kairos DLS Group S.A.S · Todos los derechos reservados &nbsp;·&nbsp; © ICCU
      </p>
      {/* Mobile */}
      <p
        className="sm:hidden"
        style={{
          fontFamily: "'Roboto Condensed', sans-serif",
          fontSize: 11,
          color: 'rgba(212,175,55,0.55)',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}
      >
        🇨🇴 © 2026 Kairos DLS Group S.A.S · © ICCU
      </p>
    </div>
  );
}
