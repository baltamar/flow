import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { Order } from '../types/order';
import { formatCurrency } from '../config/region';

export type NotificationKind = 'order-created' | 'order-status-changed' | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  orderId?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  push: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
  clear: () => void;
  permissionState: NotificationPermission | 'unsupported';
  requestBrowserPermission: () => Promise<NotificationPermission>;
  notifyNewOrder: (order: Order) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const STORAGE_KEY = 'flow.notifications.v1';
const BROWSER_KEY = 'flow.browserNotifications.enabled';
const CHANNEL_NAME = 'flow-orders';

function safeBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(CHANNEL_NAME);
}

function loadStored(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStored(list: AppNotification[]) {
  if (typeof window === 'undefined') return;
  // cap to last 50 to avoid localStorage bloat
  const trimmed = list.slice(-50);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadStored());
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(
    () => {
      if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
      return Notification.permission;
    },
  );

  // Persist
  useEffect(() => {
    saveStored(notifications);
  }, [notifications]);

  // Subscribe to other tabs
  useEffect(() => {
    const channel = safeBroadcastChannel();
    if (!channel) return;
    const handler = (event: MessageEvent<{ type: string; notification?: AppNotification }>) => {
      if (event.data?.type === 'notification' && event.data.notification) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === event.data.notification!.id)) return prev;
          return [...prev, event.data.notification!];
        });
      }
    };
    channel.addEventListener('message', handler);
    return () => {
      channel.removeEventListener('message', handler);
      channel.close();
    };
  }, []);

  const push: NotificationContextValue['push'] = useCallback((n) => {
    const full: AppNotification = {
      ...n,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => {
      if (prev.some((existing) => existing.id === full.id)) return prev;
      return [...prev, full];
    });
    // Broadcast to other tabs
    const channel = safeBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: 'notification', notification: full });
      channel.close();
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied' as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermissionState(result);
    if (result === 'granted') {
      window.localStorage.setItem(BROWSER_KEY, '1');
    }
    return result;
  }, []);

  const notifyNewOrder = useCallback(
    (order: Order) => {
      const title = t('notifications.newOrderTitle');
      const body = t('notifications.newOrderBody', {
        code: order.code,
        name: order.customerName,
        total: formatCurrency(order.total),
      });
      push({ kind: 'order-created', title, body, orderId: order.id });
      // Browser notification if user opted in
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        window.localStorage.getItem(BROWSER_KEY) === '1'
      ) {
        try {
          const n = new Notification(title, {
            body,
            icon: '/favicon.svg',
            tag: `flow-order-${order.id}`,
          });
          n.onclick = () => {
            window.focus();
            window.location.hash = `#/orders/${order.id}`;
            n.close();
          };
        } catch {
          // ignore - some browsers throw in iframes
        }
      }
    },
    [push, t],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      push,
      markAllRead,
      clear,
      permissionState,
      requestBrowserPermission,
      notifyNewOrder,
    }),
    [notifications, push, markAllRead, clear, permissionState, requestBrowserPermission, notifyNewOrder],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    // Defensive fallback
    return {
      notifications: [],
      unreadCount: 0,
      push: () => {},
      markAllRead: () => {},
      clear: () => {},
      permissionState: 'unsupported',
      requestBrowserPermission: async () => 'denied',
      notifyNewOrder: () => {},
    };
  }
  return ctx;
}
