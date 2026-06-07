import { useI18n } from '../i18n/I18nContext';
import type { OrderStatus, OrderPriority } from '../types/order';

interface StatusBadgeProps {
  status: OrderStatus;
}

const statusStyles: Record<OrderStatus, string> = {
  new: 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200',
  preparing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useI18n();
  return (
    <span className={`badge ${statusStyles[status]}`}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {t(`status.${status}`)}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: OrderPriority;
}

const priorityStyles: Record<OrderPriority, string> = {
  low: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300',
  normal: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  urgent: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { t } = useI18n();
  return (
    <span className={`badge ${priorityStyles[priority]}`}>
      {t(`priority.${priority}`)}
    </span>
  );
}
