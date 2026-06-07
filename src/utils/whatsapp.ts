import type { Order } from '../types/order';
import { formatCurrency } from '../config/region';

const LIBYA_COUNTRY_CODE = '+218';

function toInternationalPhone(rawPhone: string): string {
  // Strip everything but digits and a leading +
  const cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned.replace(/^\+/, '');
  }
  // Libyan local numbers start with 0; convert to +218
  if (cleaned.startsWith('0')) {
    return LIBYA_COUNTRY_CODE.replace('+', '') + cleaned.slice(1);
  }
  // Already in international form without + (e.g. 218912345678)
  if (cleaned.startsWith('218')) {
    return cleaned;
  }
  // Fallback: prepend country code
  return LIBYA_COUNTRY_CODE.replace('+', '') + cleaned;
}

export function buildWhatsAppLink(order: Order, messageTemplate: string): string {
  const phone = toInternationalPhone(order.customerPhone);
  const items = order.items
    .map((it) => `• ${it.name} × ${it.qty} = ${formatCurrency(it.qty * it.price)}`)
    .join('\n');
  const message = messageTemplate
    .replace(/\{\{name\}\}/g, order.customerName)
    .replace(/\{\{code\}\}/g, order.code)
    .replace(/\{\{status\}\}/g, order.status)
    .replace(/\{\{items\}\}/g, items)
    .replace(/\{\{total\}\}/g, formatCurrency(order.total));
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(order: Order, messageTemplate: string): void {
  const url = buildWhatsAppLink(order, messageTemplate);
  window.open(url, '_blank', 'noopener,noreferrer');
}
