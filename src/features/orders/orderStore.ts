import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Order, OrderStatus, OrderPriority } from '../../types/order';

const STORAGE_KEY = 'flow.orders.v1';

interface NewOrderInput {
  customerName: string;
  customerPhone: string;
  customerCity: string;
  items: Order['items'];
  status?: OrderStatus;
  priority?: OrderPriority;
  notes?: string;
  attachments?: Order['attachments'];
}

interface OrderStore {
  orders: Order[];
  hydrated: boolean;
  setHydrated: () => void;
  getOrder: (id: string) => Order | undefined;
  addOrder: (input: NewOrderInput) => Order;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  setStatus: (id: string, status: OrderStatus) => void;
  archive: (id: string) => void;
  restore: (id: string) => void;
  resetSeed: () => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

function generateCode(seq: number): string {
  // FLW-YYMMDD-NNNN
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `FLW-${yy}${mm}${dd}-${String(seq).padStart(4, '0')}`;
}

function buildSeedOrders(): Order[] {
  const cities = ['طرابلس', 'بنغازي', 'مصراتة', 'الزاوية', 'سبها', 'زليتن', 'البيضاء', 'أجدابيا', 'طبرق', 'درنة'];
  const latinNames = [
    'Yousef Al-Mabrouk', 'Fatima Al-Zintani', 'Khaled Ben Othman', 'Mariam Al-Gharbi',
    'Ahmed Al-Tajouri', 'Salma Al-Fitouri', 'Ibrahim Al-Mahjoub', 'Aisha Bouzid',
    'Hassan Al-Senussi', 'Nada Al-Farjani', 'Tariq Al-Shaibi', 'Hala Al-Mansouri',
  ];
  const arabicNames = [
    'يوسف المبروك', 'فاطمة الزنتاني', 'خالد بن عثمان', 'مريم الغربي',
    'أحمد التاجوري', 'سلمى الفيتوري', 'إبراهيم المحجوب', 'عائشة بوزيد',
    'حسن السنوسي', 'نادة الفرجاني', 'طارق الشيبي', 'هالة المنصوري',
  ];
  const itemsPool: { name: string; qty: number; price: number }[] = [
    { name: 'شاي ليبي × 2', qty: 2, price: 4.5 },
    { name: 'قهوة عربية 250غ', qty: 1, price: 18.0 },
    { name: 'تمر دعقسي 1كغ', qty: 1, price: 28.0 },
    { name: 'زيت زيتون 1ل', qty: 2, price: 45.0 },
    { name: 'صابون بلدي × 6', qty: 1, price: 12.0 },
    { name: 'عطر بخور عربي', qty: 1, price: 35.0 },
    { name: 'بسيسة 500غ', qty: 3, price: 6.0 },
    { name: 'كسكس ليبي 1كغ', qty: 1, price: 9.0 },
    { name: 'شاورما دجاج', qty: 4, price: 8.0 },
    { name: 'معجون طماطم × 3', qty: 2, price: 4.0 },
    { name: 'شيبس بطاطا', qty: 5, price: 2.5 },
    { name: 'حليب بودرة 400غ', qty: 1, price: 14.0 },
  ];
  const statuses: OrderStatus[] = ['new', 'preparing', 'shipped', 'delivered'];
  const priorities: OrderPriority[] = ['low', 'normal', 'high', 'urgent'];
  const baseTime = Date.now();

  return Array.from({ length: 20 }, (_, i) => {
    const idx = i % latinNames.length;
    const arabicName = arabicNames[idx] ?? 'عميل';
    const latinName = latinNames[idx] ?? 'Customer';
    const city = cities[i % 3]; // only Tripoli, Benghazi, Misrata per spec
    const phoneTail = String(910000000 + i * 1234).slice(0, 9);
    const items = [itemsPool[i % itemsPool.length], itemsPool[(i + 3) % itemsPool.length]];
    const total = items.reduce((acc, it) => acc + it.qty * it.price, 0);
    const status = statuses[i % statuses.length];
    const priority = priorities[(i + (status === 'new' ? 1 : 0)) % priorities.length];
    const created = new Date(baseTime - i * 3600_000).toISOString();
    const updated = new Date(baseTime - i * 600_000).toISOString();
    return {
      id: `ord_seed_${String(i + 1).padStart(4, '0')}`,
      code: generateCode(i + 1),
      customerName: `${arabicName} / ${latinName}`,
      customerPhone: `+218${phoneTail}`,
      customerCity: city,
      items,
      total,
      currency: 'LYD',
      status,
      priority,
      notes: i % 4 === 0 ? 'العميل يطلب الاتصال قبل التوصيل' : undefined,
      attachments: [],
      createdAt: created,
      updatedAt: updated,
    } satisfies Order;
  });
}

const initialOrders = buildSeedOrders();

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: initialOrders,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      getOrder: (id) => get().orders.find((o) => o.id === id),
      addOrder: (input) => {
        const seq = get().orders.length + 1;
        const order: Order = {
          id: `ord_${Date.now()}`,
          code: generateCode(seq),
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerCity: input.customerCity,
          items: input.items,
          total: input.items.reduce((acc, it) => acc + it.qty * it.price, 0),
          currency: 'LYD',
          status: input.status ?? 'new',
          priority: input.priority ?? 'normal',
          notes: input.notes,
          attachments: input.attachments ?? [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((s) => ({ orders: [order, ...s.orders] }));
        return order;
      },
      updateOrder: (id, patch) => {
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, ...patch, updatedAt: nowIso() } : o
          ),
        }));
      },
      deleteOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
      setStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status, updatedAt: nowIso() } : o
          ),
        })),
      archive: (id) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, archivedAt: nowIso(), updatedAt: nowIso() } : o
          ),
        })),
      restore: (id) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o;
            const next: Order = { ...o, updatedAt: nowIso() };
            delete next.archivedAt;
            return next;
          }),
        })),
      resetSeed: () => set({ orders: buildSeedOrders() }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ orders: state.orders }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

export const ACTIVE_STATUSES: OrderStatus[] = ['new', 'preparing', 'shipped', 'delivered'];
