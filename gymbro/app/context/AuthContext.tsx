'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: number;
  username: string;
  role: string;
  trainer_id?: number;
  [key: string]: any;
};

type AuthContextType = {
  isLoggedIn: boolean;
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('isLoggedIn');
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (stored === 'true' && storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setIsLoggedIn(true);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }

    const onExpired = () => setShowExpired(true);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const handleExpiredConfirm = () => {
    setShowExpired(false);
    // Perform logout synchronously
    setIsLoggedIn(false);
    setToken(null);
    setUser(null);
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  const login = (newToken: string, newUser: User) => {
    setIsLoggedIn(true);
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setToken(null);
    setUser(null);
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  };

  if (!isMounted) return null;

  return (
    <AuthContext.Provider value={{ isLoggedIn, token, user, login, logout }}>
      {children}
      {showExpired && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 w-full max-w-md text-center">
            <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Session expired</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Your sign-in has expired. Please log in again to continue.
            </p>
            <button
              onClick={handleExpiredConfirm}
              className="w-full bg-pink-600 hover:bg-pink-500 text-white rounded-xl py-3 font-bold transition-colors"
            >
              Log in again
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}