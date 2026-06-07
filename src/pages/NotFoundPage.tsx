import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { Compass } from 'lucide-react';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen grid place-items-center bg-surface-50 dark:bg-surface-950 p-4">
      <div className="card text-center max-w-md">
        <div className="mx-auto grid place-items-center size-14 rounded-2xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200 mb-4">
          <Compass size={28} />
        </div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          404 · {t('errors.notFound')}
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          {t('errors.notFoundSubtitle')}
        </p>
        <Link to="/kanban" className="btn-primary mt-6 inline-flex">
          {t('errors.goHome')}
        </Link>
      </div>
    </div>
  );
}
