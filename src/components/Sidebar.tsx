import { NavLink, useNavigate } from 'react-router-dom';
import {
  KanbanSquare,
  ListChecks,
  BarChart3,
  Archive,
  Settings as SettingsIcon,
  ChevronRight,
  ChevronLeft,
  X,
  Workflow,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from '../features/auth/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleDesktop: () => void;
}

const navConfig = [
  { to: '/kanban', key: 'kanban', icon: KanbanSquare },
  { to: '/list', key: 'list', icon: ListChecks },
  { to: '/analytics', key: 'analytics', icon: BarChart3 },
  { to: '/archive', key: 'archive', icon: Archive },
  { to: '/settings', key: 'settings', icon: SettingsIcon },
] as const;

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleDesktop }: SidebarProps) {
  const { t, dir } = useI18n();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleNav = () => {
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        className={[
          'fixed md:sticky top-0 z-40 h-screen bg-white dark:bg-surface-900 border-l border-surface-200 dark:border-surface-800',
          'transition-[width,transform] duration-200 ease-in-out',
          dir === 'rtl'
            ? 'right-0 border-l'
            : 'left-0 border-r',
          // Mobile: full drawer
          mobileOpen ? 'translate-x-0 w-64' : dir === 'rtl' ? 'translate-x-full' : '-translate-x-full',
          // Desktop sizing
          'md:translate-x-0',
          collapsed ? 'md:w-16' : 'md:w-64',
        ].join(' ')}
        aria-label="FLOW sidebar"
      >
        <div className="flex h-full flex-col">
          {/* Logo + collapse */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-surface-200 dark:border-surface-800">
            <button
              type="button"
              onClick={() => navigate('/kanban')}
              className="flex items-center gap-2 group"
              aria-label="FLOW"
            >
              <span className="grid place-items-center size-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-card">
                <Workflow size={20} />
              </span>
              {!collapsed && (
                <span className="font-bold text-lg text-surface-900 dark:text-surface-50">
                  {t('app.name')}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden btn-ghost size-9 p-0"
              aria-label="close sidebar"
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={onToggleDesktop}
              className="hidden md:inline-flex btn-ghost size-8 p-0"
              aria-label={collapsed ? 'expand sidebar' : 'collapse sidebar'}
            >
              {dir === 'rtl' ? (
                collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />
              ) : collapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navConfig.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNav}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
                        : 'text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800',
                    ].join(' ')
                  }
                  title={collapsed ? t(`nav.${item.key}`) : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{t(`nav.${item.key}`)}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer: current user */}
          {currentUser && (
            <div className="border-t border-surface-200 dark:border-surface-800 p-3">
              <div
                className={[
                  'flex items-center gap-3 rounded-lg p-2',
                  collapsed ? 'justify-center' : '',
                ].join(' ')}
              >
                <div className="grid place-items-center size-9 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200 font-semibold text-sm">
                  {currentUser.avatar}
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">
                      {currentUser.displayName}
                    </div>
                    <div className="truncate text-xs text-surface-500 dark:text-surface-400">
                      {currentUser.email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
