'use client';

import React, { useEffect, useState } from 'react';
import { Target, TrendingUp, History, Loader2 } from 'lucide-react';
import ShareButton from '../component/ShareButton';
import { useAuth } from '../context/AuthContext';
import { fetchWorkout } from '../lib/apiClient';

interface PRRecord {
  exercise: string;
  weight: string;
  reps: number;
  time?: number;
  date: string;
}

const formatPrTime = (totalSecs: number) => {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function ProgressPage() {
  const { token } = useAuth();
  const [prs, setPrs] = useState<PRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Generate lists for select dropdowns
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const loadPRs = async () => {
      setLoading(true);
      try {
        const records = await fetchWorkout(token, '', 1000); // Increased limit to ensure we get history
        if (records && records.length > 0) {
          const prList: PRRecord[] = [];

          records.forEach((record: any) => {
            if (!record.date) return;
            
            const d = new Date(record.date);
            if (isNaN(d.getTime())) return;

            // Filter by selected month and year
            if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) {
              return;
            }

            const exercise = record.workout_type;
            const weightVal = Number(record.weight) || 0;
            const reps = Number(record.reps) || 0;
            const timeVal = Number(record.time) || 0;
            
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            if (exercise) {
              prList.push({
                exercise,
                weight: timeVal ? formatPrTime(timeVal) : weightVal ? `${weightVal} kg` : '0 kg',
                reps,
                time: timeVal,
                date: dateStr
              });
            }
          });

          // Sort by date descending
          prList.sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
          
          setPrs(prList);
        } else {
          setPrs([]);
        }
      } catch (err) {
        console.error('Failed to fetch all PRs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPRs();
  }, [token, selectedMonth, selectedYear]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Progress</h1>
          <p className="text-zinc-400">Track and share your personal records.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-zinc-800 text-white border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-pink-500 outline-none text-sm cursor-pointer"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-zinc-800 text-white border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-pink-500 outline-none text-sm cursor-pointer"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <ShareButton />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <History className="text-pink-500" />
            <h2 className="text-xl font-bold text-white">Latest Record</h2>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : prs.length > 0 ? (
              prs.map((pr, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                  <div>
                    <h3 className="font-bold text-white mb-1">{pr.exercise}</h3>
                    <p className="text-xs text-zinc-400">{pr.date}</p>
                  </div>
                  <div className="text-right">
                    {pr.time ? (
                      <>
                        <p className="text-lg font-bold text-pink-400">{pr.weight}</p>
                        <p className="text-xs text-zinc-400">duration</p>
                      </>
                    ) : pr.weight && pr.weight !== '0 kg' ? (
                      <>
                        <p className="text-lg font-bold text-pink-400">{pr.weight}</p>
                        <p className="text-xs text-zinc-400">{pr.reps} rep(s)</p>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-pink-400">{pr.reps} rep(s)</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-sm text-center py-4">No PR records found.</p>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-fit h-[350px]">
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