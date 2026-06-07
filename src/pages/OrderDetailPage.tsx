import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { useOrderStore, ACTIVE_STATUSES } from '../features/orders/orderStore';
import { formatCurrency, formatDate } from '../config/region';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { ORDER_STATUSES } from '../types/order';
import { relativeTime } from '../utils/time';
import { ArrowRight, Save, Trash2, Archive, ArchiveRestore, Pencil } from 'lucide-react';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, dir } = useI18n();
  const order = useOrderStore((s) => (id ? s.orders.find((o) => o.id === id) : undefined));
  const setStatus = useOrderStore((s) => s.setStatus);
  const update = useOrderStore((s) => s.updateOrder);
  const remove = useOrderStore((s) => s.deleteOrder);
  const archive = useOrderStore((s) => s.archive);
  const restore = useOrderStore((s) => s.restore);

  const [editing, setEditing] = useState(false);
  const [draftNotes, setDraftNotes] = useState(order?.notes ?? '');

  const items = useMemo(() => order?.items ?? [], [order]);

  if (!order) {
    return (
      <section className="card text-center py-12">
        <p className="text-sm text-surface-500 dark:text-surface-400">{t('common.noData')}</p>
        <Link
          to="/list"
          className="btn-outline mt-4 inline-flex"
        >
          {t('common.back')}
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="btn-ghost text-sm"
      >
        <ArrowRight size={16} className={dir === 'rtl' ? '' : 'rotate-180'} />
        {t('common.back')}
      </button>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-surface-500 dark:text-surface-400">
              {order.code}
            </div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50 mt-1">
              {order.customerName}
            </h1>
            <div className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              {order.customerCity} · <span dir="ltr">{order.customerPhone}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={order.status} />
              <PriorityBadge priority={order.priority} />
            </div>
          </div>
          <div className="text-end">
            <div className="text-xs text-surface-500 dark:text-surface-400">
              {t('order.total')}
            </div>
            <div className="text-2xl font-bold text-primary-700 dark:text-primary-300">
              {formatCurrency(order.total)}
            </div>
            <div className="text-xs text-surface-400 mt-1">
              {t('order.createdAt')}: {formatDate(order.createdAt, 'ar')}
            </div>
            <div className="text-xs text-surface-400">
              {t('order.updatedAt')}: {relativeTime(order.updatedAt, 'ar')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3">
            {t('order.status')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(order.id, s)}
                className={[
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  s === order.status
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                    : 'border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800',
                ].join(' ')}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>
          {!ACTIVE_STATUSES.includes(order.status) && null}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
              {t('order.notes')}
            </h2>
            {!editing ? (
              <button
                type="button"
                onClick={() => {
                  setDraftNotes(order.notes ?? '');
                  setEditing(true);
                }}
                className="btn-ghost text-xs"
              >
                <Pencil size={12} /> {t('common.edit')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  update(order.id, { notes: draftNotes });
                  setEditing(false);
                }}
                className="btn-primary text-xs"
              >
                <Save size={12} /> {t('common.save')}
              </button>
            )}
          </div>
          {editing ? (
            <textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              rows={4}
              className="input"
              placeholder="—"
            />
          ) : (
            <p className="text-sm text-surface-600 dark:text-surface-300 whitespace-pre-wrap">
              {order.notes || '—'}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3">
          {t('order.items')}
        </h2>
        <ul className="divide-y divide-surface-100 dark:divide-surface-800">
          {items.map((it, idx) => (
            <li key={idx} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium text-surface-900 dark:text-surface-50">{it.name}</div>
                <div className="text-xs text-surface-500 dark:text-surface-400">
                  {it.qty} × {formatCurrency(it.price)}
                </div>
              </div>
              <div className="font-semibold">{formatCurrency(it.qty * it.price)}</div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-surface-500 dark:text-surface-400">{t('order.total')}</span>
          <span className="font-semibold text-primary-700 dark:text-primary-300">
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        {order.archivedAt ? (
          <button
            type="button"
            onClick={() => restore(order.id)}
            className="btn-outline"
          >
            <ArchiveRestore size={14} /> {t('archive.restore')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => archive(order.id)}
            className="btn-outline"
          >
            <Archive size={14} /> {t('nav.archive')}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (confirm('حذف الطلب نهائيًا؟')) {
              remove(order.id);
              navigate('/list');
            }
          }}
          className="btn-ghost text-rose-600 dark:text-rose-400"
        >
          <Trash2 size={14} /> {t('common.delete')}
        </button>
      </div>
    </section>
  );
}
