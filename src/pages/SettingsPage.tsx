import { useState } from 'react';
import { useI18n, LANGUAGES, type Language } from '../i18n/I18nContext';
import { useTheme, type Theme } from '../features/theme/ThemeContext';
import { DEFAULT_REGION, getRegion, saveRegion, type Region } from '../config/region';
import { useOrderStore } from '../features/orders/orderStore';
import { useAuth } from '../features/auth/AuthContext';
import { useNotifications } from '../utils/notifications';
import { useToast } from '../utils/toast';
import { Sun, Moon, Globe, MapPin, Wallet, Languages, RefreshCcw, Check, Bell, BellOff, Shield, Trash2 } from 'lucide-react';

export function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const resetSeed = useOrderStore((s) => s.resetSeed);
  const { currentUser } = useAuth();
  const notifications = useNotifications();
  const toast = useToast();

  const [region, setRegionState] = useState<Region>(() => getRegion());
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const save = () => {
    saveRegion(region);
    setSavedAt(new Date().toLocaleTimeString('ar-LY'));
  };

  const handleToggleBrowserNotifications = async () => {
    if (notifications.permissionState === 'granted') {
      // No real "disable" via the Notifications API; we can clear the local flag so the app stops firing them.
      window.localStorage.removeItem('flow.browserNotifications.enabled');
      toast.show(t('notifications.disable'), 'info');
      return;
    }
    if (notifications.permissionState === 'unsupported') {
      toast.show(t('common.error'), 'error');
      return;
    }
    const result = await notifications.requestBrowserPermission();
    if (result === 'granted') {
      toast.show(t('notifications.permissionGranted'), 'success');
    } else {
      toast.show(t('notifications.permissionDenied'), 'error');
    }
  };

  const handleClearNotifications = () => {
    notifications.clear();
    toast.show(t('common.success'), 'success');
  };

  return (
    <section className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Globe size={16} /> {t('settings.language')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LANGUAGES.map((lng) => (
            <button
              key={lng.code}
              type="button"
              onClick={() => setLanguage(lng.code as Language)}
              className={[
                'flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                language === lng.code
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                  : 'border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800',
              ].join(' ')}
            >
              <span className="flex items-center gap-2">
                <Languages size={14} /> {lng.nativeLabel}
              </span>
              {language === lng.code && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Sun size={16} /> {t('settings.theme')}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {(['light', 'dark'] as Theme[]).map((th) => (
            <button
              key={th}
              type="button"
              onClick={() => setTheme(th)}
              className={[
                'flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                theme === th
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                  : 'border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800',
              ].join(' ')}
            >
              <span className="flex items-center gap-2">
                {th === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                {th === 'light' ? t('settings.themeLight') : t('settings.themeDark')}
              </span>
              {theme === th && <Check size={14} />}
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <MapPin size={16} /> {t('settings.region')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t('settings.region')}>
            <input
              className="input"
              value={region.nameAr}
              onChange={(e) => setRegionState({ ...region, nameAr: e.target.value })}
            />
          </Field>
          <Field label={t('settings.currency')}>
            <span className="input flex items-center gap-2" dir="ltr">
              <Wallet size={14} /> {region.currency} · {region.currencySymbol}
            </span>
          </Field>
          <Field label={t('settings.locale')}>
            <span className="input" dir="ltr">
              {region.locale}
            </span>
          </Field>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={save} className="btn-primary">
            <Check size={14} /> {t('common.save')}
          </button>
          {savedAt && (
            <span className="text-xs text-primary-700 dark:text-primary-300">
              {t('settings.saveSuccess')} · {savedAt}
            </span>
          )}
        </div>
        <p className="text-xs text-surface-400">
          الافتراضي: {DEFAULT_REGION.nameAr} · {DEFAULT_REGION.currency} · {DEFAULT_REGION.locale}
        </p>
      </div>

      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Bell size={16} /> {t('notifications.title')}
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          {t('notifications.enable')}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleToggleBrowserNotifications}
            disabled={notifications.permissionState === 'unsupported'}
            className={[
              'btn-primary',
              notifications.permissionState === 'unsupported' ? 'opacity-50' : '',
            ].join(' ')}
          >
            {notifications.permissionState === 'granted' ? <BellOff size={14} /> : <Bell size={14} />}
            {notifications.permissionState === 'granted'
              ? t('notifications.disable')
              : t('notifications.enable')}
          </button>
          <span className="text-xs text-surface-500" dir="ltr">
            permission: {notifications.permissionState}
          </span>
        </div>
        {notifications.notifications.length > 0 && (
          <button
            type="button"
            onClick={handleClearNotifications}
            className="btn-outline text-xs"
          >
            <Trash2 size={12} /> {t('common.noData')}
          </button>
        )}
      </div>

      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <Shield size={16} /> Auth: ready for Supabase
        </h2>
        {currentUser ? (
          <div className="text-sm space-y-1">
            <div>
              <span className="text-xs text-surface-500">{t('auth.profile')}: </span>
              <span className="font-medium">{currentUser.displayName}</span>
            </div>
            <div dir="ltr" className="text-xs text-surface-500">
              {currentUser.email}
            </div>
            <div className="text-[10px] text-surface-400">
              {currentUser.authProvider} · emailVerified={String(currentUser.emailVerified)}
            </div>
          </div>
        ) : (
          <p className="text-xs text-surface-500">—</p>
        )}
        <p className="text-xs text-surface-400">
          To wire real Supabase, replace the mock provider in <code>src/features/auth/AuthContext.tsx</code> (marked <code>AUTH-STUB: ready for Supabase</code>).
        </p>
      </div>

      <div className="card space-y-3">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
          {t('archive.title')}
        </h2>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          أعد تحميل بيانات الطلبات التجريبية إلى التخزين المحلي.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm('إعادة تعيين بيانات الطلبات؟')) resetSeed();
          }}
          className="btn-outline"
        >
          <RefreshCcw size={14} /> إعادة تعيين البيانات
        </button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
