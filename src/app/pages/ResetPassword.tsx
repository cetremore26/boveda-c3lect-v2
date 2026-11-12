import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/ds/Field';
import { Button } from '../components/ds/Button';
import { FormError } from '../components/ds/FormError';
import { mensajeDeError } from '../api/common';
import { tokenDeResetCapturado } from '../lib/resetToken';
import { validarNuevaContrasena } from '../lib/contrasena';

export default function ResetPassword() {
  const { requestPasswordReset, restablecerContrasena } = useAuth();
  const navigate = useNavigate();
  const token = tokenDeResetCapturado();

  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await requestPasswordReset(email);
      setEnviado(true);
    } catch (err) {
      setError(mensajeDeError(err, 'No pudimos enviar el enlace. Intenta de nuevo.'));
    } finally {
      setEnviando(false);
    }
  }

  async function handleNuevaContrasena(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const invalida = validarNuevaContrasena(nueva, confirmacion);
    if (invalida) {
      setError(invalida);
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await restablecerContrasena(token, nueva);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err, 'El enlace no es válido o expiró. Pide uno nuevo.'));
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0A0A0A]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-12 text-center">
          <Link
            to="/"
            className="text-2xl tracking-[0.22em]"
            style={{ fontFamily: 'var(--font-sans)', fontWeight: 300, color: '#C9A84C' }}
          >
            C3LECT
          </Link>
          <h1
            className="mt-6 text-4xl text-white"
            style={{ fontFamily: 'var(--font-serif)', fontWeight: 300 }}
          >
            Recuperar contraseña
          </h1>
        </div>

        {token ? (
          <form onSubmit={handleNuevaContrasena} className="space-y-7">
            <p className="text-sm text-white/50 leading-relaxed">
              Elige tu nueva contraseña.
            </p>
            {error && <FormError>{error}</FormError>}
            <Field
              label="Nueva contraseña"
              type="password"
              required
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              autoComplete="new-password"
            />
            <Field
              label="Confirmar contraseña"
              type="password"
              required
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              autoComplete="new-password"
            />
            <Button type="submit" disabled={enviando} variant="block-dark">
              {enviando ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
            <div className="text-center">
              <a
                href="/reset-password"
                className="text-xs uppercase tracking-widest text-white/40 hover:text-[#C9A84C] transition-colors"
              >
                Pedir un enlace nuevo
              </a>
            </div>
          </form>
        ) : enviado ? (
          <div className="text-center space-y-6">
            <p className="text-base text-white/60 leading-relaxed">
              Si <strong className="text-white/70">{email}</strong> está registrado,
              recibirás un enlace de recuperación en tu correo.
            </p>
            <Link
              to="/login"
              className="inline-block text-xs uppercase tracking-widest text-[#C9A84C] hover:underline"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-7">
            <p className="text-sm text-white/50 leading-relaxed">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            {error && <FormError>{error}</FormError>}
            <Field
              label="Correo electrónico"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
            />
            <Button type="submit" disabled={enviando} variant="block-dark">
              {enviando ? 'Enviando…' : 'Enviar enlace'}
            </Button>
            <div className="text-center">
              <Link
                to="/login"
                className="text-xs uppercase tracking-widest text-white/40 hover:text-[#C9A84C] transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
