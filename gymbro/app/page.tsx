import React from 'react';
import { Target, Flame, CalendarDays, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ShareButton from './component/ShareButton';

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Bro! 🦍</h1>
          <p className="text-zinc-400">Ready to crush your goals today?</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-pink-600 hover:bg-pink-500 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-pink-600/20">
            Start Workout
          </button>
          <ShareButton />
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Workouts', value: '12', icon: Target, color: 'text-blue-500' },
          { label: 'Streak', value: '4 days', icon: Flame, color: 'text-orange-500' },
          { label: 'Volume', value: '8.5k kg', icon: Target, color: 'text-purple-500' },
          { label: 'Time', value: '14 hrs', icon: CalendarDays, color: 'text-green-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
            <div className={`p-2 bg-zinc-800 rounded-lg w-fit ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Plan */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Today's Plan</h2>
            <Link href="/workouts" className="text-sm text-pink-500 hover:text-pink-400 flex items-center">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-white">Push Day (Chest, Shoulders, Triceps)</h3>
                <p className="text-sm text-zinc-400">6 exercises • 60 mins</p>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              {[
                { name: 'Barbell Bench Press', sets: '4 sets x 8-10 reps' },
                { name: 'Incline Dumbbell Press', sets: '3 sets x 10-12 reps' },
                { name: 'Overhead Press', sets: '3 sets x 10-12 reps' },
              ].map((ex, i) => (
                <li key={i} className="flex justify-between items-center text-sm">
                  <span className="text-zinc-200">{ex.name}</span>
                  <span className="text-zinc-500">{ex.sets}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <Link href="/progress" className="text-sm text-pink-500 hover:text-pink-400 flex items-center">
              History <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Leg Day', time: 'Yesterday', pr: true },
              { title: 'Pull Day', time: '2 days ago', pr: false },
              { title: 'Active Recovery', time: '4 days ago', pr: false },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-700 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{activity.title}</h4>
                    <p className="text-xs text-zinc-400">{activity.time}</p>
                  </div>
                </div>
                {activity.pr && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/20">
                    New PR! 🏆
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
