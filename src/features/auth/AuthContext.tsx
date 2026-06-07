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

/* ============================================================
 * AUTH-STUB: ready for Supabase
 * ------------------------------------------------------------
 * This file is the single integration seam for swapping the
 * in-memory mock auth for Supabase Auth (or any other provider).
 *
 * To migrate to Supabase:
 *   1. Install `@supabase/supabase-js`.
 *   2. Create a client in `src/lib/supabase.ts`.
 *   3. Replace the implementations of `signInWithEmail`,
 *      `signInWithGoogle`, and `signOut` below with the
 *      corresponding Supabase calls.
 *   4. Map Supabase's User / Session objects into the
 *      `AuthUser` shape defined here.
 *   5. Keep the same exported names so call-sites are unchanged.
 * ============================================================ */

export type AuthProvider = 'email' | 'google';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  /** Avatar URL or initials seed (mock uses initials). */
  avatar: string;
  /** Email magic-link verification — gated in router. */
  emailVerified: boolean;
  /** Authentication provider that signed the user in. */
  authProvider: AuthProvider;
  createdAt: string;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  pendingEmail: string | null;
  signInWithEmail: (email: string) => Promise<AuthUser>;
  signInWithGoogle: () => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'flow.auth.user.v1';
const PENDING_KEY = 'flow.auth.pending.v1';

function deriveDisplayName(email: string): string {
  const local = email.split('@')[0] ?? 'user';
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function initialsFor(email: string): string {
  const name = deriveDisplayName(email);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function readStoredPending(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(PENDING_KEY);
}

function persistUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

function persistPending(email: string | null): void {
  if (typeof window === 'undefined') return;
  if (email) {
    window.localStorage.setItem(PENDING_KEY, email);
  } else {
    window.localStorage.removeItem(PENDING_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => readStoredUser());
  const [pendingEmail, setPendingEmail] = useState<string | null>(() => readStoredPending());

  // Auto-confirm the magic link after a short delay to simulate the email
  // round-trip. In a real backend this would happen when the user clicks
  // the link in the email; here we resolve it client-side so the demo flow
  // is one-tap.
  useEffect(() => {
    if (!pendingEmail || currentUser) return;
    const timer = window.setTimeout(() => {
      const verifiedUser: AuthUser = {
        id: `email_${pendingEmail}`,
        email: pendingEmail,
        displayName: deriveDisplayName(pendingEmail),
        avatar: initialsFor(pendingEmail),
        emailVerified: true,
        authProvider: 'email',
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(verifiedUser);
      setPendingEmail(null);
      persistUser(verifiedUser);
      persistPending(null);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [pendingEmail, currentUser]);

  const signInWithEmail = useCallback(async (email: string): Promise<AuthUser> => {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new Error('invalid_email');
    }
    setPendingEmail(trimmed);
    persistPending(trimmed);
    // Return a placeholder that represents the pending state. The
    // verification effect above will replace it with the verified user.
    return {
      id: `pending_${trimmed}`,
      email: trimmed,
      displayName: deriveDisplayName(trimmed),
      avatar: initialsFor(trimmed),
      emailVerified: false,
      authProvider: 'email',
      createdAt: new Date().toISOString(),
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthUser> => {
    const mockEmail = 'demo@flow.ly';
    const user: AuthUser = {
      id: `google_${mockEmail}`,
      email: mockEmail,
      displayName: 'مستخدم تجريبي / Demo User',
      avatar: 'DU',
      emailVerified: true,
      authProvider: 'google',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(user);
    setPendingEmail(null);
    persistUser(user);
    persistPending(null);
    return user;
  }, []);

  const signOut = useCallback(async () => {
    setCurrentUser(null);
    setPendingEmail(null);
    persistUser(null);
    persistPending(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ currentUser, pendingEmail, signInWithEmail, signInWithGoogle, signOut }),
    [currentUser, pendingEmail, signInWithEmail, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

/**
 * Routes are accessible only when:
 *   - the user has a verified email (magic-link confirmed), OR
 *   - the user signed in via a trusted provider like Google.
 */
export function isAuthenticated(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.authProvider === 'google') return true;
  return user.emailVerified === true;
}
