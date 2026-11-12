import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { trackCompleteRegistration, setMetaUserData } from '../lib/metaPixel';
import { Field } from '../components/ds/Field';
import { FormError } from '../components/ds/FormError';
import { Button } from '../components/ds/Button';
import { mensajeDeError } from '../api/common';
import { leerEstadoRegistro } from '../lib/autenticacion';
import { PARAM_VOLVER, destinoSeguro, rutaDeAcceso } from '../lib/volver';

interface Fuerza {
  nivel: 0 | 1 | 2 | 3;
  label: string;
  color: string;
}

function calcFuerza(p: string): Fuerza {
  if (!p) return { nivel: 0, label: '', color: '' };
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { nivel: 1, label: 'Débil', color: '#ef4444' };
  if (score === 2) return { nivel: 2, label: 'Regular', color: '#f59e0b' };
  return { nivel: 3, label: 'Fuerte', color: '#22c55e' };
}

type Paso = 'email' | 'codigo' | 'formulario';

export default function Register() {
  const { register, requestOtp, loginConOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destino = destinoSeguro(searchParams.get(PARAM_VOLVER));

  const [nombre, setNombre] = useState('');
  const previo = leerEstadoRegistro(location.state);
  const [paso, setPaso] = useState<Paso>(previo ? 'formulario' : 'email');
  const [email, setEmail] = useState(previo?.email ?? '');
  const [registrationToken, setRegistrationToken] = useState(previo?.registrationToken ?? '');
  const [codigo, setCodigo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const fuerza = calcFuerza(password);

  async function handleEnviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await requestOtp(email);
    } catch {
      // mismo comportamiento siempre — no revelar si el email existe
    } finally {
      setEnviando(false);
      setCodigo('');
      setPaso('codigo');
    }
  }

  async function handleVerificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const result = await loginConOtp(email, codigo);
      if (result?.requiresRegistration) {
        // Con la API vieja el token puede venir vacío.
        setRegistrationToken(result.registrationToken ?? '');
        setPaso('formulario');
      } else {
        // La cuenta ya existía y quedó con la sesión iniciada.
        navigate(destino, { replace: true });
      }
    } catch (err: unknown) {
      setError(mensajeDeError(err, 'Código inválido o expirado'));
    } finally {
      setEnviando(false);
    }
  }

  function cambiarCorreo() {
    setPaso('email');
    setError('');
    setCodigo('');
    setRegistrationToken('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (fuerza.nivel < 2) {
      setError('La contraseña es demasiado débil. Usa al menos 8 caracteres, una mayúscula y un número.');
      return;
    }

    setEnviando(true);
    try {
      await register(email, password, nombre, telefono || undefined, registrationToken || undefined);

      // CompleteRegistration: el evento al que optimiza la campaña de
      // lanzamiento. Va DESPUÉS del await para no contar registros fallidos.
      setMetaUserData({
        email,
        phone: telefono || undefined,
        firstName: nombre.split(' ')[0],
        lastName: nombre.split(' ').slice(1).join(' ') || undefined,
      });
      trackCompleteRegistration();

      navigate(destino, { replace: true });
    } catch (err: unknown) {
      setError(mensajeDeError(err, 'Error al crear la cuenta'));
    } finally {
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
            Crear cuenta
          </h1>
        </div>

        {error && <div className="mb-6"><FormError>{error}</FormError></div>}

        {paso === 'email' && (
          <form onSubmit={handleEnviarCodigo} className="space-y-7">
            <p className="text-sm text-white/50">
              Primero verificamos tu correo: te enviaremos un código de 6 dígitos.
            </p>
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
              {enviando ? 'Enviando…' : 'Enviar código'}
            </Button>
          </form>
        )}

        {paso === 'codigo' && (
          <form onSubmit={handleVerificarCodigo} className="space-y-7">
            <p className="text-sm text-white/50">
              Se envió un código a <strong className="text-white/70">{email}</strong>. Ingrésalo abajo.
            </p>
            <Field
              label="Código OTP"
              type="text"
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center tracking-[0.5em] text-lg"
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <Button type="submit" disabled={enviando} variant="block-dark">
              {enviando ? 'Verificando…' : 'Verificar código'}
            </Button>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={cambiarCorreo}
                className="text-xs uppercase tracking-widest text-white/40 hover:text-[#C9A84C] transition-colors cursor-pointer"
              >
                Usar otro correo
              </button>
            </div>
          </form>
        )}

        {paso === 'formulario' && (
        <form onSubmit={handleSubmit} className="space-y-7">
          <Field
            label="Nombre completo"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            autoComplete="name"
          />

          <Field
            label="Correo electrónico"
            type="email"
            value={email}
            readOnly
            autoComplete="email"
          />

          <Field
            label="Celular"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+57 300 000 0000"
            autoComplete="tel"
          />

          <div>
            <Field
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-white/30 hover:text-[#C9A84C] transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            {/* Indicador de fortaleza */}
            {password && (
              <div className="mt-3 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-px flex-1 transition-colors duration-300"
                      style={{
                        backgroundColor: fuerza.nivel >= n ? fuerza.color : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs uppercase tracking-widest" style={{ color: fuerza.color }}>
                  {fuerza.label}
                  {fuerza.nivel < 2 && (
                    <span className="text-white/30 ml-1 normal-case tracking-normal">— añade mayúsculas, números o símbolos</span>
                  )}
                </p>
              </div>
            )}
          </div>

          <Button type="submit" disabled={enviando} variant="block-dark">
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>
        )}

        <p className="mt-8 text-center text-sm text-white/50">
          ¿Ya tienes cuenta?{' '}
          <Link to={rutaDeAcceso(destino)} className="text-[#C9A84C] hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
