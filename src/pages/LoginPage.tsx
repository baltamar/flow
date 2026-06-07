import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Loader2, Workflow } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useAuth, isAuthenticated } from '../features/auth/AuthContext';

export function LoginPage() {
  const { t } = useI18n();
  const { currentUser, pendingEmail, signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/kanban';

  useEffect(() => {
    if (isAuthenticated(currentUser)) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmail(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message === 'invalid_email' ? t('auth.verifyNotice') : message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-surface-50 via-primary-50/30 to-accent-50/40 dark:from-surface-950 dark:via-surface-950 dark:to-surface-900 p-4">
      <div className="w-full max-w-md card shadow-elevated">
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="grid place-items-center size-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-elevated">
            <Workflow size={28} />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {pendingEmail ? (
          <div className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30 p-4 text-center">
            <div className="mx-auto size-10 grid place-items-center rounded-full bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-200 mb-2">
              <Mail size={18} />
            </div>
            <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
              {t('auth.magicLinkSent', { email: pendingEmail })}
            </p>
            <p className="mt-1 text-xs text-primary-700/80 dark:text-primary-300/80">
              {t('auth.verifyNotice')}
            </p>
            <div className="mt-3 flex justify-center">
              <Loader2 size={16} className="animate-spin text-primary-600" />
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1">
                {t('auth.emailLabel')}
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="input"
                dir="ltr"
              />
            </div>
            {error && (
              <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {t('auth.sendMagicLink')}
            </button>

            <div className="flex items-center gap-3 my-2 text-xs text-surface-400">
              <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
              {t('auth.or')}
              <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
            </div>

            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="btn-outline w-full"
            >
              <GoogleMark /> {t('auth.continueWithGoogle')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
