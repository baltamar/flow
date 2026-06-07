import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useOrderStore, ACTIVE_STATUSES } from '../features/orders/orderStore';
import { formatCurrency } from '../config/region';
import { TrendingUp, Package, Wallet, Truck, BarChart3, PieChart as PieIcon, MapPin, Star } from 'lucide-react';
import type { OrderStatus } from '../types/order';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: '#3b82f6',
  preparing: '#f59e0b',
  shipped: '#8b5cf6',
  delivered: '#10b981',
};

const tooltipContentStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.92)',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: 8,
  color: '#f8fafc',
  fontSize: 12,
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; color?: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={tooltipContentStyle} className="px-3 py-2 shadow-lg">
      {label && <div className="text-[10px] text-slate-400">{label}</div>}
      {payload.map((p, idx) => (
        <div key={idx} className="font-medium">
          {p.name ? `${p.name}: ` : ''}
          <span className="text-emerald-300">
            {typeof p.value === 'number' ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  const { t } = useI18n();
  const orders = useOrderStore((s) => s.orders);

  const active = useMemo(() => orders.filter((o) => !o.archivedAt), [orders]);

  const totals = useMemo(() => {
    const total = active.length;
    const revenue = active.reduce((acc, o) => acc + o.total, 0);
    const avg = total === 0 ? 0 : revenue / total;
    const deliveredCount = active.filter((o) => o.status === 'delivered').length;
    const deliveredPct = total === 0 ? 0 : (deliveredCount / total) * 100;
    return { total, revenue, avg, deliveredPct };
  }, [active]);

  const byStatusData = useMemo(() => {
    const m: Record<OrderStatus, number> = { new: 0, preparing: 0, shipped: 0, delivered: 0 };
    for (const o of active) m[o.status] += 1;
    return ACTIVE_STATUSES.map((s) => ({
      name: t(`status.${s}`),
      key: s,
      value: m[s],
      color: STATUS_COLORS[s],
    }));
  }, [active, t]);

  const byCityData = useMemo(() => {
    const m = new Map<string, { count: number; revenue: number }>();
    for (const o of active) {
      const cur = m.get(o.customerCity) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += o.total;
      m.set(o.customerCity, cur);
    }
    return Array.from(m.entries())
      .map(([city, v]) => ({ city, count: v.count, revenue: v.revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [active]);

  const topProducts = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of active) {
      for (const it of o.items) {
        m.set(it.name, (m.get(it.name) ?? 0) + (Number(it.qty) || 0));
      }
    }
    return Array.from(m.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [active]);

  const revenueByDay = useMemo(() => {
    const days: { date: string; revenue: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayRevenue = active
        .filter((o) => o.createdAt.slice(0, 10) === key)
        .reduce((s, o) => s + o.total, 0);
      days.push({
        date: d.toLocaleDateString('ar-LY', { month: 'short', day: '2-digit' }),
        revenue: dayRevenue,
      });
    }
    return days;
  }, [active]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          {t('analytics.title')}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {t('analytics.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package size={18} />}
          label={t('analytics.totalOrders')}
          value={String(totals.total)}
        />
        <StatCard
          icon={<Wallet size={18} />}
          label={t('analytics.totalRevenue')}
          value={formatCurrency(totals.revenue)}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label={t('analytics.avgOrder')}
          value={formatCurrency(totals.avg)}
        />
        <StatCard
          icon={<Truck size={18} />}
          label={t('analytics.deliveredPct')}
          value={`${totals.deliveredPct.toFixed(0)}٪`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
            <PieIcon size={16} /> {t('analytics.byStatus')}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {byStatusData.map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
            <BarChart3 size={16} /> {t('analytics.revenueByDay')}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="currentColor" className="text-surface-200 dark:text-surface-700" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-surface-500" />
                <YAxis tick={{ fontSize: 10 }} className="text-surface-500" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
            <Star size={16} /> {t('analytics.topProducts')}
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-center text-sm text-surface-400 py-6">{t('common.noData')}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-700" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} className="text-surface-500" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-surface-500" width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="qty" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
            <MapPin size={16} /> {t('analytics.byCity')}
          </h2>
          {byCityData.length === 0 ? (
            <p className="text-center text-sm text-surface-400 py-6">{t('common.noData')}</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-700" vertical={false} />
                  <XAxis dataKey="city" tick={{ fontSize: 10 }} className="text-surface-500" />
                  <YAxis tick={{ fontSize: 10 }} className="text-surface-500" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card flex items-center gap-3">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-surface-500 dark:text-surface-400 truncate">{label}</div>
        <div className="text-base sm:text-lg font-semibold text-surface-900 dark:text-surface-50 truncate">
          {value}
        </div>
      </div>
    </div>
  );
}
