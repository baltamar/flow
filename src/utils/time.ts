import { formatDistanceToNow } from 'date-fns';
import { ar, de } from 'date-fns/locale';

const localeMap = { ar, de } as const;

export function relativeTime(iso: string, lang: 'ar' | 'de' = 'ar'): string {
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: localeMap[lang],
    });
  } catch {
    return iso;
  }
}
