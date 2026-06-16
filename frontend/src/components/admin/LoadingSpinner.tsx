interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({
  message = 'Cargando...',
  fullScreen = false,
  size = 'md',
}: LoadingSpinnerProps) {
  const sizeMap = { sm: 24, md: 40, lg: 56 };
  const px = sizeMap[size];

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-full border-4 animate-spin"
        style={{
          width: px,
          height: px,
          borderColor: 'rgba(212,175,55,0.25)',
          borderTopColor: '#D4AF37',
        }}
      />
      {message && (
        <p
          style={{
            fontFamily: "'Roboto Condensed', sans-serif",
            color: 'rgba(255,255,255,0.5)',
            fontSize: 15,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#134174' }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      {spinner}
    </div>
  );
}
