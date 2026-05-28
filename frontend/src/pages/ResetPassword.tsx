import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { Button } from '../components/ui/Button';
import { supabase } from '../utils/supabase';
import { mapAuthError } from '../services/auth';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Extract query parameters from the redirect URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      // Initialize Supabase session so that the user can be authenticated
      void supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }
    if (newPassword.trim().length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
      if (error) throw new Error(mapAuthError(error.message));
      setSuccessMessage('Senha alterada com sucesso. Redirecionando para login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao atualizar a senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-10">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Redefinir senha
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Informe sua nova senha.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Nova senha
            </label>

            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 pr-12 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />

              <button
                type="button"
                onClick={() => setShowNewPassword((old) => !old)}
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-[var(--muted)] transition hover:text-[var(--foreground)]"
                aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showNewPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Confirmar senha
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 pr-12 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((old) => !old)}
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-[var(--muted)] transition hover:text-[var(--foreground)]"
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirmPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
              </button>
            </div>
          </div>
          {errorMessage && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {successMessage}
            </div>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Atualizando...' : 'Redefinir senha'}
          </Button>
        </form>
      </section>
    </main>
  );
}
