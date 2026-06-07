import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, Search, Globe, User, LogOut, Bell, Check } from 'lucide-react';
import { useI18n, LANGUAGES } from '../i18n/I18nContext';
import { useTheme } from '../features/theme/ThemeContext';
import { useAuth } from '../features/auth/AuthContext';
import { useNotifications } from '../utils/notifications';

interface TopBarProps {
  onOpenMobileSidebar: () => void;
}

const titleKeyMap: Record<string, string> = {
  '/kanban': 'kanban',
  '/list': 'list',
  '/analytics': 'analytics',
  '/archive': 'archive',
  '/settings': 'settings',
};

function resolveTitleKey(pathname: string): string {
  if (pathname.startsWith('/orders/')) return 'list';
  return titleKeyMap[pathname] ?? 'kanban';
}

export function TopBar({ onOpenMobileSidebar }: TopBarProps) {
  const { t, language, setLanguage, dir } = useI18n();
  const { theme, toggle } = useTheme();
  const { currentUser, signOut } = useAuth();
  const notifications = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const titleKey = resolveTitleKey(location.pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 backdrop-blur px-4">
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="md:hidden btn-ghost size-9 p-0"
        aria-label="open sidebar"
      >
        <Menu size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base sm:text-lg font-semibold text-surface-900 dark:text-surface-50">
          {t(`nav.${titleKey}`)}
        </h1>
        <p className="hidden sm:block text-xs text-surface-500 dark:text-surface-400">
          {t(`kanban.subtitle`)}
        </p>
      </div>

      {/* Search */}
      <div className="hidden md:flex relative max-w-xs flex-1">
        <Search
          size={16}
          className="absolute top-1/2 -translate-y-1/2 text-surface-400"
          style={dir === 'rtl' ? { right: 10 } : { left: 10 }}
        />
        <input
          type="search"
          placeholder={t('common.search')}
          className="input pe-9 ps-9"
        />
      </div>

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggle}
        className="btn-ghost size-9 p-0"
        aria-label={theme === 'dark' ? t('settings.themeLight') : t('settings.themeDark')}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Language */}
      <div className="relative" ref={langRef}>
        <button
          type="button"
          onClick={() => setLangOpen((o) => !o)}
          className="btn-ghost size-9 p-0"
          aria-label={t('settings.language')}
        >
          <Globe size={18} />
        </button>
        {langOpen && (
          <div
            className={[
              'absolute mt-2 w-40 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-elevated py-1 z-30',
              dir === 'rtl' ? 'left-0' : 'right-0',
            ].join(' ')}
          >
            {LANGUAGES.map((lng) => (
              <button
                key={lng.code}
                type="button"
                onClick={() => {
                  setLanguage(lng.code);
                  setLangOpen(false);
                }}
                className={[
                  'w-full text-start px-3 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-800',
                  language === lng.code ? 'text-primary-700 dark:text-primary-300 font-medium' : '',
                ].join(' ')}
              >
                {lng.nativeLabel}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => setNotifOpen((o) => !o)}
          className="btn-ghost relative size-9 p-0"
          aria-label={t('notifications.title')}
        >
          <Bell size={18} />
          {notifications.unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -end-0.5 -top-0.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white"
            >
              {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <div
            className={[
              'absolute mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-elevated py-1 z-30',
              dir === 'rtl' ? 'left-0' : 'right-0',
            ].join(' ')}
          >
            <div className="flex items-center justify-between border-b border-surface-100 px-3 py-2 dark:border-surface-800">
              <span className="text-sm font-semibold">{t('notifications.title')}</span>
              {notifications.notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => notifications.markAllRead()}
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-300"
                >
                  <Check size={12} /> {t('common.save')}
                </button>
              )}
            </div>
            {notifications.notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-surface-500">
                {t('notifications.empty')}
              </p>
            ) : (
              <ul>
                {notifications.notifications
                  .slice()
                  .reverse()
                  .map((n) => (
                    <li
                      key={n.id}
                      className={[
                        'border-b border-surface-50 px-3 py-2 text-xs last:border-b-0 dark:border-surface-800',
                        n.read ? 'opacity-70' : 'bg-primary-50/40 dark:bg-primary-900/10',
                      ].join(' ')}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          notifications.markAllRead();
                          if (n.orderId) navigate(`/orders/${n.orderId}`);
                          setNotifOpen(false);
                        }}
                        className="block w-full text-start"
                      >
                        <div className="font-medium text-surface-900 dark:text-surface-50">
                          {n.title}
                        </div>
                        <div className="mt-0.5 text-surface-600 dark:text-surface-300">{n.body}</div>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* User avatar */}
      {currentUser && (
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="grid place-items-center size-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200 font-semibold text-sm"
            aria-label="user menu"
          >
            {currentUser.avatar}
          </button>
          {menuOpen && (
            <div
              className={[
                'absolute mt-2 w-56 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-elevated py-1 z-30',
                dir === 'rtl' ? 'left-0' : 'right-0',
              ].join(' ')}
            >
              <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800">
                <div className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                  {currentUser.displayName}
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400 truncate">
                  {currentUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                <User size={16} /> {t('auth.profile')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30"
              >
                <LogOut size={16} /> {t('auth.signOut')}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
