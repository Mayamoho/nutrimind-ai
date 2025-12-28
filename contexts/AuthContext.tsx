// import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
// import { User } from '../types';

// interface AuthContextType {
//     user: User | null;
//     token: string | null;
//     login: (user: User, token: string) => void;
//     logout: () => void;
//     isLoading: boolean;
//     updateUser: (user: User) => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//     const [user, setUser] = useState<User | null>(null);
//     const [token, setToken] = useState<string | null>(null);
//     const [isLoading, setIsLoading] = useState(true);

//     useEffect(() => {
//         try {
//             const storedToken = localStorage.getItem('nutrimind_token');
//             const storedUser = localStorage.getItem('nutrimind_user');
//             if (storedToken && storedUser) {
//                 setToken(storedToken);
//                 setUser(JSON.parse(storedUser));
//             }
//         } catch (error) {
//             console.error("Failed to parse user from localStorage", error);
//             localStorage.removeItem('nutrimind_user');
//             localStorage.removeItem('nutrimind_token');
//         } finally {
//             setIsLoading(false);
//         }
//     }, []);

//     const login = (loggedInUser: User, authToken: string) => {
//         setUser(loggedInUser);
//         setToken(authToken);
//         localStorage.setItem('nutrimind_user', JSON.stringify(loggedInUser));
//         localStorage.setItem('nutrimind_token', authToken);
//     };

//     const logout = () => {
//         setUser(null);
//         setToken(null);
//         localStorage.removeItem('nutrimind_user');
//         localStorage.removeItem('nutrimind_token');
//     };

//     const updateUser = useCallback((updatedUser: User) => {
//         setUser(updatedUser);
//         localStorage.setItem('nutrimind_user', JSON.stringify(updatedUser));
//     }, []);


//     return (
//         <AuthContext.Provider value={{ user, token, login, logout, isLoading, updateUser }}>
//             {!isLoading && children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = (): AuthContextType => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import type { User } from "../types";

/**
 * AuthContext.tsx
 *
 * Replaced/rewrote to provide a robust AuthProvider that:
 * - reads token & user from localStorage if present
 * - exposes login, logout, updateUser, isLoading
 * - does a best-effort call to /api/auth/me when a token is present (doesn't block UI)
 *
 * Notes:
 * - This intentionally avoids throwing or leaving children hidden forever when network/backend
 *   is unavailable (which was the likely cause of the dashboard not showing).
 * - Adjust the endpoint paths below if your backend uses a different path.
 */

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  updateUser: (u: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('[AuthContext] AuthProvider initializing...');
  
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("nutrimind_user");
      console.log('[AuthContext] Initial user from localStorage:', raw ? 'found' : 'null');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch (error) {
      console.error('[AuthContext] Error parsing user from localStorage:', error);
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      const token = localStorage.getItem("nutrimind_token");
      console.log('[AuthContext] Initial token from localStorage:', token ? 'found' : 'null');
      return token;
    } catch (error) {
      console.error('[AuthContext] Error getting token from localStorage:', error);
      return null;
    }
  });

  // isLoading controls whether we temporarily hide UI while verifying token.
  // Keep this minimal to avoid permanently blocking the UI if backend is down.
  const [isLoading, setIsLoading] = useState<boolean>(true);
  console.log('[AuthContext] Initial loading state:', isLoading);

  // Persist user + token to localStorage
  const persist = useCallback((u: User | null, t: string | null) => {
    try {
      if (u) localStorage.setItem("nutrimind_user", JSON.stringify(u));
      else localStorage.removeItem("nutrimind_user");
      if (t) localStorage.setItem("nutrimind_token", t);
      else localStorage.removeItem("nutrimind_token");
    } catch {
      // Ignore storage errors (e.g., privacy mode)
    }
  }, []);

  const login = useCallback((u: User, t: string) => {
    setUser(u);
    setToken(t);
    persist(u, t);
  }, [persist]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    persist(null, null);
    // If backend session invalidation is required, call it here (best-effort).
    // fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  }, [persist]);

  const updateUser = useCallback((u: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...u };
      try {
        localStorage.setItem("nutrimind_user", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    console.log('[AuthContext] Starting token verification...');
    
    // If we have a token, try to verify it and fetch the current user.
    // But if the request fails or times out, we still stop loading quickly so UI can render.
    async function verifyToken() {
      if (!token) {
        console.log('[AuthContext] No token found, setting loading to false');
        if (mounted) setIsLoading(false);
        return;
      }

      console.log('[AuthContext] Token found, verifying with backend...');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        // Try common backend path; adjust if your API uses a different route.
        const resp = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!mounted) return;

        console.log('[AuthContext] Backend response status:', resp.status);

        if (resp.ok) {
          const data = await resp.json().catch(() => null);
          if (data && data.user) {
            console.log('[AuthContext] User data received from backend:', data.user);
            setUser(data.user as User);
            // keep token unchanged (already set)
            persist(data.user as User, token);
          } else {
            console.log('[AuthContext] No user data in response, keeping local user if present');
            // If backend returns no user, we keep local user if present, but do not block.
          }
        } else {
          // If token invalid / server returned 401, clear token & user.
          if (resp.status === 401 || resp.status === 403) {
            console.log('[AuthContext] Token invalid (401/403), clearing auth data');
            setUser(null);
            setToken(null);
            persist(null, null);
          }
          // for other codes, just proceed without blocking UI
        }
      } catch (err) {
        console.log('[AuthContext] Token verification failed:', err);
        // network error, timeout, etc. Do not leave UI stuck — we'll proceed without server validation.
      } finally {
        console.log('[AuthContext] Token verification completed, setting loading to false');
        if (mounted) setIsLoading(false);
      }
    }

    verifyToken();

    return () => {
      mounted = false;
    };
  }, [token, persist]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, updateUser }}>
      {!isLoading ? children : <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-slate-600 dark:text-slate-300 font-semibold">Loading your dashboard...</p>
      </div>}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
