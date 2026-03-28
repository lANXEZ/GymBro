import React from 'react';
import { Target, TrendingUp, Trophy } from 'lucide-react';
import ShareButton from '../component/ShareButton';

export default function ProgressPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Progress</h1>
          <p className="text-zinc-400">Track and share your personal records.</p>
        </div>
        <ShareButton />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="text-pink-500" />
            <h2 className="text-xl font-bold text-white">Latest PRs</h2>
          </div>
          <div className="space-y-4">
            {[
              { exercise: 'Bench Press', weight: '100 kg', reps: 1, date: 'May 10' },
              { exercise: 'Squat', weight: '140 kg', reps: 1, date: 'May 8' },
              { exercise: 'Deadlift', weight: '150 kg', reps: 1, date: 'May 5' },
            ].map((pr, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                <div>
                  <h3 className="font-bold text-white mb-1">{pr.exercise}</h3>
                  <p className="text-xs text-zinc-400">{pr.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-pink-400">{pr.weight}</p>
                  <p className="text-xs text-zinc-400">{pr.reps} rep(s)</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-pink-500" />
            <h2 className="text-xl font-bold text-white">Volume History</h2>
          </div>
          <div className="h-64 flex items-center justify-center bg-zinc-800/30 rounded-2xl border border-zinc-800 border-dashed">
            <p className="text-zinc-500 text-sm">Chart Visualization Area</p>
          </div>
        </div>
      </div>
    </div>
  );
}