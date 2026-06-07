import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
/* eslint-disable react-refresh/only-export-components */
import ar from './ar.json';
import de from './de.json';

export type Language = 'ar' | 'de';

export const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
];

type Dictionary = typeof ar;
const dictionaries: Record<Language, Dictionary> = { ar, de };

export type Direction = 'rtl' | 'ltr';

const languageMeta: Record<Language, { dir: Direction; htmlLang: string }> = {
  ar: { dir: 'rtl', htmlLang: 'ar' },
  de: { dir: 'ltr', htmlLang: 'de' },
};

const STORAGE_KEY = 'flow.lang';

interface I18nContextValue {
  language: Language;
  dir: Direction;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveKey(dict: Dictionary, key: string): unknown {
  const parts = key.split('.');
  let current: unknown = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const v = params[name];
    return v === undefined || v === null ? `{{${name}}}` : String(v);
  });
}

function readStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'ar';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'ar' || stored === 'de') return stored;
  return 'ar';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage());

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const meta = languageMeta[language];
    document.documentElement.setAttribute('lang', meta.htmlLang);
    document.documentElement.setAttribute('dir', meta.dir);
  }, [language]);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[language];
    return {
      language,
      dir: languageMeta[language].dir,
      setLanguage,
      t: (key, params) => {
        const raw = resolveKey(dict, key);
        if (typeof raw === 'string') return interpolate(raw, params);
        // Fallback to Arabic, then to key
        const fallback = resolveKey(dictionaries.ar, key);
        if (typeof fallback === 'string') return interpolate(fallback, params);
        return key;
      },
    };
  }, [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
