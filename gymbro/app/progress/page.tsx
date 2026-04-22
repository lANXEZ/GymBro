'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Target, TrendingUp, History, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import ShareButton from '../component/ShareButton';
import { useAuth } from '../context/AuthContext';
import { fetchWorkout, fetchBodyStatsHistory } from '../lib/apiClient';

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

  // --- BMI Feature State ---
  const [bmiData, setBmiData] = useState<{date: Date, bmi: number}[]>([]);
  const [bmiLoading, setBmiLoading] = useState(false);
  const [bmiIntervalOffset, setBmiIntervalOffset] = useState(0); 

  useEffect(() => {
    if (!token) return;
    const loadBMI = async () => {
      setBmiLoading(true);
      try {
        const stats = await fetchBodyStatsHistory(token);
        const calcBmi = stats.map((s: any) => {
          const w = parseFloat(s.UserWeight);
          const h = parseFloat(s.UserHeight) / 100;
          const bmi = w / (h * h);
          return {
            date: new Date(s.SessionDate),
            bmi: parseFloat(bmi.toFixed(1))
          };
        });
        
        calcBmi.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
        setBmiData(calcBmi);
      } catch (err) {
        console.error('Failed to fetch body stats:', err);
      } finally {
        setBmiLoading(false);
      }
    };
    loadBMI();
  }, [token]);

  const { start, end, quarter, year } = useMemo(() => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const targetQuarter = currentQuarter + bmiIntervalOffset;
    
    // Calculate year and quarter properly handling negative targetQuarter
    const yearOffset = Math.floor(targetQuarter / 4);
    const q = ((targetQuarter % 4) + 4) % 4;
    const y = now.getFullYear() + yearOffset;
    
    const startMonth = q * 3;
    const startDate = new Date(y, startMonth, 1);
    
    const endDate = new Date(y, startMonth + 3, 0, 23, 59, 59, 999);
    
    return { start: startDate, end: endDate, quarter: q + 1, year: y };
  }, [bmiIntervalOffset]);

  const filteredBmi = useMemo(() => {
    return bmiData.filter(d => d.date >= start && d.date <= end);
  }, [bmiData, start, end]);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const isNextMonthDisabled = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();

  const handleNextMonth = () => {
    if (isNextMonthDisabled) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

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
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Your Progress</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Track and share your personal records.</p>
        </div>
        <ShareButton />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="order-2 md:order-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History className="text-pink-500" />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Latest Record</h2>
            </div>
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1">
              <button
                onClick={handlePrevMonth}
                className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-zinc-900 dark:text-white whitespace-nowrap w-24 text-center inline-block">
                {months[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={handleNextMonth}
                disabled={isNextMonthDisabled}
                className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : prs.length > 0 ? (
              prs.map((pr, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-1">{pr.exercise}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{pr.date}</p>
                  </div>
                  <div className="text-right">
                    {pr.time ? (
                      <>
                        <p className="text-lg font-bold text-pink-400">{pr.weight}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">duration</p>
                      </>
                    ) : pr.weight && pr.weight !== '0 kg' ? (
                      <>
                        <p className="text-lg font-bold text-pink-400">{pr.weight}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{pr.reps} rep(s)</p>
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

        <div className="order-1 md:order-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 h-fit h-[350px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-pink-500" />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">BMI History</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setBmiIntervalOffset(prev => prev - 1)} 
                className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 rounded-full transition-colors"
                aria-label="Previous Quarter"
              >
                <ChevronLeft className="w-5 h-5"/>
              </button>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                Q{quarter} {year}
              </span>
              <button 
                onClick={() => setBmiIntervalOffset(prev => prev + 1)} 
                className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={bmiIntervalOffset >= 0} 
                aria-label="Next Quarter"
              >
                <ChevronRight className="w-5 h-5"/>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-zinc-100/30 dark:bg-zinc-800/30 rounded-2xl border border-zinc-800/50 p-4 relative flex flex-col">
            {bmiLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col relative">
                <div className="flex-1 flex pl-6 pb-6 relative">
                  {/* Y-axis Labels */}
                  <div className="absolute left-0 top-0 bottom-6 w-6 flex flex-col justify-between items-start text-[10px] text-zinc-500">
                    <span>{filteredBmi.length > 0 ? Math.ceil(Math.max(...filteredBmi.map(b => b.bmi)) + 1) : 30}</span>
                    <span>{filteredBmi.length > 0 ? ((Math.ceil(Math.max(...filteredBmi.map(b => b.bmi)) + 1) + Math.floor(Math.max(0, Math.min(...filteredBmi.map(b => b.bmi)) - 1))) / 2).toFixed(1) : 25}</span>
                    <span>{filteredBmi.length > 0 ? Math.floor(Math.max(0, Math.min(...filteredBmi.map(b => b.bmi)) - 1)) : 20}</span>
                  </div>
                  
                  {/* Chart Area */}
                  <div className="flex-1 relative border-l border-b border-zinc-700/50">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                      {filteredBmi.length > 0 && (
                        <>
                          <polyline 
                            fill="none" 
                            stroke="#ec4899" 
                            strokeWidth="1" 
                            points={filteredBmi.map((d) => {
                              const minBmi = Math.floor(Math.max(0, Math.min(...filteredBmi.map(b => b.bmi)) - 1));
                              const maxBmi = Math.ceil(Math.max(...filteredBmi.map(b => b.bmi)) + 1);
                              const range = maxBmi - minBmi || 1;
                              const quarterDuration = end.getTime() - start.getTime();
                              const x = ((d.date.getTime() - start.getTime()) / quarterDuration) * 100;
                              const y = 100 - ((d.bmi - minBmi) / range) * 100;
                              return `${x},${y}`;
                            }).join(' ')} 
                          />
                          {filteredBmi.map((d, i) => {
                              const minBmi = Math.floor(Math.max(0, Math.min(...filteredBmi.map(b => b.bmi)) - 1));
                              const maxBmi = Math.ceil(Math.max(...filteredBmi.map(b => b.bmi)) + 1);
                              const range = maxBmi - minBmi || 1;
                              const quarterDuration = end.getTime() - start.getTime();
                              const x = ((d.date.getTime() - start.getTime()) / quarterDuration) * 100;
                              const y = 100 - ((d.bmi - minBmi) / range) * 100;
                              return (
                                <g key={i} className="group">
                                  <circle cx={x} cy={y} r="1" fill="#ec4899" className="opacity-80 transition-opacity" />
                                  <circle cx={x} cy={y} r="4" fill="transparent" className="cursor-pointer" />
                                  <text x={x} y={y - 4} fill="white" fontSize="3.5" textAnchor="middle" className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">{d.bmi}</text>
                                </g>
                              );
                          })}
                        </>
                      )}
                    </svg>
                  </div>
                  
                  {/* X-axis Labels */}
                  <div className="absolute left-6 right-0 bottom-0 h-6 flex justify-between items-end text-[10px] text-zinc-500 px-1">
                    {[0, 1, 2, 3].map((mIndex) => {
                      let labelDate;
                      if (mIndex === 3) {
                        labelDate = end;
                      } else {
                        labelDate = new Date(start.getFullYear(), start.getMonth() + mIndex, 1);
                      }
                      const quarterDuration = end.getTime() - start.getTime();
                      const xPercent = ((labelDate.getTime() - start.getTime()) / quarterDuration) * 100;
                      return (
                        <span key={mIndex} className="absolute transform -translate-x-1/2" style={{left: `${xPercent}%`}}>
                          {labelDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}