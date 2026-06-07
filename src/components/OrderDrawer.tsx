import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { Order, OrderItem, OrderAttachment, OrderStatus, OrderPriority } from '../types/order';
import { ORDER_STATUSES, ORDER_PRIORITIES } from '../types/order';
import { formatCurrency } from '../config/region';
import { useOrderStore } from '../features/orders/orderStore';
import { useToast } from '../utils/toast';
import { openWhatsApp } from '../utils/whatsapp';
import { MessageCircle } from 'lucide-react';

interface OrderDrawerProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onCreated?: (order: Order) => void;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function fileToAttachment(file: File): Promise<OrderAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ name: file.name, type: file.type, dataUrl: String(reader.result) });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function blankOrder(): Order {
  return {
    id: '',
    code: '',
    customerName: '',
    customerPhone: '',
    customerCity: 'طرابلس',
    items: [{ name: '', qty: 1, price: 0 }],
    total: 0,
    currency: 'LYD',
    status: 'new',
    priority: 'normal',
    notes: '',
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function OrderDrawer({ order, open, onClose, onCreated }: OrderDrawerProps) {
  const { t, dir } = useI18n();
  const update = useOrderStore((s) => s.updateOrder);
  const addOrder = useOrderStore((s) => s.addOrder);
  const toast = useToast();
  const [draft, setDraft] = useState<Order | null>(order);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNew = !order;

  useEffect(() => {
    if (open) {
      setDraft(order ? order : blankOrder());
    }
  }, [order, open]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const total = useMemo(() => {
    if (!draft) return 0;
    return draft.items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  }, [draft]);

  if (!open) return null;
  if (!draft) return null;

  const handleAddItem = () => {
    if (!draft) return;
    setDraft({ ...draft, items: [...draft.items, { name: '', qty: 1, price: 0 }] });
  };

  const handleRemoveItem = (idx: number) => {
    if (!draft) return;
    setDraft({ ...draft, items: draft.items.filter((_, i) => i !== idx) });
  };

  const handleItemChange = (idx: number, patch: Partial<OrderItem>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      items: draft.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !draft) return;
    const incoming = Array.from(files);
    const remainingSlots = MAX_FILES - draft.attachments.length;
    if (remainingSlots <= 0) {
      toast.show(t('common.error') + ` (max ${MAX_FILES})`, 'error');
      return;
    }
    const accepted: OrderAttachment[] = [];
    for (const f of incoming.slice(0, remainingSlots)) {
      if (f.size > MAX_FILE_SIZE) {
        toast.show(`${f.name}: > 2MB`, 'error');
        continue;
      }
      try {
        accepted.push(await fileToAttachment(f));
      } catch {
        toast.show(`${f.name}: read error`, 'error');
      }
    }
    if (accepted.length > 0) {
      setDraft({ ...draft, attachments: [...draft.attachments, ...accepted] });
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    if (!draft) return;
    setDraft({ ...draft, attachments: draft.attachments.filter((_, i) => i !== idx) });
  };

  const handleSave = () => {
    if (!draft) return;
    if (!draft.customerName.trim() || !draft.customerPhone.trim()) {
      toast.show(t('common.error'), 'error');
      return;
    }
    const cleanedItems = draft.items.filter((it) => it.name.trim().length > 0);
    if (cleanedItems.length === 0) {
      toast.show(t('common.error'), 'error');
      return;
    }
    const payload = {
      ...draft,
      items: cleanedItems,
      total: cleanedItems.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0),
    };
    if (isNew) {
      const created = addOrder({
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerCity: payload.customerCity,
        items: payload.items,
        status: payload.status,
        priority: payload.priority,
        notes: payload.notes,
        attachments: payload.attachments,
      });
      toast.show(t('order.created'), 'success');
      onCreated?.(created);
    } else {
      update(order.id, payload);
      toast.show(t('order.saved'), 'success');
    }
    onClose();
  };

  const handleWhatsApp = () => {
    if (!draft) return;
    openWhatsApp({ ...draft, total } as Order, t('order.whatsappMessage'));
  };

  // Use draft as d
  const d = draft;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? t('common.newOrder') : d.code}
        dir={dir}
        className={[
          'fixed inset-y-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl transition-transform dark:bg-surface-900',
          dir === 'rtl' ? 'start-0' : 'end-0',
          open ? 'translate-x-0' : dir === 'rtl' ? '-translate-x-full' : 'translate-x-full',
        ].join(' ')}
      >
        <header className="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-700">
          <div>
            <div className="text-xs font-mono text-surface-500 dark:text-surface-400">
              {isNew ? t('common.newOrder') : d.code}
            </div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
              {isNew ? t('common.quickCreate') : d.customerName || '—'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              {t('order.customer')}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-surface-500">{t('order.customer')}</span>
                <input
                  type="text"
                  value={d.customerName}
                  onChange={(e) => setDraft({ ...d, customerName: e.target.value })}
                  className="input"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-surface-500">{t('order.phone')}</span>
                <input
                  type="tel"
                  dir="ltr"
                  value={d.customerPhone}
                  onChange={(e) => setDraft({ ...d, customerPhone: e.target.value })}
                  className="input"
                  placeholder="+218 91 234 5678"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-xs text-surface-500">{t('order.city')}</span>
                <input
                  type="text"
                  value={d.customerCity}
                  onChange={(e) => setDraft({ ...d, customerCity: e.target.value })}
                  className="input"
                />
              </label>
            </div>
          </section>

          <section className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                {t('order.items')}
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 rounded-full border border-surface-200 px-2.5 py-1 text-xs text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
              >
                <Plus size={12} /> {t('order.addItem')}
              </button>
            </div>
            <div className="space-y-2">
              {d.items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 rounded-lg border border-surface-200 p-2 dark:border-surface-700"
                >
                  <input
                    type="text"
                    value={it.name}
                    onChange={(e) => handleItemChange(idx, { name: e.target.value })}
                    placeholder={t('order.itemName')}
                    className="input col-span-6"
                  />
                  <input
                    type="number"
                    min="0"
                    value={it.qty}
                    onChange={(e) => handleItemChange(idx, { qty: Number(e.target.value) })}
                    placeholder={t('order.qty')}
                    className="input col-span-2"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={it.price}
                    onChange={(e) => handleItemChange(idx, { price: Number(e.target.value) })}
                    placeholder={t('order.price')}
                    className="input col-span-3"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    aria-label={t('common.delete')}
                    className="col-span-1 inline-flex items-center justify-center rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-surface-500">{t('order.total')}</span>
              <span className="text-primary-700 dark:text-primary-300">{formatCurrency(total)}</span>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-surface-500">{t('order.status')}</span>
              <select
                value={d.status}
                onChange={(e) => setDraft({ ...d, status: e.target.value as OrderStatus })}
                className="input"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-surface-500">{t('order.priority')}</span>
              <select
                value={d.priority}
                onChange={(e) => setDraft({ ...d, priority: e.target.value as OrderPriority })}
                className="input"
              >
                {ORDER_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {t(`priority.${p}`)}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="mt-6">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-surface-500">{t('order.notes')}</span>
              <textarea
                value={d.notes ?? ''}
                onChange={(e) => setDraft({ ...d, notes: e.target.value })}
                rows={3}
                className="input"
              />
            </label>
          </section>

          <section className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                {t('order.attachments')} ({d.attachments.length}/{MAX_FILES})
              </h3>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={d.attachments.length >= MAX_FILES}
                className="inline-flex items-center gap-1 rounded-full border border-surface-200 px-2.5 py-1 text-xs text-surface-700 hover:bg-surface-100 disabled:opacity-50 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
              >
                <Upload size={12} /> {t('order.attachments')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
            {d.attachments.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {d.attachments.map((a, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-surface-200 dark:border-surface-700"
                  >
                    {a.type.startsWith('image/') ? (
                      <img src={a.dataUrl} alt={a.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface-100 text-xs text-surface-500 dark:bg-surface-800">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      aria-label={t('common.delete')}
                      className="absolute end-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-surface-400">—</p>
            )}
          </section>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-surface-200 px-5 py-3 dark:border-surface-700">
          {!isNew && (
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              <MessageCircle size={14} /> WhatsApp
            </button>
          )}
          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline text-sm"
            >
              {t('common.cancel')}
            </button>
            <button type="button" onClick={handleSave} className="btn-primary text-sm">
              {t('order.save')}
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
