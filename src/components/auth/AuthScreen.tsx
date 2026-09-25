import React, { useState } from 'react';
import {
  UtensilsCrossed,
  LogIn,
  Building2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseConfigured } from '../../services/supabase';

type AuthTab = 'login' | 'signup';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, continueAsDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [establishmentName, setEstablishmentName] = useState('');

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    try {
      if (activeTab === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMessage(error.message || 'Error al iniciar sesión. Revisa tus credenciales.');
        }
      } else {
        if (!establishmentName.trim()) {
          setErrorMessage('Por favor ingresa el nombre del establecimiento.');
          setIsSubmitting(false);
          return;
        }

        const tenantSlug =
          establishmentName
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'tenant-local';

        const { data, error } = await signUp(email, password, {
          name: establishmentName.trim(),
          role: 'manager',
          tenantId: tenantSlug,
        });

        if (error) {
          setErrorMessage(error.message || 'Error al registrar el establecimiento.');
        } else if (data?.user && !data?.session) {
          setInfoMessage(
            '¡Registro completado! Por favor revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.'
          );
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocurrió un error inesperado al conectar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = (role: 'manager' | 'staff' = 'manager') => {
    setErrorMessage(null);
    setInfoMessage(null);
    continueAsDemo(role);
  };

  return (
    <div className="min-h-screen w-screen bg-apple-bg flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none transition-colors">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-apple-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-apple-indigo/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md bg-apple-card/85 backdrop-blur-xl border border-apple-border rounded-3xl p-6 sm:p-8 shadow-2xl transition-colors">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-950/80 mb-3">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-apple-label tracking-wide uppercase flex items-center gap-2">
            BarFlow{' '}
            <span className="text-[11px] font-normal lowercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
              mvp
            </span>
          </h1>
          <p className="text-xs text-apple-secondary mt-1">Gestión de Mesas y Operación en Tiempo Real</p>
        </div>

        {/* Supabase Not Configured Warning */}
        {!isSupabaseConfigured && (
          <div className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold block">Supabase no configurado</span>
              Credenciales remotas no detectadas en .env. Puedes usar el{' '}
              <strong>Modo Demo</strong> para explorar la app.
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex p-1 mb-6 bg-apple-fill rounded-2xl border border-apple-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'login'
                ? 'bg-apple-blue text-white shadow-xs'
                : 'text-apple-secondary hover:text-apple-label'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'signup'
                ? 'bg-apple-blue text-white shadow-xs'
                : 'text-apple-secondary hover:text-apple-label'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Registrar Local
          </button>
        </div>

        {/* Info message (e.g. Email confirmation required) */}
        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-apple-secondary mb-1.5">
                Nombre del Bar / Restaurante
              </label>
              <input
                type="text"
                required
                value={establishmentName}
                onChange={(e) => setEstablishmentName(e.target.value)}
                placeholder="Ej. Terraza Bar Central"
                className="w-full bg-apple-fill border border-apple-border rounded-xl px-3.5 py-2.5 text-xs text-apple-label placeholder:text-apple-secondary/60 focus:outline-none focus:border-apple-blue transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full bg-apple-fill border border-apple-border rounded-xl px-3.5 py-2.5 text-xs text-apple-label placeholder:text-apple-secondary/60 focus:outline-none focus:border-apple-blue transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-apple-fill border border-apple-border rounded-xl px-3.5 py-2.5 text-xs text-apple-label placeholder:text-apple-secondary/60 focus:outline-none focus:border-apple-blue transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-apple-blue hover:opacity-90 active:scale-[0.99] disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {activeTab === 'login' ? 'Iniciar Sesión' : 'Registrar Establecimiento'}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Mode Section */}
        <div className="mt-6 pt-5 border-t border-apple-border flex flex-col gap-2.5">
          <div className="text-center">
            <span className="text-[11px] text-apple-secondary font-medium">
              ¿Deseas evaluar o probar sin registrarte?
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoAccess('manager')}
              className="py-2.5 px-3 rounded-xl bg-apple-fill hover:opacity-80 active:scale-[0.99] text-apple-label border border-apple-border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Demo Gestor</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoAccess('staff')}
              className="py-2.5 px-3 rounded-xl bg-apple-fill hover:opacity-80 active:scale-[0.99] text-apple-label border border-apple-border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-apple-blue" />
              <span>Demo Colaborador</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-apple-secondary mt-1">
            <ShieldCheck className="w-3 h-3 text-apple-secondary" />
            <span>Los datos se guardan de forma local en IndexedDB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
