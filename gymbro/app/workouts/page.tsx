'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Dumbbell, Star, Loader2, ChevronDown, ChevronUp, Info, X, Zap, Edit, Trash2, Send } from 'lucide-react';
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
  provider_id?: number | null;
  user_id?: number;
  exercises: ExerciseInfo[];
  type?: 'C' | 'S' | 'P' | 'G'; // Custom, Shared, Personal (Trainer), Ghosted
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

  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
  const [autoGenForm, setAutoGenForm] = useState({
    weight: '', height: '', goal: 'Build Muscle', experience: 'Beginner', days: 3
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [planToSend, setPlanToSend] = useState<number | null>(null);
  const [sendReceiverId, setSendReceiverId] = useState('');
  const [sendReceiverUsername, setSendReceiverUsername] = useState('');
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  // Get today's day name (e.g., 'Monday')

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => {
    const fetchPlans = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const url = user?.role === 'coach' || user?.role === 'trainer' 
          ? `${API_BASE_URL}/api/workout-plan?trainer_view=true`
          : `${API_BASE_URL}/api/workout-plan`;

        const res = await fetch(url, {
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

            const rawType = plan.type || plan.Type || plan.plan_type || plan.PlanType;
            let assumedType = rawType ? String(rawType).toUpperCase() : null;
            
            if (!assumedType) {
              const pId = plan.provider_id || (plan as any).ProviderID;
              if (pId && user?.id && String(pId) !== String(user.id)) {
                assumedType = 'P';
              } else {
                assumedType = 'C';
              }
            }
            
            return {
              ...plan,
              exercises: flatExercises,
              type: assumedType
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
  }, [token, user]);

  const filteredPlans = plans.filter(p => {
    const planName = p.plan_name || (p as any).PlanName || '';
    const query = (searchQuery || '').toLowerCase();
    return planName.toLowerCase().includes(query) ||
      (p.exercises || []).some((e: any) => {
        const exerciseName = e.name || e.Name || e.exercise_name || e.ExerciseName || '';
        return exerciseName.toLowerCase().includes(query);
      });
  });

  const togglePlanExpand = (planId: number) => {
    setExpandedPlans(prev => ({ ...prev, [planId]: !prev[planId] }));
  };

  const canDeletePlan = (plan: any) => {
    if (!user) return false;
    
    const uRole = user.role?.toLowerCase() || '';
    const isTrainer = uRole === 'trainer' || uRole === 'coach';
    
    // Robustly check multiple common casing patterns just to be completely safe
    const getVal = (obj: any, keys: string[]) => {
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null) return String(obj[k]);
      }
      return "";
    };

    const planUid = getVal(plan, ['userID', 'userId', 'user_id', 'UserID']);
    const planPid = getVal(plan, ['providerID', 'providerId', 'provider_id', 'ProviderID']);

    const uid = String(user.id);
    const type = plan.type;

    if (!isTrainer) {
      if (planUid && planPid && planUid === planPid) return true;
      if (type === 'S') return true;
      return false;
    } else {
      if (uid === planUid) {
        return true;
      } else {
        if (uid === planPid && type === 'P') return true;
        return false;
      }
    }
  };

  const canEditPlan = (plan: any) => {
    return canDeletePlan(plan);
  };

  const handleAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/workout-plan/auto-generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(autoGenForm)
      });
      if (res.ok) {
        window.location.reload(); // Refresh to see the new plan
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to generate');
      }
    } catch (err) {
      console.error('Generation failed', err);
    } finally {
      setIsGenerating(false);
      setIsAutoGenerateModalOpen(false);
    }
  };

  const handleSendPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planToSend || !sendReceiverId || !sendReceiverUsername) return;
    setSendError('');
    setSendSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/workout-plan/${planToSend}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver_id: sendReceiverId,
          receiver_username: sendReceiverUsername
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send plan');
      setSendSuccess('Plan sent successfully!');
      setTimeout(() => {
        setIsSendModalOpen(false);
        setPlanToSend(null);
        setSendReceiverId('');
        setSendReceiverUsername('');
        setSendSuccess('');
      }, 2000);
    } catch (err: any) {
      setSendError(err.message);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/workout-plan/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPlans(prev => prev.filter(p => p.plan_id !== planId));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete plan");
      }
    } catch (e) {
      console.error('Failed to delete workout plan:', e);
      alert("Network error.");
    }
  };

  const handleEditPlan = async (planId: number, clientId?: number) => {
    if (clientId) {
      router.push(`/workouts/create?planId=${planId}&clientId=${clientId}`);
    } else {
      router.push(`/workouts/create?planId=${planId}`);
    }
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
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Workout Plans</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage and create your routines.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAutoGenerateModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-lg hover:scale-105"
          >
            <Zap size={20} />
            Auto Generate
          </button>
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
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
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
          {filteredPlans.some(p => p.type === 'P' || p.type === 'G') && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Star className="text-pink-500" size={24} fill="currentColor" />
                Provided by trainer
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {[0, 1].map(colIndex => (
                  <div key={colIndex} className="flex flex-col gap-6">
                    {filteredPlans.filter(p => p.type === 'P' || p.type === 'G').filter((_, i) => i % 2 === colIndex).map((plan, index) => {
                      const isGhosted = plan.type === 'G';
                      return (
                      <div key={plan.plan_id || index} className={`bg-pink-900/20 border border-pink-500/30 rounded-3xl p-6 transition-colors relative overflow-hidden ${isGhosted ? 'opacity-50 grayscale cursor-not-allowed select-none' : 'hover:border-pink-500 cursor-pointer'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <div className="flex items-start justify-between mb-4 relative z-10 gap-2">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                        <Dumbbell size={24} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5 mr-1">
                          {canEditPlan(plan) && (
                            <button onClick={(e) => { e.stopPropagation(); handleEditPlan(plan.plan_id, plan.user_id || (plan as any).UserID); }} className="text-pink-300/80 hover:text-blue-400 p-1.5 bg-pink-900/40 hover:bg-pink-900/60 rounded-lg transition-colors">
                              <Edit size={14} />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); setPlanToSend(plan.plan_id); setIsSendModalOpen(true); }} className="text-pink-300/80 hover:text-blue-400 p-1.5 bg-pink-900/40 hover:bg-pink-900/60 rounded-lg transition-colors">
                            <Send size={14} />
                          </button>
                          {canDeletePlan(plan) && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.plan_id); }} className="text-pink-300/80 hover:text-red-400 p-1.5 bg-pink-900/40 hover:bg-pink-900/60 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <span className="bg-pink-500/20 text-pink-300 text-[10px] sm:text-xs px-2.5 py-1 rounded-md sm:rounded-full font-bold uppercase tracking-wide border border-pink-500/30 whitespace-nowrap truncate shrink-0">
                          {String(plan.provider_id) === String(user?.id) ? 'By You' : 'By Coach'}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 relative z-10 flex items-center">
                      {plan.plan_name}
                      {isGhosted && <span className="ml-2 text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full uppercase tracking-widest font-semibold border border-zinc-700">Sub Ended</span>}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-300 text-sm mb-4 relative z-10 line-clamp-2">
                      {plan.exercises.map(e => e.name).join(', ') || 'No exercises listed'}
                    </p>
                    <div className="mt-auto relative z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); if(!isGhosted) togglePlanExpand(plan.plan_id); }}
                        className={`rounded-xl px-4 py-2 text-sm w-full flex items-center justify-between font-bold transition-colors ${isGhosted ? 'bg-zinc-800/40 text-zinc-500 cursor-not-allowed' : 'bg-pink-950/40 hover:bg-pink-900/60 text-pink-200'}`}
                        disabled={isGhosted}
                      >
                        <span>{plan.exercises.length} Exercises - View Program</span>
                        {expandedPlans[plan.plan_id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {!isGhosted && expandedPlans[plan.plan_id] && (
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
                                {dayExercises.map((ex, idx) => (
                                  <div
                                    key={ex.ex_move_id || idx}
                                    onClick={(e) => { e.stopPropagation(); handleExerciseClick(ex.ex_move_id); }}
                                    className={`p-2 rounded-lg text-sm flex justify-between items-center transition-colors cursor-pointer ${
                                      isToday
                                        ? 'bg-pink-800/40 text-pink-50 hover:bg-pink-700/50'
                                        : 'bg-pink-950/50 text-pink-100 hover:text-zinc-900 dark:text-white hover:bg-pink-800/50'
                                    }`}
                                  >
                                    <span>{ex.name}</span>
                                    <span className="flex items-center gap-2">
                                      {(ex as any).suggest_set_amount && (
                                        <span className="text-xs italic opacity-40">{(ex as any).suggest_set_amount} sets</span>
                                      )}
                                      <Info size={14} className={isToday ? "text-pink-300" : "text-pink-400"} />
                                    </span>
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
                    );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Custom Plans */}
          {filteredPlans.some(p => p.type === 'C') && (
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Your plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {[0, 1, 2].map(colIndex => (
                  <div key={colIndex} className="flex flex-col gap-6">
                    {filteredPlans.filter(p => p.type === 'C').filter((_, i) => i % 3 === colIndex).map((plan, index) => (
                      <div key={plan.plan_id || index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 group hover:border-pink-500/50 transition-colors cursor-pointer flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Dumbbell size={24} />
                        </div>
                          <div className="flex gap-2 items-center">
                            <>
                              {canEditPlan(plan) && (
                                <button onClick={(e) => { e.stopPropagation(); handleEditPlan(plan.plan_id); }} className="text-zinc-500 hover:text-blue-400 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors">
                                    <Edit size={14} />
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); setPlanToSend(plan.plan_id); setIsSendModalOpen(true); }} className="text-zinc-500 hover:text-blue-400 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors">
                                  <Send size={14} />
                              </button>
                              {canDeletePlan(plan) && (
                                <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.plan_id); }} className="text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors">
                                    <Trash2 size={14} />
                                </button>
                              )}
                            </>
                            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-full">Custom</span>
                          </div>
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{plan.plan_name}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4 line-clamp-2">
                        {plan.exercises.map(e => e.name).join(', ') || 'No exercises listed'}
                      </p>
                    </div>
                    <div className="mt-auto relative z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePlanExpand(plan.plan_id); }}
                        className="bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 w-full flex items-center justify-between font-medium transition-colors"
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
                            <div key={day} className={`mb-4 last:mb-0 ${isToday ? 'bg-zinc-100/50 dark:bg-zinc-800/50 p-3 rounded-xl border border-pink-500/30' : ''}`}>
                              <h4 className={`text-xs font-semibold uppercase tracking-widest mb-2 ml-1 ${isToday ? 'text-pink-400 flex items-center gap-2' : 'text-zinc-500'}`}>
                                {day}
                                {isToday && <span className="text-[10px] bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-full lowercase tracking-normal">today</span>}
                              </h4>
                              <div className="space-y-1">
                                {dayExercises.map((ex, idx) => (
                                  <div
                                    key={ex.ex_move_id || idx}
                                    onClick={(e) => { e.stopPropagation(); handleExerciseClick(ex.ex_move_id); }}
                                    className={`p-2 rounded-lg text-sm flex justify-between items-center transition-colors cursor-pointer ${
                                      isToday
                                        ? 'bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800'
                                        : 'bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800'
                                    }`}
                                  >
                                    <span>{ex.name}</span>
                                    <span className="flex items-center gap-2">
                                      {(ex as any).suggest_set_amount && (
                                        <span className="text-xs italic opacity-40">{(ex as any).suggest_set_amount} sets</span>
                                      )}
                                      <Info size={14} className={isToday ? "text-pink-500/70" : "text-zinc-500"} />
                                    </span>
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
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Imported plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredPlans.filter(p => p.type === 'S').map((plan, index) => (
                  <div key={plan.plan_id || index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 group hover:border-blue-500/50 transition-colors cursor-pointer flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Dumbbell size={24} />
                        </div>
                        <div className="flex gap-2 items-center">
                          {canEditPlan(plan) && (
                            <button onClick={(e) => { e.stopPropagation(); handleEditPlan(plan.plan_id); }} className="text-zinc-500 hover:text-blue-400 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors">
                              <Edit size={14} />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); setPlanToSend(plan.plan_id); setIsSendModalOpen(true); }} className="text-zinc-500 hover:text-blue-400 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors">
                            <Send size={14} />
                          </button>
                          {canDeletePlan(plan) && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.plan_id); }} className="text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-full">Shared</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{plan.plan_name}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4 line-clamp-2">
                        {plan.exercises.map(e => e.name).join(', ') || 'No exercises listed'}
                      </p>
                    </div>
                    <div className="mt-auto relative z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePlanExpand(plan.plan_id); }}
                        className="bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 w-full flex items-center justify-between font-medium transition-colors"
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
                            <div key={day} className={`mb-4 last:mb-0 ${isToday ? 'bg-zinc-100/50 dark:bg-zinc-800/50 p-3 rounded-xl border border-pink-500/30' : ''}`}>
                              <h4 className={`text-xs font-semibold uppercase tracking-widest mb-2 ml-1 ${isToday ? 'text-pink-400 flex items-center gap-2' : 'text-zinc-500'}`}>
                                {day}
                                {isToday && <span className="text-[10px] bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-full lowercase tracking-normal">today</span>}
                              </h4>
                              <div className="space-y-1">
                                {dayExercises.map((ex, idx) => (
                                  <div
                                    key={ex.ex_move_id || idx}
                                    onClick={(e) => { e.stopPropagation(); handleExerciseClick(ex.ex_move_id); }}
                                    className={`p-2 rounded-lg text-sm flex justify-between items-center transition-colors cursor-pointer ${
                                      isToday
                                        ? 'bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800'
                                        : 'bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800'
                                    }`}
                                  >
                                    <span>{ex.name}</span>
                                    <span className="flex items-center gap-2">
                                      {(ex as any).suggest_set_amount && (
                                        <span className="text-xs italic opacity-40">{(ex as any).suggest_set_amount} sets</span>
                                      )}
                                      <Info size={14} className={isToday ? "text-pink-500/70" : "text-zinc-500"} />
                                    </span>
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
                <Dumbbell className="text-pink-500" size={24} />
                Exercise Details
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full transition-colors"
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
                    <p className="text-zinc-700 dark:text-zinc-200">{selectedExercise.Description}</p>
                  </div>
                  
                  {selectedExercise.Steps && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">Steps</h4>
                      <div className="bg-zinc-50/50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50 space-y-2">
                        {selectedExercise.Steps.split(/(?=\d+\.\s)/).filter(s => s.trim()).map((step, idx) => (
                          <p key={idx} className="text-zinc-600 dark:text-zinc-300">
                            {step.trim()}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedExercise as any).SuggestSetAmount && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                      Suggested set amount: {(selectedExercise as any).SuggestSetAmount}
                    </p>
                  )}
                  
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
                    <span className="bg-zinc-100 dark:bg-zinc-800 text-xs px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-300">
                      Record: {selectedExercise.RecordType || 'N/A'}
                    </span>
                    <span className="bg-zinc-100 dark:bg-zinc-800 text-xs px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-300">
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
                <Plus className="text-pink-500" size={24} />
                Create Workout Plan
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full transition-colors"
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
                className="w-full flex items-center justify-start gap-4 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-pink-900/30 hover:border-pink-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-700 group-hover:bg-pink-500/20 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:text-pink-400 transition-colors">
                  <Dumbbell size={24} />
                </div>
                <div className="text-left">
                  <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-pink-100 transition-colors">Manual Create</span>
                  <span className="block text-sm text-zinc-500 dark:text-zinc-400">Design your own plan from scratch</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsAutoGenerateModalOpen(true);
                }}
                className="w-full flex items-center justify-start gap-4 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-purple-900/30 hover:border-purple-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-700 group-hover:bg-purple-500/20 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:text-purple-400 transition-colors">
                  <Zap size={24} />
                </div>
                <div className="text-left">
                  <span className="block text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-100 transition-colors">Auto Generate</span>
                  <span className="block text-sm text-purple-400 font-medium">Use AI to generate</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Generate Modal */}
      {isAutoGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full relative">
            <button onClick={() => setIsAutoGenerateModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Zap className="text-purple-500" /> AI Generate Plan</h3>
            <form onSubmit={handleAutoGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400">Weight (kg)</label>
                  <input type="number" required value={autoGenForm.weight} onChange={e => setAutoGenForm({...autoGenForm, weight: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 mt-1 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400">Height (cm)</label>
                  <input type="number" required value={autoGenForm.height} onChange={e => setAutoGenForm({...autoGenForm, height: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 mt-1 text-white" />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-400">Goal</label>
                <select value={autoGenForm.goal} onChange={e => setAutoGenForm({...autoGenForm, goal: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 mt-1 text-white">
                  <option>Build Muscle</option>
                  <option>Lose Weight</option>
                  <option>Increase Endurance</option>
                  <option>Maintain Health</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-400">Experience</label>
                <select value={autoGenForm.experience} onChange={e => setAutoGenForm({...autoGenForm, experience: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 mt-1 text-white">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-400">Days per week</label>
                <select value={autoGenForm.days} onChange={e => setAutoGenForm({...autoGenForm, days: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 mt-1 text-white">
                  {[2, 3, 4, 5, 6].map(d => <option key={d} value={d}>{d} Days</option>)}
                </select>
              </div>

              <button type="submit" disabled={isGenerating} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                {isGenerating ? 'Generating...' : 'Generate with AI ✨'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Send Plan Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md relative">
            <button onClick={() => setIsSendModalOpen(false)} className="absolute right-4 top-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Send Plan to User</h3>
            {sendError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">{sendError}</div>}
            {sendSuccess && <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-4 text-sm">{sendSuccess}</div>}
            <form onSubmit={handleSendPlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Receiver User ID</label>
                <input
                  type="text"
                  required
                  value={sendReceiverId}
                  onChange={(e) => setSendReceiverId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500"
                  placeholder="e.g. 123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Receiver Username</label>
                <input
                  type="text"
                  required
                  value={sendReceiverUsername}
                  onChange={(e) => setSendReceiverUsername(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500"
                  placeholder="e.g. bro_lifter"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-500 text-white rounded-xl py-3 font-semibold transition-colors mt-6"
              >
                Send Plan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}