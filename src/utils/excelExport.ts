import * as XLSX from 'xlsx';
import type { Order } from '../types/order';
type Translator = (k: string) => string;

export interface ExcelColumn<T> {
  key: keyof T | string;
  header: string;
  format?: (row: T) => string | number;
}

export function exportOrdersToExcel(orders: Order[], t: Translator, filename: string): void {
  if (orders.length === 0) {
    // still produce a workbook with a "no data" sheet to keep the file valid
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([[t('common.noData')]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, filename);
    return;
  }

  const columns: ExcelColumn<Order>[] = [
    { key: 'code', header: t('order.code') },
    { key: 'customerName', header: t('order.customer') },
    { key: 'customerPhone', header: t('order.phone') },
    { key: 'customerCity', header: t('order.city') },
    { key: 'status', header: t('order.status'), format: (o) => t(`status.${o.status}`) },
    { key: 'priority', header: t('order.priority'), format: (o) => t(`priority.${o.priority}`) },
    { key: 'itemsCount', header: t('list.itemsCount'), format: (o) => o.items.reduce((s, it) => s + it.qty, 0) },
    { key: 'total', header: t('order.total'), format: (o) => o.total },
    { key: 'notes', header: t('order.notes') },
    { key: 'createdAt', header: t('order.createdAt'), format: (o) => new Date(o.createdAt).toLocaleString() },
  ];

  const headerRow = columns.map((c) => c.header);
  const dataRows = orders.map((o) => columns.map((c) => (c.format ? c.format(o) : (o as never)[c.key])));

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Auto width
  const colWidths = columns.map((_, idx) => {
    const maxLen = Math.max(
      String(headerRow[idx] ?? '').length,
      ...dataRows.map((r) => String(r[idx] ?? '').length),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });
  (ws as XLSX.WorkSheet & { '!cols'?: unknown[] })['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  XLSX.writeFile(wb, filename);
}
