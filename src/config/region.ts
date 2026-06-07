export interface Region {
  code: string;
  nameAr: string;
  nameEn: string;
  currency: 'LYD';
  currencyNameAr: string;
  currencyNameEn: string;
  currencySymbol: string;
  locale: 'ar-LY';
}

export const DEFAULT_REGION: Region = {
  code: 'LY',
  nameAr: 'ليبيا',
  nameEn: 'Libya',
  currency: 'LYD',
  currencyNameAr: 'دينار ليبي',
  currencyNameEn: 'Libyan Dinar',
  currencySymbol: 'د.ل',
  locale: 'ar-LY',
};

const STORAGE_KEY = 'flow.region';

export function getRegion(): Region {
  if (typeof window === 'undefined') return DEFAULT_REGION;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_REGION;
  try {
    const parsed = JSON.parse(raw) as Partial<Region>;
    if (parsed && parsed.code && parsed.currency === 'LYD' && parsed.locale === 'ar-LY') {
      return { ...DEFAULT_REGION, ...parsed } as Region;
    }
  } catch {
    // ignore parse error and fall back
  }
  return DEFAULT_REGION;
}

export function saveRegion(region: Region): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(region));
}

export function formatCurrency(amount: number, region: Region = DEFAULT_REGION): string {
  const fixed = amount.toFixed(2);
  // Use Arabic-Indic digits when region is Arabic
  const formatted = fixed.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
  return `${formatted} ${region.currencySymbol}`;
}

export function formatDate(iso: string, lang: 'ar' | 'de' = 'ar'): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === 'ar' ? 'ar-LY' : 'de-DE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
}
