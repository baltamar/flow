import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, isAuthenticated } from '../features/auth/AuthContext';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!isAuthenticated(currentUser)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
