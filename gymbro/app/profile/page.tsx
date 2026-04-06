'use client';
import React, { useState } from 'react';
import { User, Settings, LogOut, X, Loader2, Mail, Users, Calendar, Hash, Moon, Sun, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchUserProfile, changePasswordApi, unsubscribeApi } from '../lib/apiClient';
import { useTheme } from 'next-themes';

export default function ProfilePage() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isUnsubscribeModalOpen, setIsUnsubscribeModalOpen] = useState(false);
  const [cpUsername, setCpUsername] = useState('');
  const [cpBirthdate, setCpBirthdate] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setError('');
    try {
      await unsubscribeApi(token as string);
      
      setIsUnsubscribeModalOpen(false);
      setIsPersonalInfoModalOpen(false);
      // Reload profile or log the user out to refresh token context
      handleSignOut();
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe');
      setIsUnsubscribeModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalInfoClick = async () => {
    setIsPersonalInfoModalOpen(true);
    if (!personalInfo) {
      setIsLoading(true);
      setError('');
      try {
        const data = await fetchUserProfile(token as string);
        setPersonalInfo(data);
      } catch (err: any) {
        setError(err.message || 'Failed to loaded user profile');
      } finally {
        setIsLoading(false);
      }
    }
  };

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

  const getRoleDisplay = (role?: string) => {
    if (role === 'trainer') return 'Coach Account';
    if (role === 'training_client') return 'Training Client Account';
    return 'Gym-goer Account';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header className="flex flex-col items-center justify-center text-center pb-8 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="w-24 h-24 bg-pink-100 dark:bg-pink-600/20 text-pink-600 dark:text-pink-500 rounded-full flex items-center justify-center mb-4 transition-colors">
          <User size={48} />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 transition-colors">{user?.username || 'User'}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 transition-colors">{getRoleDisplay(user?.role)}</p>
      </header>

      <div className="space-y-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 transition-colors">
          <button onClick={handlePersonalInfoClick} className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <span className="text-zinc-800 dark:text-zinc-200">Personal Information</span>
            <User size={18} className="text-zinc-500" />
          </button>
          <button onClick={() => setIsSettingsModalOpen(true)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <span className="text-zinc-800 dark:text-zinc-200">App Settings</span>
            <Settings size={18} className="text-zinc-500" />
          </button>
        </div>

        <button 
          onClick={() => setIsSignOutModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 p-4 mt-8 bg-white dark:bg-zinc-900 border border-red-500/20 text-red-500 dark:text-red-400 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-200 transition-colors">
            <button 
              onClick={() => setIsSignOutModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4 transition-colors">
                <LogOut size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white transition-colors">Sign Out</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm transition-colors">
                Are you sure you want to sign out? You will need to log in again to access your workouts.
              </p>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsSignOutModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSignOut}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-xl font-bold transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Information Modal */}
      {isPersonalInfoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-200 transition-colors">
            <button 
              onClick={() => setIsPersonalInfoModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-pink-100 dark:bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mb-4 transition-colors">
                <User size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 transition-colors">Personal Information</h3>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm transition-colors">Loading profile data...</p>
                </div>
              ) : error ? (
                <div className="text-red-500 dark:text-red-400 text-sm p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20 transition-colors">
                  {error}
                </div>
              ) : personalInfo ? (
                <div className="space-y-4 text-left mt-6">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl flex items-center gap-4 border border-zinc-200 dark:border-zinc-800 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Hash className="w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">User ID</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white transition-colors">{personalInfo.ID || personalInfo.id || user?.id || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl flex items-center gap-4 border border-zinc-200 dark:border-zinc-800 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 transition-colors">
                      <User className="w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">Username</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white transition-colors">{personalInfo.Username || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl flex items-center justify-between border border-zinc-200 dark:border-zinc-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 transition-colors">
                        <Users className="w-5 h-5 text-zinc-500 dark:text-zinc-400 transition-colors" />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-0.5">Role</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white capitalize transition-colors">{(personalInfo.Role || personalInfo.role || user?.role)?.replace('_', ' ') || 'N/A'}</p>
                      </div>
                    </div>
                    {((personalInfo.Role || personalInfo.role || user?.role) === 'training_client') && (
                      <button
                        onClick={() => setIsUnsubscribeModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-bold bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
                      >
                        Unsubscribe
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                       setIsPersonalInfoModalOpen(false);
                       setIsChangePasswordModalOpen(true);
                       setCpUsername(personalInfo.Username || '');
                    }}
                    className="w-full mt-4 bg-pink-600 hover:bg-pink-500 text-white rounded-xl py-3 font-bold transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

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
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-pink-100 dark:bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mb-4 transition-colors">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 transition-colors">Change Password</h3>
              
              {cpError && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm">
                  {cpError}
                </div>
              )}
              {cpSuccess && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-xl text-sm">
                  {cpSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="text" required value={cpUsername} onChange={e => setCpUsername(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all"
                        placeholder="johndoe123"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="date" required value={cpBirthdate} onChange={e => setCpBirthdate(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="password" required value={cpNewPassword} onChange={e => setCpNewPassword(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="password" required value={cpConfirmPassword} onChange={e => setCpConfirmPassword(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button disabled={isLoading} type="submit" className="w-full bg-pink-600 hover:bg-pink-500 text-white rounded-xl py-4 font-bold mt-4 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    Change Password
                  </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* App Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-200 transition-colors">
            <button 
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center mb-4 transition-colors">
                <Settings size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 transition-colors">App Settings</h3>
              
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-colors">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon size={20} className="text-indigo-400" />
                    ) : (
                      <Sun size={20} className="text-amber-500" />
                    )}
                    <span className="text-zinc-900 dark:text-white font-medium transition-colors">Theme</span>
                  </div>
                  
                  <div className="flex bg-zinc-200 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-300 dark:border-zinc-800 transition-colors">
                    <button
                      onClick={() => setTheme('light')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${theme === 'light' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${theme === 'dark' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Dark
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsubscribe Modal */}
      {isUnsubscribeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-200 transition-colors">
            <button 
              onClick={() => setIsUnsubscribeModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4 transition-colors">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white transition-colors">Unsubscribe from Coach</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm transition-colors">
                Are you sure you want to unsubscribe? The plan provided by your trainer will be disabled and you will be returned to a regular gym-goer status. You will need to log back in after this operation.
              </p>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsUnsubscribeModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl font-medium transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUnsubscribe}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
