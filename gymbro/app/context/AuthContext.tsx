'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
  isLoggedIn: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  token: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('isLoggedIn');
    const storedToken = localStorage.getItem('auth_token');
    if (stored === 'true' && storedToken) {
      setIsLoggedIn(true);
      setToken(storedToken);
    }
  }, []);

  const login = (newToken: string) => {
    setIsLoggedIn(true);
    setToken(newToken);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('auth_token', newToken);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setToken(null);
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('auth_token');
  };

  if (!isMounted) return null;

  return (
    <AuthContext.Provider value={{ isLoggedIn, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}