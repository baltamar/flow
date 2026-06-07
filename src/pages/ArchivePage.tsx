import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useOrderStore } from '../features/orders/orderStore';
import { formatCurrency, formatDate } from '../config/region';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { ArchiveRestore, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ArchivePage() {
  const { t } = useI18n();
  const orders = useOrderStore((s) => s.orders);
  const restore = useOrderStore((s) => s.restore);
  const navigate = useNavigate();

  const archived = useMemo(
    () => orders.filter((o) => !!o.archivedAt).sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? '')),
    [orders]
  );

  return (
    <section>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          {t('archive.title')}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {t('archive.subtitle')}
        </p>
      </div>

      {archived.length === 0 ? (
        <div className="card flex flex-col items-center justify-center text-center py-12 text-surface-500 dark:text-surface-400">
          <Inbox size={32} className="mb-2 text-surface-400" />
          <p className="text-sm">{t('archive.empty')}</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-800/50 text-surface-600 dark:text-surface-300">
                <th className="text-start font-medium px-4 py-3">{t('list.code')}</th>
                <th className="text-start font-medium px-4 py-3">{t('list.customer')}</th>
                <th className="text-start font-medium px-4 py-3 hidden sm:table-cell">{t('list.status')}</th>
                <th className="text-start font-medium px-4 py-3 hidden md:table-cell">{t('list.priority')}</th>
                <th className="text-end font-medium px-4 py-3">{t('list.total')}</th>
                <th className="text-start font-medium px-4 py-3 hidden lg:table-cell">{t('archive.archivedAt')}</th>
                <th className="text-end font-medium px-4 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {archived.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-surface-100 dark:border-surface-800"
                >
                  <td
                    className="px-4 py-3 font-mono text-xs cursor-pointer hover:text-primary-600"
                    onClick={() => navigate(`/orders/${o.id}`)}
                  >
                    {o.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-surface-900 dark:text-surface-50">
                    {o.customerName}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <PriorityBadge priority={o.priority} />
                  </td>
                  <td className="px-4 py-3 text-end font-semibold text-primary-700 dark:text-primary-300">
                    {formatCurrency(o.total)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-surface-500 dark:text-surface-400">
                    {o.archivedAt ? formatDate(o.archivedAt, 'ar') : '—'}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      type="button"
                      onClick={() => restore(o.id)}
                      className="btn-ghost text-xs"
                    >
                      <ArchiveRestore size={14} /> {t('archive.restore')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
