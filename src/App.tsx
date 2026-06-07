import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nContext';
import { ThemeProvider } from './features/theme/ThemeContext';
import { AuthProvider } from './features/auth/AuthContext';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { KanbanPage } from './pages/KanbanPage';
import { MasterListPage } from './pages/MasterListPage';
import { ArchivePage } from './pages/ArchivePage';
import { SettingsPage } from './pages/SettingsPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ToastProvider } from './utils/toast';
import { NotificationProvider } from './utils/notifications';

// Analytics is the heaviest page (Recharts) — lazy-load it.
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
);

function Loading() {
  return (
    <div className="grid h-[60vh] place-items-center text-sm text-surface-500">
      <div className="size-8 animate-spin rounded-full border-2 border-surface-300 border-t-primary-500" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />

                  <Route
                    element={
                      <ProtectedRoute>
                        <AppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/" element={<Navigate to="/kanban" replace />} />
                    <Route path="/kanban" element={<KanbanPage />} />
                    <Route path="/list" element={<MasterListPage />} />
                    <Route
                      path="/analytics"
                      element={
                        <Suspense fallback={<Loading />}>
                          <AnalyticsPage />
                        </Suspense>
                      }
                    />
                    <Route path="/archive" element={<ArchivePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/orders/:id" element={<OrderDetailPage />} />
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
