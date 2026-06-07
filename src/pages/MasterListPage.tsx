import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileSpreadsheet, Archive, Truck, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useOrderStore } from '../features/orders/orderStore';
import { formatCurrency, formatDate } from '../config/region';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { exportOrdersToExcel } from '../utils/excelExport';
import { useToast } from '../utils/toast';
import type { Order, OrderStatus, OrderPriority } from '../types/order';
import { ORDER_STATUSES, ORDER_PRIORITIES } from '../types/order';

type SortKey = 'createdAt' | 'priority' | 'customerName' | 'total';
type SortDir = 'asc' | 'desc';

const PRIORITY_RANK: Record<OrderPriority, number> = { urgent: 4, high: 3, normal: 2, low: 1 };

function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function MasterListPage() {
  const { t, dir, language } = useI18n();
  const orders = useOrderStore((s) => s.orders);
  const setStatus = useOrderStore((s) => s.setStatus);
  const archive = useOrderStore((s) => s.archive);
  const navigate = useNavigate();
  const toast = useToast();

  const [q, setQ] = useState('');
  const debouncedQ = useDebounced(q, 250);
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<OrderPriority[]>([]);
  const [cityFilter, setCityFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const cities = useMemo(() => {
    const set = new Set(orders.map((o) => o.customerCity).filter(Boolean));
    return Array.from(set).sort();
  }, [orders]);

  const rows = useMemo(() => {
    let result = orders.filter((o) => !o.archivedAt);

    if (debouncedQ.trim()) {
      const needle = debouncedQ.toLowerCase();
      result = result.filter(
        (o) =>
          o.code.toLowerCase().includes(needle) ||
          o.customerName.toLowerCase().includes(needle) ||
          o.customerCity.toLowerCase().includes(needle) ||
          o.customerPhone.includes(needle),
      );
    }
    if (statusFilter.length > 0) {
      result = result.filter((o) => statusFilter.includes(o.status));
    }
    if (priorityFilter.length > 0) {
      result = result.filter((o) => priorityFilter.includes(o.priority));
    }
    if (cityFilter) {
      result = result.filter((o) => o.customerCity === cityFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter((o) => new Date(o.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000;
      result = result.filter((o) => new Date(o.createdAt).getTime() <= to);
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === 'priority') {
        cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      } else if (sortKey === 'customerName') {
        cmp = a.customerName.localeCompare(b.customerName, language);
      } else if (sortKey === 'total') {
        cmp = a.total - b.total;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [orders, debouncedQ, statusFilter, priorityFilter, cityFilter, dateFrom, dateTo, sortKey, sortDir, language]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((o) => o.id)));
    }
  };

  const selectedOrders: Order[] = useMemo(
    () => orders.filter((o) => selected.has(o.id)),
    [orders, selected],
  );

  const handleBulkShipped = () => {
    selectedOrders.forEach((o) => setStatus(o.id, 'shipped'));
    toast.show(t('common.success'), 'success');
    setSelected(new Set());
  };

  const handleBulkArchive = () => {
    selectedOrders.forEach((o) => archive(o.id));
    toast.show(t('common.success'), 'success');
    setSelected(new Set());
  };

  const handleBulkExport = () => {
    const filename = `flow-orders-${new Date().toISOString().slice(0, 10)}.xlsx`;
    exportOrdersToExcel(selectedOrders, t, filename);
    toast.show(t('list.exportSuccess', { count: selectedOrders.length }), 'success');
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setPriorityFilter([]);
    setCityFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const hasActiveFilters =
    statusFilter.length > 0 || priorityFilter.length > 0 || cityFilter !== '' || dateFrom !== '' || dateTo !== '';

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">{t('list.title')}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">{t('list.subtitle')}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute top-1/2 -translate-y-1/2 text-surface-400"
            style={dir === 'rtl' ? { right: 10 } : { left: 10 }}
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('common.search')}
            className="input pe-9 ps-9"
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="flex items-center gap-1 text-xs text-surface-500">
          <span>{t('list.filters.status')}:</span>
          <div className="flex flex-wrap gap-1">
            {ORDER_STATUSES.map((s) => {
              const active = statusFilter.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setStatusFilter((prev) => (active ? prev.filter((x) => x !== s) : [...prev, s]))
                  }
                  className={[
                    'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                    active
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                      : 'border-surface-200 text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800',
                  ].join(' ')}
                >
                  {t(`status.${s}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-surface-500">
          <span>{t('list.filters.priority')}:</span>
          <div className="flex flex-wrap gap-1">
            {ORDER_PRIORITIES.map((p) => {
              const active = priorityFilter.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setPriorityFilter((prev) => (active ? prev.filter((x) => x !== p) : [...prev, p]))
                  }
                  className={[
                    'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                    active
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
                      : 'border-surface-200 text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800',
                  ].join(' ')}
                >
                  {t(`priority.${p}`)}
                </button>
              );
            })}
          </div>
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="input h-8 py-0 text-xs"
        >
          <option value="">{t('list.filters.city')}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label={t('list.filters.dateFrom')}
          className="input h-8 py-0 text-xs"
          style={{ colorScheme: 'light dark' }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label={t('list.filters.dateTo')}
          className="input h-8 py-0 text-xs"
          style={{ colorScheme: 'light dark' }}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-full border border-surface-200 px-2 py-0.5 text-[11px] text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
          >
            <X size={12} /> {t('common.cancel')}
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm shadow-sm dark:border-primary-700 dark:bg-primary-900/30">
          <span className="font-medium text-primary-900 dark:text-primary-100">
            {t('list.selected', { count: selected.size })}
          </span>
          <div className="ms-auto flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={handleBulkShipped}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 hover:bg-primary-100 dark:bg-surface-800 dark:text-primary-200 dark:ring-primary-700"
            >
              <Truck size={12} /> {t('list.bulk.markShipped')}
            </button>
            <button
              type="button"
              onClick={handleBulkArchive}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200 hover:bg-primary-100 dark:bg-surface-800 dark:text-primary-200 dark:ring-primary-700"
            >
              <Archive size={12} /> {t('list.bulk.archive')}
            </button>
            <button
              type="button"
              onClick={handleBulkExport}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              <FileSpreadsheet size={12} /> {t('list.bulk.exportXlsx')}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-800/50 text-surface-600 dark:text-surface-300">
              <th className="px-3 py-3 w-8">
                <input
                  type="checkbox"
                  aria-label={t('list.selectAll')}
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={toggleSelectAll}
                  className="size-4 accent-primary-500"
                />
              </th>
              <th className="text-start font-medium px-3 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort('customerName')}
                  className="inline-flex items-center gap-1 hover:text-primary-600"
                >
                  {t('list.code')}
                </button>
              </th>
              <th className="text-start font-medium px-3 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort('customerName')}
                  className="inline-flex items-center gap-1 hover:text-primary-600"
                >
                  {t('list.customer')} <SortIcon k="customerName" />
                </button>
              </th>
              <th className="text-start font-medium px-3 py-3 hidden md:table-cell">{t('list.city')}</th>
              <th className="text-start font-medium px-3 py-3 hidden md:table-cell" dir="ltr">
                {t('list.phone')}
              </th>
              <th className="text-start font-medium px-3 py-3">{t('list.status')}</th>
              <th className="text-start font-medium px-3 py-3 hidden sm:table-cell">
                <button
                  type="button"
                  onClick={() => toggleSort('priority')}
                  className="inline-flex items-center gap-1 hover:text-primary-600"
                >
                  {t('list.priority')} <SortIcon k="priority" />
                </button>
              </th>
              <th className="text-end font-medium px-3 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort('total')}
                  className="inline-flex items-center gap-1 hover:text-primary-600"
                >
                  {t('list.total')} <SortIcon k="total" />
                </button>
              </th>
              <th className="text-start font-medium px-3 py-3 hidden lg:table-cell">
                <button
                  type="button"
                  onClick={() => toggleSort('createdAt')}
                  className="inline-flex items-center gap-1 hover:text-primary-600"
                >
                  {t('list.createdAt')} <SortIcon k="createdAt" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const isSelected = selected.has(o.id);
              return (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className={[
                    'border-t border-surface-100 dark:border-surface-800 cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-primary-50/60 dark:bg-primary-900/20'
                      : 'hover:bg-surface-50 dark:hover:bg-surface-800/40',
                  ].join(' ')}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(o.id)}
                      aria-label={o.code}
                      className="size-4 accent-primary-500"
                    />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{o.code}</td>
                  <td className="px-3 py-3 font-medium text-surface-900 dark:text-surface-50">
                    {o.customerName}
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell text-surface-600 dark:text-surface-300">
                    {o.customerCity}
                  </td>
                  <td
                    className="px-3 py-3 hidden md:table-cell text-surface-500 dark:text-surface-400"
                    dir="ltr"
                  >
                    {o.customerPhone}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <PriorityBadge priority={o.priority} />
                  </td>
                  <td className="px-3 py-3 text-end font-semibold text-primary-700 dark:text-primary-300">
                    {formatCurrency(o.total)}
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell text-surface-500 dark:text-surface-400">
                    {formatDate(o.createdAt, language)}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-surface-400">
                  {t('common.noData')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
