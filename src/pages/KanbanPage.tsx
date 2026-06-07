import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useOrderStore, ACTIVE_STATUSES } from '../features/orders/orderStore';
import { OrderCard } from '../components/OrderCard';
import { OrderDrawer } from '../components/OrderDrawer';
import { useToast } from '../utils/toast';
import { useNotifications } from '../utils/notifications';
import type { Order, OrderStatus } from '../types/order';

function ColumnHeader({ status, count }: { status: OrderStatus; count: number }) {
  const { t } = useI18n();
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-primary-500" />
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
          {t(`kanban.columns.${status}`)}
        </h2>
      </div>
      <span className="rounded-full bg-surface-200 px-2 py-0.5 text-[11px] font-semibold text-surface-700 dark:bg-surface-800 dark:text-surface-300">
        {count}
      </span>
    </div>
  );
}

function DroppableColumn({
  status,
  orders,
  onEdit,
}: {
  status: OrderStatus;
  orders: Order[];
  onEdit: (o: Order) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={[
        'flex h-full min-w-0 flex-col rounded-xl bg-surface-100/60 p-3 transition-colors dark:bg-surface-900/40',
        isOver ? 'ring-2 ring-primary-500/60 bg-primary-50/60 dark:bg-primary-900/20' : '',
      ].join(' ')}
    >
      <ColumnHeader status={status} count={orders.length} />
      <div className="space-y-3 overflow-y-auto pb-2">
        {orders.map((o) => (
          <DraggableOrder key={o.id} order={o} onEdit={onEdit} />
        ))}
        {orders.length === 0 && (
          <div className="py-8 text-center text-xs text-surface-400">—</div>
        )}
      </div>
    </div>
  );
}

function DraggableOrder({
  order,
  onEdit,
}: {
  order: Order;
  onEdit: (o: Order) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: order.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={['touch-none select-none', isDragging ? 'opacity-60' : ''].join(' ')}
    >
      <OrderCard order={order} draggable onEdit={onEdit} />
    </div>
  );
}

export function KanbanPage() {
  const { t } = useI18n();
  const orders = useOrderStore((s) => s.orders);
  const setStatus = useOrderStore((s) => s.setStatus);
  const toast = useToast();
  const notify = useNotifications();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const byStatus = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = { new: [], preparing: [], shipped: [], delivered: [] };
    for (const o of orders) {
      if (o.archivedAt) continue;
      if (ACTIVE_STATUSES.includes(o.status)) {
        map[o.status].push(o);
      }
    }
    return map;
  }, [orders]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as OrderStatus;
    if (!ACTIVE_STATUSES.includes(newStatus)) return;
    const order = orders.find((o) => o.id === active.id);
    if (!order) return;
    if (order.status !== newStatus) {
      setStatus(order.id, newStatus);
      toast.show(t('common.success'), 'success');
    }
  };

  const handleEdit = (o: Order) => {
    setDrawerOrder(o);
  };

  const handleQuickCreate = () => {
    setCreateOpen(true);
  };

  const handleCreated = (newOrder: Order) => {
    notify.notifyNewOrder(newOrder);
  };

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">{t('kanban.title')}</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">{t('kanban.subtitle')}</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {/* Desktop: vertical columns side-by-side. Mobile: horizontal snap-scroll */}
        <div className="hidden h-[calc(100vh-220px)] gap-3 md:flex">
          {(['new', 'preparing', 'shipped', 'delivered'] as OrderStatus[]).map((s) => (
            <DroppableColumn key={s} status={s} orders={byStatus[s]} onEdit={handleEdit} />
          ))}
        </div>
        <div className="md:hidden -mx-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory px-4 pb-3 flex gap-3 h-[calc(100vh-220px)]">
          {(['new', 'preparing', 'shipped', 'delivered'] as OrderStatus[]).map((s) => (
            <div key={s} className="snap-center shrink-0 w-[85vw] max-w-sm h-full">
              <DroppableColumn status={s} orders={byStatus[s]} onEdit={handleEdit} />
            </div>
          ))}
        </div>
      </DndContext>

      {/* Floating + button (mobile) */}
      <button
        type="button"
        onClick={handleQuickCreate}
        aria-label={t('common.newOrder')}
        className="md:hidden fixed bottom-6 right-6 z-30 grid size-14 place-items-center rounded-full bg-primary-500 text-white shadow-2xl shadow-primary-500/30 hover:bg-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-500/40"
      >
        <Plus size={24} />
      </button>

      <OrderDrawer order={drawerOrder} open={!!drawerOrder} onClose={() => setDrawerOrder(null)} />
      <OrderDrawer order={null} open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
    </section>
  );
}
