'use client';

import React from 'react';
import { Plus, Search, Dumbbell, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function WorkoutsPage() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Workout Plans</h1>
          <p className="text-zinc-400">Manage and create your routines.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-pink-600/20">
            <Plus size={20} />
            Create Plan
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input 
          type="text" 
          placeholder="Search for plans or exercises..." 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
        />
      </div>

      {user?.role === 'training_client' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Star className="text-pink-500" size={24} fill="currentColor" />
            Personalized Coaching Plan
          </h2>
          <div className="bg-pink-900/20 border border-pink-500/30 rounded-3xl p-6 hover:border-pink-500 transition-colors cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                <Dumbbell size={24} />
              </div>
              <span className="bg-pink-500/20 text-pink-300 text-xs px-3 py-1 rounded-full font-medium border border-pink-500/30">
                Created by Coach
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">Shred & Build - Week 4</h3>  
            <p className="text-zinc-300 text-sm mb-4 relative z-10">Custom plan specifically designed for your current goals and progression.</p>
            <div className="bg-pink-950/40 rounded-xl px-4 py-2 text-sm text-pink-200 inline-block w-full text-center font-bold">
              View Your Program
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Standard Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Push Day', desc: 'Chest, Shoulders, Triceps', exercises: 6 },
          { name: 'Pull Day', desc: 'Back, Biceps, Forearms', exercises: 5 },
          { name: 'Leg Day', desc: 'Quads, Hamstrings, Calves', exercises: 5 },
          { name: 'Full Body HIIT', desc: 'Conditioning & Strength', exercises: 8 },
        ].map((plan, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 group hover:border-pink-500/50 transition-colors cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Dumbbell size={24} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
            <p className="text-zinc-400 text-sm mb-4">{plan.desc}</p>
            <div className="bg-zinc-800/50 rounded-xl px-4 py-2 text-sm text-zinc-300 inline-block w-full text-center font-medium">
              {plan.exercises} Exercises
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}