import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IccuLogo } from '../../components/ui/IccuLogo';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: boolean; password?: boolean }>({});

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validación inline
    const errors: { username?: boolean; password?: boolean } = {};
    if (!username.trim()) errors.username = true;
    if (!password.trim()) errors.password = true;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Completa todos los campos para ingresar.');
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
      navigate('/admin/dashboard', { replace: true });
    } catch {
      setError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(0,135,207,0.22) 0%, transparent 55%), radial-gradient(ellipse at 75% 80%, rgba(212,175,55,0.10) 0%, transparent 50%), #134174',
      }}
    >
      {/* Logo sobre la card */}
      <div className="mb-6">
        <IccuLogo height={80} />
      </div>

      {/* Card glassmorphism */}
      <div
        className="w-full rounded-2xl border p-8"
        style={{
          maxWidth: 400,
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(212,175,55,0.22)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Título */}
        <div className="text-center mb-8">
          <h1
            style={{
              fontFamily: "'Antonio', sans-serif",
              fontSize: '1.9rem',
              color: '#D4AF37',
              letterSpacing: '0.06em',
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            Panel de Administración
          </h1>
          <p
            style={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: 13,
              color: 'rgba(255,255,255,0.40)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Talento Humano — ICCU
          </p>
        </div>

        {/* Separador dorado */}
        <div
          className="mb-8 mx-auto"
          style={{
            width: 40,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
          }}
        />

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">

            {/* Campo usuario */}
            <div>
              <label
                htmlFor="username"
                style={{
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontSize: 11,
                  color: fieldErrors.username ? '#ff9aa2' : 'rgba(255,255,255,0.55)',
                  display: 'block',
                  marginBottom: 6,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Usuario
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: false }));
                }}
                disabled={loading}
                className="w-full px-4 rounded-lg outline-none transition-all"
                style={{
                  background: fieldErrors.username
                    ? 'rgba(224,9,20,0.10)'
                    : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${fieldErrors.username ? 'rgba(224,9,20,0.5)' : 'rgba(255,255,255,0.14)'}`,
                  color: '#fff',
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontSize: 16, // evita zoom en iOS
                  height: 48,   // touch target mínimo
                  caretColor: '#D4AF37',
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={e => {
                  if (!fieldErrors.username) {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.55)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
                  }
                }}
                onBlur={e => {
                  if (!fieldErrors.username) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  }
                }}
              />
            </div>

            {/* Campo contraseña */}
            <div>
              <label
                htmlFor="password"
                style={{
                  fontFamily: "'Roboto Condensed', sans-serif",
                  fontSize: 11,
                  color: fieldErrors.password ? '#ff9aa2' : 'rgba(255,255,255,0.55)',
                  display: 'block',
                  marginBottom: 6,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: false }));
                  }}
                  disabled={loading}
                  className="w-full px-4 rounded-lg outline-none transition-all"
                  style={{
                    background: fieldErrors.password
                      ? 'rgba(224,9,20,0.10)'
                      : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${fieldErrors.password ? 'rgba(224,9,20,0.5)' : 'rgba(255,255,255,0.14)'}`,
                    color: '#fff',
                    fontFamily: "'Roboto Condensed', sans-serif",
                    fontSize: 16,
                    height: 48,
                    paddingRight: 48,
                    caretColor: '#D4AF37',
                    opacity: loading ? 0.6 : 1,
                  }}
                  onFocus={e => {
                    if (!fieldErrors.password) {
                      e.currentTarget.style.borderColor = 'rgba(212,175,55,0.55)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
                    }
                  }}
                  onBlur={e => {
                    if (!fieldErrors.password) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212,175,55,0.8)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx={12} cy={12} r={3} />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error global */}
            {error && (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                role="alert"
                aria-live="polite"
                style={{
                  background: 'rgba(224,9,20,0.12)',
                  border: '1px solid rgba(224,9,20,0.3)',
                }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                  <circle cx={12} cy={12} r={10} stroke="#ff6b75" strokeWidth={2} />
                  <path d="M12 8v4M12 16h.01" stroke="#ff6b75" strokeWidth={2} strokeLinecap="round" />
                </svg>
                <p
                  style={{
                    fontFamily: "'Roboto Condensed', sans-serif",
                    color: '#ff9aa2',
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg font-semibold transition-all"
              style={{
                height: 52,
                background: loading ? 'rgba(0,135,207,0.45)' : '#0087CF',
                color: '#fff',
                fontFamily: "'Antonio', sans-serif",
                fontSize: '1.15rem',
                letterSpacing: '0.08em',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(0,135,207,0.35)',
                transition: 'background 200ms, box-shadow 200ms, transform 100ms',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.background = '#0099e6';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,135,207,0.45)';
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.background = '#0087CF';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,135,207,0.35)';
                }
              }}
              onMouseDown={e => {
                if (!loading) e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span
                    className="inline-block rounded-full border-2 animate-spin"
                    style={{
                      width: 18,
                      height: 18,
                      borderColor: 'rgba(255,255,255,0.35)',
                      borderTopColor: '#fff',
                    }}
                  />
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <p
        className="mt-8 text-center"
        style={{
          fontFamily: "'Roboto Condensed', sans-serif",
          fontSize: 12,
          color: 'rgba(255,255,255,0.22)',
          letterSpacing: '0.04em',
          maxWidth: 280,
          lineHeight: 1.5,
        }}
      >
        Instituto de Caminos y Construcciones de Cundinamarca
      </p>
    </div>
  );
}
