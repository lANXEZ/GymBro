'use client';
import React, { useState } from 'react';
import { User, Settings, LogOut, X, Loader2, Mail, Users, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchUserProfile } from '../lib/apiClient';

export default function ProfilePage() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignOut = () => {
    logout();
    router.push('/');
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

  const getRoleDisplay = (role?: string) => {
    if (role === 'trainer') return 'Coach Account';
    if (role === 'training_client') return 'Training Client Account';
    return 'Gym-goer Account';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header className="flex flex-col items-center justify-center text-center pb-8 border-b border-zinc-800">
        <div className="w-24 h-24 bg-pink-600/20 text-pink-500 rounded-full flex items-center justify-center mb-4">
          <User size={48} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{user?.username || 'User'}</h1>
        <p className="text-zinc-400">{getRoleDisplay(user?.role)}</p>
      </header>

      <div className="space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          <button onClick={handlePersonalInfoClick} className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
            <span className="text-zinc-200">Personal Information</span>
            <User size={18} className="text-zinc-500" />
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
            <span className="text-zinc-200">App Settings</span>
            <Settings size={18} className="text-zinc-500" />
          </button>
        </div>

        <button 
          onClick={() => setIsSignOutModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 p-4 mt-8 bg-zinc-900 border border-red-500/20 text-red-400 rounded-2xl hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsSignOutModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                <LogOut size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Sign Out</h3>
              <p className="text-zinc-400 text-sm">
                Are you sure you want to sign out? You will need to log in again to access your workouts.
              </p>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsSignOutModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSignOut}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors"
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsPersonalInfoModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mb-4">
                <User size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-6">Personal Information</h3>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                  <p className="text-zinc-400 text-sm">Loading profile data...</p>
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  {error}
                </div>
              ) : personalInfo ? (
                <div className="space-y-4 text-left mt-6">
                  <div className="bg-zinc-800/50 p-4 rounded-2xl flex items-center gap-4 border border-zinc-800">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">Username</p>
                      <p className="text-sm font-medium text-white">{personalInfo.Username || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-800/50 p-4 rounded-2xl flex items-center gap-4 border border-zinc-800">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">Email</p>
                      <p className="text-sm font-medium text-white">{personalInfo.Email || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-800/50 p-4 rounded-2xl flex items-center gap-4 border border-zinc-800">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">Role</p>
                      <p className="text-sm font-medium text-white capitalize">{personalInfo.Role?.replace('_', ' ') || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
