interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorMessage({ message, onRetry, fullScreen = false }: ErrorMessageProps) {
  const content = (
    <div
      className="rounded-2xl border p-8 text-center max-w-md mx-auto"
      style={{
        background: 'rgba(224,9,20,0.08)',
        borderColor: 'rgba(224,9,20,0.25)',
      }}
    >
      {/* Ícono de alerta */}
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
        style={{ background: 'rgba(224,9,20,0.15)', border: '1px solid rgba(224,9,20,0.3)' }}
      >
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="#ff6b75"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p
        style={{
          fontFamily: "'Roboto Condensed', sans-serif",
          color: '#ff9aa2',
          fontSize: 15,
          lineHeight: 1.5,
          marginBottom: onRetry ? 16 : 0,
        }}
      >
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg cursor-pointer transition-all"
          style={{
            background: 'rgba(0,135,207,0.18)',
            border: '1px solid rgba(0,135,207,0.4)',
            color: '#6dcff6',
            fontFamily: "'Roboto Condensed', sans-serif",
            fontSize: 14,
            letterSpacing: '0.03em',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,135,207,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,135,207,0.18)';
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <path
              d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Reintentar
        </button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'radial-gradient(ellipse at 15% 25%, rgba(0,135,207,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(0,180,166,0.12) 0%, transparent 55%), #134174' }}
      >
        {content}
      </div>
    );
  }

  return <div className="py-8">{content}</div>;
}
