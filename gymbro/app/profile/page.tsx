import React from 'react';
import { User, Settings, LogOut } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header className="flex flex-col items-center justify-center text-center pb-8 border-b border-zinc-800">
        <div className="w-24 h-24 bg-pink-600/20 text-pink-500 rounded-full flex items-center justify-center mb-4">
          <User size={48} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Chuesing Ni</h1>
        <p className="text-zinc-400">Gym-goer Account</p>
      </header>

      <div className="space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
            <span className="text-zinc-200">Personal Information</span>
            <User size={18} className="text-zinc-500" />
          </button>
          <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
            <span className="text-zinc-200">App Settings</span>
            <Settings size={18} className="text-zinc-500" />
          </button>
        </div>

        <button className="w-full flex items-center justify-center gap-2 p-4 mt-8 bg-zinc-900 border border-red-500/20 text-red-400 rounded-2xl hover:bg-red-500/10 transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}