'use client';

import React, { useState, useRef, useEffect } from 'react';
import Navigation from '../component/Navigation';
import { useAuth } from './AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { User as UserIcon, LogOut, Lock, Shield, X, Calendar } from 'lucide-react';
import { changePasswordApi } from '../lib/apiClient';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const adminFullName = user ? [user.FirstName || user.first_name || user.firstName || '', user.LastName || user.last_name || user.lastName || ''].filter(Boolean).join(' ') || user.username : '';

  // Change Password State
  const [cpUsername, setCpUsername] = useState('');
  const [cpBirthdate, setCpBirthdate] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin') {
      if (pathname !== '/admin') {
        router.replace('/admin');
      }
    }
  }, [isLoggedIn, user?.role, pathname, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');
    if (cpNewPassword !== cpConfirmPassword) {
      setCpError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await changePasswordApi(cpUsername, cpBirthdate, cpNewPassword);
      setCpSuccess('Password changed successfully');
      setCpUsername('');
      setCpBirthdate('');
      setCpNewPassword('');
      setCpConfirmPassword('');
      setTimeout(() => {
        setIsChangePasswordModalOpen(false);
        setCpSuccess('');
      }, 2000);
    } catch (err: any) {
      setCpError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (user?.role === 'admin') {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto p-4 md:p-8 relative">
          
          <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50" ref={menuRef}>
            <button 
              onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
              className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-sm hover:shadow-md transition-all"
            >
              <div className="bg-pink-100 dark:bg-pink-900/40 p-2 rounded-full text-pink-600 dark:text-pink-400">
                <Shield size={20} />
              </div>
              <span className="font-semibold px-2 pr-4">{adminFullName} (ID: {user.id})</span>
            </button>

            {isAdminMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-pink-100 dark:bg-pink-900/40 p-3 rounded-full text-pink-600 dark:text-pink-400">
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white max-w-[150px] truncate">{adminFullName}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">Admin (ID: {user.id})</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <button 
                    onClick={() => {
                      setIsAdminMenuOpen(false);
                      setCpUsername(user.username);
                      setIsChangePasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <Lock size={18} className="text-zinc-400" />
                    Change Password
                  </button>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                  <button 
                    onClick={() => { logout(); router.push('/'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {children}

        </div>

        {/* Change Password Modal */}
        {isChangePasswordModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-200 transition-colors">
              <button 
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Lock size={24} className="text-pink-500" />
                Change Password
              </h3>

              {cpError && <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-4 text-sm font-medium border border-red-500/20">{cpError}</div>}
              {cpSuccess && <div className="bg-green-500/10 text-green-500 p-3 rounded-xl mb-4 text-sm font-medium border border-green-500/20">{cpSuccess}</div>}

              <form onSubmit={handleChangePassword} className="space-y-4 text-left">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Username</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="text" required value={cpUsername} onChange={e => setCpUsername(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="date" required value={cpBirthdate} onChange={e => setCpBirthdate(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="password" required value={cpNewPassword} onChange={e => setCpNewPassword(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="password" required value={cpConfirmPassword} onChange={e => setCpConfirmPassword(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-pink-600 hover:bg-pink-500 text-white rounded-xl py-3 font-bold mt-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <>
      <Navigation />
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </>
  );
}
