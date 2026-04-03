'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Dumbbell, Star, Loader2, ChevronDown, ChevronUp, Info, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/apiClient';

interface ExerciseInfo {
  ex_move_id: number;
  name: string;
  day_of_week?: string;
}

interface WorkoutPlan {
  plan_id: number;
  plan_name: string;
  exercises: ExerciseInfo[];
  type?: 'C' | 'S' | 'P'; // Custom, Shared, Personal (Trainer)
}

interface ExerciseDetails {
  ExMoveID: number;
  Steps: string;
  Description: string;
  Caution: string | null;
  RecordType: string;
  ProgressType: string;
}

export default function WorkoutsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New states for interaction
  const [expandedPlans, setExpandedPlans] = useState<Record<number, boolean>>({});
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Get today's day name (e.g., 'Monday')

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => {
    const fetchPlans = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/workout-plan`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          
          const mappedData = data.map((plan: any) => {
            let flatExercises = plan.exercises || [];
            
            if (plan.days && Array.isArray(plan.days)) {
              flatExercises = [];
              plan.days.forEach((d: any) => {
                const dayName = typeof d.day === 'number' ? DAY_NAMES[d.day] : 'Uncategorized';
                const dayExs = d.exercises || [];
                dayExs.forEach((ex: any) => {
                  flatExercises.push({
                    ...ex,
                    day_of_week: dayName
                  });
                });
              });
            }

            return {
              ...plan,
              exercises: flatExercises,
              type: plan.type || 'C'
            };
          });
          setPlans(mappedData);
        }
      } catch (err) {
        console.error('Failed to fetch workout plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [token]);

  const filteredPlans = plans.filter(p => 
    p.plan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.exercises.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const togglePlanExpand = (planId: number) => {
    setExpandedPlans(prev => ({ ...prev, [planId]: !prev[planId] }));
  };

  const handleExerciseClick = async (exMoveId: number) => {
    setIsModalOpen(true);
    setLoadingExercise(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/workout/exercise/${exMoveId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedExercise(data);
      }
    } catch (err) {
      console.error('Failed to fetch exercise details:', err);
    } finally {
      setLoadingExercise(false);
    }
  };
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Workout Plans</h1>
          <p className="text-zinc-400">Manage and create your routines.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-pink-600/20"
          >
            <Plus size={20} />
            Create Plan
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for plans or exercises..." 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-pink-500" size={32} />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Dumbbell className="mx-auto mb-4 opacity-50" size={48} />
          <p className="text-lg">No workout plans found.</p>
          <p className="text-sm">Create a new plan to get started.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Trainer / Coaching Plans */}
          {user?.role === 'training_client' && filteredPlans.some(p => p.type === 'P') && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Star className="text-pink-500" size={24} fill="currentColor" />
                Personalized Coaching Plan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {[0, 1].map(colIndex => (
                  <div key={colIndex} className="flex flex-col gap-6">
                    {filteredPlans.filter(p => p.type === 'P').filter((_, i) => i % 2 === colIndex).map((plan) => (
                      <div key={plan.plan_id} className="bg-pink-900/20 border border-pink-500/30 rounded-3xl p-6 hover:border-pink-500 transition-colors cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                        <Dumbbell size={24} />
                      </div>
                      <span className="bg-pink-500/20 text-pink-300 text-xs px-3 py-1 rounded-full font-medium border border-pink-500/30">
                        Created by Coach
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 relative z-10">{plan.plan_name}</h3>  
                    <p className="text-zinc-300 text-sm mb-4 relative z-10 line-clamp-2">
                      {plan.exercises.map(e => e.name).join(', ') || 'No exercises listed'}
                    </p>
                    <div className="mt-auto relative z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePlanExpand(plan.plan_id); }}
                        className="bg-pink-950/40 hover:bg-pink-900/60 rounded-xl px-4 py-2 text-sm text-pink-200 w-full flex items-center justify-between font-bold transition-colors"
                      >
                        <span>{plan.exercises.length} Exercises - View Program</span>
                        {expandedPlans[plan.plan_id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {expandedPlans[plan.plan_id] && (
                        <div className="mt-3 animate-in slide-in-from-top-2">
                          {Object.entries(
                            plan.exercises.reduce((acc, ex) => {
                              const day = ex.day_of_week || 'Uncategorized';
                              if (!acc[day]) acc[day] = [];
                              acc[day].push(ex);
                              return acc;
                            }, {} as Record<string, typeof plan.exercises>)
                          ).map(([day, dayExercises]) => {
                            const isToday = day === today;
                            return (
                            <div key={day} className={`mb-4 last:mb-0 ${isToday ? 'bg-pink-900/30 p-3 rounded-xl border border-pink-500/50' : ''}`}>
                              <h4 className={`text-xs font-semibold uppercase tracking-widest mb-2 ml-1 ${isToday ? 'text-pink-300 flex items-center gap-2' : 'text-pink-400/80'}`}>
                                {day} 
                                {isToday && <span className="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-full lowercase tracking-normal">today</span>}
                              </h4>
                              <div className="space-y-1">
                                {dayExercises.map(ex => (
                                  <div 
                                    key={ex.ex_move_id} 
                                    onClick={(e) => { e.stopPropagation(); handleExerciseClick(ex.ex_move_id); }}
                                    className={`p-2 rounded-lg text-sm flex justify-between items-center transition-colors cursor-pointer ${
                                      isToday 
                                        ? 'bg-pink-800/40 text-pink-50 hover:bg-pink-700/50' 
                                        : 'bg-pink-950/50 text-pink-100 hover:text-white hover:bg-pink-800/50'
                                    }`}
                                  >
                                    <span>{ex.name}</span>
                                    <Info size={14} className={isToday ? "text-pink-300" : "text-pink-400"} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )})}
                          {plan.exercises.length === 0 && (
                            <div className="text-xs text-pink-300/50 text-center py-2">No exercises added yet</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Custom Plans */}
          {filteredPlans.some(p => p.type === 'C') && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Your Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {[0, 1, 2].map(colIndex => (
                  <div key={colIndex} className="flex flex-col gap-6">
                    {filteredPlans.filter(p => p.type === 'C').filter((_, i) => i % 3 === colIndex).map((plan) => (
                      <div key={plan.plan_id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 group hover:border-pink-500/50 transition-colors cursor-pointer flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Dumbbell size={24} />
                        </div>
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">Custom</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{plan.plan_name}</h3>
                      <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                        {plan.exercises.map(e => e.name).join(', ') || 'No exercises listed'}
                      </p>
                    </div>
                    <div className="mt-auto relative z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePlanExpand(plan.plan_id); }}
                        className="bg-zinc-800/50 hover:bg-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 w-full flex items-center justify-between font-medium transition-colors"
                      >
                        <span>{plan.exercises.length} Exercises</span>
                        {expandedPlans[plan.plan_id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {expandedPlans[plan.plan_id] && (
                        <div className="mt-3 animate-in slide-in-from-top-2">
                          {Object.entries(
                            plan.exercises.reduce((acc, ex) => {
                              const day = ex.day_of_week || 'Uncategorized';
                              if (!acc[day]) acc[day] = [];
                              acc[day].push(ex);
                              return acc;
                            }, {} as Record<string, typeof plan.exercises>)
                          ).map(([day, dayExercises]) => {
                            const isToday = day === today;
                            return (
                            <div key={day} className={`mb-4 last:mb-0 ${isToday ? 'bg-zinc-800/50 p-3 rounded-xl border border-pink-500/30' : ''}`}>
                              <h4 className={`text-xs font-semibold uppercase tracking-widest mb-2 ml-1 ${isToday ? 'text-pink-400 flex items-center gap-2' : 'text-zinc-500'}`}>
                                {day}
                                {isToday && <span className="text-[10px] bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-full lowercase tracking-normal">today</span>}
                              </h4>
                              <div className="space-y-1">
                                {dayExercises.map(ex => (
                                  <div 
                                    key={ex.ex_move_id} 
                                    onClick={(e) => { e.stopPropagation(); handleExerciseClick(ex.ex_move_id); }}
                                    className={`p-2 rounded-lg text-sm flex justify-between items-center transition-colors cursor-pointer ${
                                      isToday
                                        ? 'bg-zinc-900/80 text-zinc-200 hover:text-white hover:bg-zinc-800'
                                        : 'bg-zinc-950/50 text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}
                                  >
                                    <span>{ex.name}</span>
                                    <Info size={14} className={isToday ? "text-pink-500/70" : "text-zinc-500"} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )})}
                          {plan.exercises.length === 0 && (
                            <div className="text-xs text-zinc-500 text-center py-2">No exercises added yet</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shared Plans */}
          {filteredPlans.some(p => p.type === 'S') && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Shared From Friends</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredPlans.filter(p => p.type === 'S').map((plan) => (
                  <div key={plan.plan_id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 group hover:border-blue-500/50 transition-colors cursor-pointer flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Dumbbell size={24} />
                        </div>
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">Shared</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{plan.plan_name}</h3>
                      <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                        {plan.exercises.map(e => e.name).join(', ') || 'No exercises listed'}
                      </p>
                    </div>
                    <div className="mt-auto relative z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePlanExpand(plan.plan_id); }}
                        className="bg-zinc-800/50 hover:bg-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 w-full flex items-center justify-between font-medium transition-colors"
                      >
                        <span>{plan.exercises.length} Exercises</span>
                        {expandedPlans[plan.plan_id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {expandedPlans[plan.plan_id] && (
                        <div className="mt-3 animate-in slide-in-from-top-2">
                          {Object.entries(
                            plan.exercises.reduce((acc, ex) => {
                              const day = ex.day_of_week || 'Uncategorized';
                              if (!acc[day]) acc[day] = [];
                              acc[day].push(ex);
                              return acc;
                            }, {} as Record<string, typeof plan.exercises>)
                          ).map(([day, dayExercises]) => {
                            const isToday = day === today;
                            return (
                            <div key={day} className={`mb-4 last:mb-0 ${isToday ? 'bg-zinc-800/50 p-3 rounded-xl border border-pink-500/30' : ''}`}>
                              <h4 className={`text-xs font-semibold uppercase tracking-widest mb-2 ml-1 ${isToday ? 'text-pink-400 flex items-center gap-2' : 'text-zinc-500'}`}>
                                {day}
                                {isToday && <span className="text-[10px] bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-full lowercase tracking-normal">today</span>}
                              </h4>
                              <div className="space-y-1">
                                {dayExercises.map(ex => (
                                  <div 
                                    key={ex.ex_move_id} 
                                    onClick={(e) => { e.stopPropagation(); handleExerciseClick(ex.ex_move_id); }}
                                    className={`p-2 rounded-lg text-sm flex justify-between items-center transition-colors cursor-pointer ${
                                      isToday
                                        ? 'bg-zinc-900/80 text-zinc-200 hover:text-white hover:bg-zinc-800'
                                        : 'bg-zinc-950/50 text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}
                                  >
                                    <span>{ex.name}</span>
                                    <Info size={14} className={isToday ? "text-pink-500/70" : "text-zinc-500"} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )})}
                          {plan.exercises.length === 0 && (
                            <div className="text-xs text-zinc-500 text-center py-2">No exercises added yet</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exercise Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <Dumbbell className="text-pink-500" size={24} />
                Exercise Details
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {loadingExercise ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin text-pink-500" size={32} />
                </div>
              ) : selectedExercise ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">Description</h4>
                    <p className="text-zinc-200">{selectedExercise.Description}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">Steps</h4>
                    <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50 space-y-2">
                      {selectedExercise.Steps.split(/(?=\d+\.\s)/).filter(s => s.trim()).map((step, idx) => (
                        <p key={idx} className="text-zinc-300">
                          {step.trim()}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  {selectedExercise.Caution && (
                    <div>
                      <h4 className="text-sm font-medium text-pink-500/80 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Info size={16} /> Caution
                      </h4>
                      <div className="bg-pink-500/10 border border-pink-500/20 p-4 rounded-2xl text-pink-300 text-sm">
                        {selectedExercise.Caution}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                    <span className="bg-zinc-800 text-xs px-3 py-1.5 rounded-lg text-zinc-300">
                      Record: {selectedExercise.RecordType || 'N/A'}
                    </span>
                    <span className="bg-zinc-800 text-xs px-3 py-1.5 rounded-lg text-zinc-300">
                      Progress: {selectedExercise.ProgressType || 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-zinc-500">
                  Failed to load details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Plan Options Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <Plus className="text-pink-500" size={24} />
                Create Workout Plan
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  router.push('/workouts/create');
                }}
                className="w-full flex items-center justify-start gap-4 p-4 rounded-2xl bg-zinc-800 border border-zinc-700 hover:bg-pink-900/30 hover:border-pink-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-700 group-hover:bg-pink-500/20 flex items-center justify-center text-zinc-300 group-hover:text-pink-400 transition-colors">
                  <Dumbbell size={24} />
                </div>
                <div className="text-left">
                  <span className="block text-lg font-bold text-zinc-100 group-hover:text-pink-100 transition-colors">Manual Create</span>
                  <span className="block text-sm text-zinc-400">Design your own plan from scratch</span>
                </div>
              </button>

              <button
                onClick={() => alert("Auto Generate coming soon!")}
                className="w-full flex items-center justify-start gap-4 p-4 rounded-2xl bg-zinc-800 border border-zinc-700 hover:bg-purple-900/30 hover:border-purple-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-700 group-hover:bg-purple-500/20 flex items-center justify-center text-zinc-300 group-hover:text-purple-400 transition-colors">
                  <Zap size={24} />
                </div>
                <div className="text-left">
                  <span className="block text-lg font-bold text-zinc-100 group-hover:text-purple-100 transition-colors">Auto Generate</span>
                  <span className="block text-sm text-purple-400 font-medium">Coming soon!</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}