import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const COLLAPSE_KEY = 'flow.sidebar.collapsed';

export function AppShell() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-800 dark:text-surface-100">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleDesktop={() => setCollapsed((c) => !c)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
