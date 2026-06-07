import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, MessageCircle, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { formatCurrency } from '../config/region';
import type { Order } from '../types/order';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { useOrderStore } from '../features/orders/orderStore';
import { openWhatsApp } from '../utils/whatsapp';
import { useToast } from '../utils/toast';

interface OrderCardProps {
  order: Order;
  draggable?: boolean;
  onEdit?: (order: Order) => void;
  defaultExpanded?: boolean;
}

export function OrderCard({ order, draggable = false, onEdit, defaultExpanded = false }: OrderCardProps) {
  const { t, dir } = useI18n();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const archive = useOrderStore((s) => s.archive);
  const restore = useOrderStore((s) => s.restore);
  const remove = useOrderStore((s) => s.deleteOrder);
  const toast = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>(defaultExpanded ? '1000px' : '0px');

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(expanded ? `${contentRef.current.scrollHeight + 8}px` : '0px');
    }
  }, [expanded, order.items.length, order.notes, order.attachments.length]);

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    archive(order.id);
    toast.show(t('common.success'), 'success');
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    restore(order.id);
    toast.show(t('common.success'), 'success');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm(t('common.confirm') + '?')) {
      remove(order.id);
      toast.show(t('common.success'), 'success');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit?.(order);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const template = t('order.whatsappMessage');
    openWhatsApp(order, template);
  };

  return (
    <div
      className="card hover:shadow-elevated hover:border-primary-300 dark:hover:border-primary-700
        transition-all group focus-within:ring-2 focus-within:ring-primary-500"
      dir={dir}
      draggable={draggable}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-2 text-start"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-surface-500 dark:text-surface-400">{order.code}</span>
            <PriorityBadge priority={order.priority} />
          </div>
          <div className="mt-1 font-medium text-surface-900 dark:text-surface-50 truncate">
            {order.customerName}
          </div>
          <div className="mt-0.5 text-[11px] text-surface-500 dark:text-surface-400">
            {order.customerCity} · <span dir="ltr">{order.customerPhone}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-semibold text-primary-700 dark:text-primary-300 text-sm whitespace-nowrap">
            {formatCurrency(order.total)}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <ChevronDown
          size={16}
          className={[
            'mt-1 text-surface-400 transition-transform',
            expanded ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      <div
        ref={contentRef}
        style={{ maxHeight }}
        className="overflow-hidden transition-[max-height] duration-200 ease-out"
      >
        <div className="mt-3 border-t border-surface-100 pt-3 dark:border-surface-800">
          {order.items.length > 0 && (
            <ul className="space-y-1 text-xs">
              {order.items.map((it, idx) => (
                <li key={idx} className="flex justify-between text-surface-600 dark:text-surface-300">
                  <span className="truncate">{it.name}</span>
                  <span className="ms-2 font-mono">
                    {it.qty}× {formatCurrency(it.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {order.notes && (
            <p className="mt-2 text-xs text-surface-500 dark:text-surface-400 line-clamp-3">
              {order.notes}
            </p>
          )}

          {order.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {order.attachments.slice(0, 4).map((a, idx) =>
                a.type.startsWith('image/') ? (
                  <img
                    key={idx}
                    src={a.dataUrl}
                    alt={a.name}
                    className="size-10 rounded object-cover ring-1 ring-surface-200 dark:ring-surface-700"
                  />
                ) : (
                  <span
                    key={idx}
                    className="rounded bg-surface-100 px-2 py-1 text-[10px] text-surface-600 dark:bg-surface-800 dark:text-surface-300"
                  >
                    📎 {a.name}
                  </span>
                ),
              )}
              {order.attachments.length > 4 && (
                <span className="rounded bg-surface-100 px-2 py-1 text-[10px] text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                  +{order.attachments.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={handleWhatsApp}
              title={t('order.whatsappTooltip')}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <MessageCircle size={12} /> WhatsApp
            </button>
            <button
              type="button"
              onClick={handleEdit}
              title={t('common.edit')}
              className="inline-flex items-center gap-1 rounded-full border border-surface-200 px-2.5 py-1 text-[11px] font-medium text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
            >
              <Pencil size={12} /> {t('common.edit')}
            </button>
            {order.archivedAt ? (
              <button
                type="button"
                onClick={handleRestore}
                title={t('common.restore')}
                className="inline-flex items-center gap-1 rounded-full border border-surface-200 px-2.5 py-1 text-[11px] font-medium text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
              >
                <ArchiveRestore size={12} /> {t('common.restore')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleArchive}
                title={t('common.archive')}
                className="inline-flex items-center gap-1 rounded-full border border-surface-200 px-2.5 py-1 text-[11px] font-medium text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
              >
                <Archive size={12} /> {t('common.archive')}
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              title={t('common.delete')}
              className="ms-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30"
            >
              <Trash2 size={12} />
            </button>
            <Link
              to={`/orders/${order.id}`}
              className="inline-flex items-center gap-1 text-[11px] text-primary-600 hover:underline dark:text-primary-300"
            >
              ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
