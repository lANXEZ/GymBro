'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, UserPlus, FileText, Dumbbell, Loader2, Edit, ChevronDown, ChevronUp, X, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchClients, fetchWorkout, fetchUserProfile, fetchWorkoutPlans, fetchRecentPlanId, fetchBodyStatsHistory, inviteClient } from '../lib/apiClient';
import { Suspense } from 'react';

function CoachDashboardContent() {
  const { token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get('clientId');
  
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Client specifics
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [clientWorkouts, setClientWorkouts] = useState<any[]>([]);
  const [clientPlans, setClientPlans] = useState<any[]>([]);
  const [clientRecentPlanId, setClientRecentPlanId] = useState<number | string | null>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<any | null>(null);
  const [bmiData, setBmiData] = useState<{date: Date, bmi: number}[]>([]);
  const [bmiIntervalOffset, setBmiIntervalOffset] = useState(0);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteClientId, setInviteClientId] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleInviteClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setInviteError('');
    setInviteSuccess('');
    setIsInviting(true);
    try {
      await inviteClient(token, Number(inviteClientId), inviteUsername);
      setInviteSuccess('Client added successfully!');
      const updatedClients = await fetchClients(token);
      setClients(updatedClients);
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess('');
        setInviteClientId('');
        setInviteUsername('');
      }, 1500);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to add client. Check details and ensure they are upgraded.');
    } finally {
      setIsInviting(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClients(token).then((data) => {
        setClients(data);
        if (clientIdParam && data) {
          const client = data.find((c: any) => String(c.client_id || c.user_id || c.UserID || c.id) === clientIdParam);
          if (client) {
            setSelectedClient(client);
          }
        }
      }).catch((err) => {
        console.error("Failed to fetch clients", err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [token, clientIdParam]);

  useEffect(() => {
    if (token && selectedClient) {
      const targetId = selectedClient.client_id || selectedClient.user_id || selectedClient.UserID || selectedClient.id;
      setClientLoading(true);
      Promise.all([
        fetchUserProfile(token, targetId).catch(() => null),
        fetchWorkout(token, '', 5, targetId).catch(() => []),
        fetchWorkoutPlans(token, targetId).catch(() => []),
        fetchRecentPlanId(token, targetId).catch(() => null),
        fetchBodyStatsHistory(token, targetId).catch(() => [])
      ]).then(([profile, workouts, plans, recentPlan, stats]) => {
        setClientProfile(profile);
        setClientWorkouts(Array.isArray(workouts) ? workouts : []);
        
        let calcBmi: {date: Date, bmi: number}[] = [];
        if (Array.isArray(stats)) {
          calcBmi = stats.map((s: any) => {
            const w = parseFloat(s.UserWeight);
            const h = parseFloat(s.UserHeight) / 100;
            const bmi = w / (h * h);
            return {
              date: new Date(s.SessionDate),
              bmi: parseFloat(bmi.toFixed(1))
            };
          });
          calcBmi.sort((a, b) => a.date.getTime() - b.date.getTime());
        }
        setBmiData(calcBmi);
        
        const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const mappedPlans = (Array.isArray(plans) ? plans : []).map((plan: any) => {
          let flatExercises = plan.exercises || [];
          if (plan.days && Array.isArray(plan.days)) {
            flatExercises = [];
            plan.days.forEach((d: any) => {
              const dayName = typeof d.day === 'number' ? DAY_NAMES[d.day] : d.day_name || 'Uncategorized';
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
            exercises: flatExercises
          };
        });
        
        setClientPlans(mappedPlans);
        setClientRecentPlanId(recentPlan?.plan_id || null);
      }).finally(() => {
        setClientLoading(false);
      });
    } else {
      setClientProfile(null);
      setClientWorkouts([]);
      setClientPlans([]);
      setClientRecentPlanId(null);
      setBmiData([]);
    }
  }, [token, selectedClient]);

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Coach Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your clients and their plans.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-5 py-2.5 rounded-full font-medium transition-colors"
          >
            <UserPlus size={20} />
            Invite Client
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Clients List */}
        <div className="md:col-span-1 border-r border-zinc-200 dark:border-zinc-800 pr-6 space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-pink-500" />
            My Clients
          </h2>
          <div className="space-y-2">
            {loading ? (
              <p className="text-zinc-500 text-sm">Loading clients...</p>
            ) : clients.length === 0 ? (
              <p className="text-zinc-500 text-sm">No clients assigned yet.</p>
            ) : (
              clients.map((client) => (
                <div 
                  key={client.client_id || client.user_id || client.UserID || client.id} 
                  onClick={() => setSelectedClient(client)}
                  className={`p-3 bg-white dark:bg-zinc-900 border rounded-xl cursor-pointer transition-colors ${
                    (selectedClient?.client_id && selectedClient.client_id === client.client_id) ||
                    (selectedClient?.user_id && selectedClient.user_id === client.user_id) ||
                    (selectedClient?.UserID && selectedClient.UserID === client.UserID) ||
                    (selectedClient?.id && selectedClient.id === client.id)
                      ? 'border-pink-500'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-500/50'
                  }`}
                >
                  <p className="font-semibold text-zinc-700 dark:text-zinc-200">{client.FirstName} {client.LastName}</p>
                  <p className={`text-xs ${client.Status === 'Active' ? 'text-green-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {client.Status || 'Training client'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Client Viewer Placeholder */}
        <div className="md:col-span-3">
          {selectedClient ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl min-h-[400px]">
              {clientLoading ? (
                <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">Loading client data...</div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
                        {clientProfile?.FirstName || selectedClient.FirstName} {clientProfile?.LastName || selectedClient.LastName}
                      </h3>
                      <p className="text-zinc-500 dark:text-zinc-400">Username: @{clientProfile?.Username || selectedClient.Username}</p>
                      {(clientProfile?.Weight || clientProfile?.Height) ? (
                        <p className="text-zinc-500 mt-2 text-sm">
                          {clientProfile.Height ? `Height: ${clientProfile.Height} cm ` : ''} 
                          {clientProfile.Weight ? `Weight: ${clientProfile.Weight} kg` : ''}
                        </p>
                      ) : null}
                    </div>
                    <button 
                      onClick={() => {
                        const targetId = selectedClient?.client_id || selectedClient?.user_id || selectedClient?.UserID || selectedClient?.id;
                        if (targetId) {
                          router.push(`/workouts/create?clientId=${targetId}`);
                        }
                      }}
                      className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                    >
                      <Dumbbell size={18} />
                      Create Plan
                    </button>
                  </div>

                  {/* BMI History Chart */}
                  <div className="bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 min-h-[350px] flex flex-col mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="text-pink-500" />
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">BMI History</h2>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
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
                    <div className="flex-1 bg-zinc-100/30 dark:bg-zinc-800/30 rounded-2xl border border-zinc-800/50 p-4 relative flex flex-col min-h-[200px]">
                      <div className="w-full h-full flex flex-col relative">
                        <div className="flex-1 flex pl-6 pb-6 relative">
                          <div className="absolute left-0 top-0 bottom-6 w-6 flex flex-col justify-between items-start text-[10px] text-zinc-500">
                            <span>{filteredBmi.length > 0 ? Math.ceil(Math.max(...filteredBmi.map(b => b.bmi)) + 1) : 30}</span>
                            <span>{filteredBmi.length > 0 ? ((Math.ceil(Math.max(...filteredBmi.map(b => b.bmi)) + 1) + Math.floor(Math.max(0, Math.min(...filteredBmi.map(b => b.bmi)) - 1))) / 2).toFixed(1) : 25}</span>
                            <span>{filteredBmi.length > 0 ? Math.floor(Math.max(0, Math.min(...filteredBmi.map(b => b.bmi)) - 1)) : 20}</span>
                          </div>
                          
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
                                <span 
                                  key={mIndex} 
                                  className="absolute transform -translate-x-1/2 whitespace-nowrap"
                                  style={{ left: `${xPercent}%` }}
                                >
                                  {labelDate.toLocaleDateString('en-US', { month: 'short' })}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-100/50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Recent Activity</p>
                      <div className="text-zinc-900 dark:text-white font-medium mt-2">
                        {clientWorkouts.length > 0 ? (
                          <div className="space-y-3 mt-4">
                            {clientWorkouts.map((w, i) => (
                              <div key={i} className="flex justify-between items-center text-sm border-b border-zinc-700/50 pb-2 last:border-0">
                                <div>
                                  <p className="font-semibold">{w.workout_type || w.type}</p>
                                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">{new Date(w.date || w.Date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-pink-500 font-bold">{w.weight || w.Weight} kg</p>
                                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">{w.reps || w.Reps} reps</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-zinc-500 text-sm">No recent workouts</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-zinc-100/50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Current Plan</p>
                      <div className="text-zinc-900 dark:text-white font-medium mt-2">
                        {clientPlans.length > 0 ? (
                          <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
                              {[...clientPlans].reverse().map((p, i) => {
                                const isRecent = p.plan_id === clientRecentPlanId || p.PlanID === clientRecentPlanId;
                                const planIdKey = p.plan_id || p.PlanID;
                                return (
                                  <div key={planIdKey || i} className={`text-sm p-3 rounded-lg border cursor-pointer transition-colors ${isRecent ? 'bg-pink-500/10 border-pink-500/50' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:border-pink-500/50'}`} onClick={() => setViewingPlan(p)}>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                      <div className="flex items-center gap-2">
                                        <p className={`font-semibold truncate ${isRecent ? 'text-pink-500' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                          {p.plan_name || p.PlanName || `Plan #${planIdKey || i + 1}`}
                                        </p>
                                      </div>
                                      <div className="flex gap-1.5 items-center flex-wrap">
                                        {(p.provider_id === user?.id || p.ProviderID === user?.id) && (
                                           <button onClick={(e) => { e.stopPropagation(); router.push(`/workouts/create?planId=${planIdKey}&clientId=${selectedClient?.client_id || selectedClient?.user_id || selectedClient?.UserID || selectedClient?.id}`); }} className="text-zinc-500 hover:text-blue-400 mr-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md transition-colors">
                                            <Edit size={12} />
                                           </button>
                                        )}
                                        {isRecent && (
                                          <span className="text-[9px] uppercase font-bold tracking-wider text-pink-400 bg-pink-500/20 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                            Active
                                          </span>
                                        )}
                                        {(p.provider_id === user?.id || p.ProviderID === user?.id) ? (
                                          <span className="text-[9px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                            By You
                                          </span>
                                        ) : p.type === 'P' ? (
                                          <span className="text-[9px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                            By Coach
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="text-zinc-500 text-sm">None assigned</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl min-h-[400px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-600 dark:text-zinc-300 mb-2">Select a client</h3>
              <p className="text-zinc-500 max-w-sm">
                Click on a client from the list to view their progress, adjust their workout plans, or send feedback.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Plan Details Modal */}
      {viewingPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in" onClick={() => setViewingPlan(null)}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{viewingPlan.plan_name || viewingPlan.PlanName}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full flex items-center gap-2">
                    <Dumbbell size={14} className="text-pink-500" />
                    {viewingPlan.exercises?.length || 0} Exercises
                  </span>
                  {(viewingPlan.provider_id === user?.id || viewingPlan.ProviderID === user?.id) && (
                    <span className="text-sm text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">
                      By You
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setViewingPlan(null)}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {viewingPlan.exercises && viewingPlan.exercises.length > 0 ? (
                Object.entries(
                  viewingPlan.exercises.reduce((acc: any, ex: any) => {
                    const day = ex.day_of_week || 'Uncategorized';
                    if (!acc[day]) acc[day] = [];
                    acc[day].push(ex);
                    return acc;
                  }, {})
                ).map(([day, dayExs]: any) => (
                  <div key={day} className="bg-zinc-100/50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700/50">
                    <h3 className="text-xl font-bold text-pink-400 mb-4 capitalize flex items-center gap-2">
                      {day}
                      <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                        {dayExs.length} exercises
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {dayExs.map((ex: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 px-4 py-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-700 dark:text-zinc-200">{ex.name}</p>
                              {ex.muscle_group && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{ex.muscle_group}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-zinc-800/20 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                  <Dumbbell size={48} className="mx-auto text-zinc-600 mb-4" />
                  <p className="text-lg text-zinc-500 dark:text-zinc-400">No exercises found.</p>
                  <p className="text-sm text-zinc-500 mt-1">This plan is currently empty.</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-end">
              {(viewingPlan.provider_id === user?.id || viewingPlan.ProviderID === user?.id) && (
                <button 
                  onClick={() => router.push(`/workouts/create?planId=${viewingPlan.plan_id || viewingPlan.PlanID}&clientId=${selectedClient?.client_id || selectedClient?.user_id || selectedClient?.UserID || selectedClient?.id}`)}
                  className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  <Edit size={18} />
                  Edit Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Client Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Invite Client</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Enter details to invite a client.</p>

            <form onSubmit={handleInviteClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Client User ID
                </label>
                <input 
                  type="text"
                  required
                  value={inviteClientId}
                  onChange={(e) => setInviteClientId(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-mono"
                  placeholder="e.g. 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Client Username
                </label>
                <input 
                  type="text"
                  required
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  placeholder="e.g. gymrat"
                />
              </div>

              {inviteError && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm font-medium">
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-xl text-sm font-medium">
                  {inviteSuccess}
                </div>
              )}

              <button 
                type="submit"
                disabled={isInviting || !inviteClientId || !inviteUsername}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isInviting ? <Loader2 className="animate-spin" size={20} /> : 'Send Invite'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoachDashboardPage() {
  return (
    <Suspense fallback={<div className="text-zinc-900 dark:text-white text-center py-20 flex flex-col justify-center items-center"><Loader2 className="animate-spin text-pink-500 mb-4" size={32} />Loading...</div>}>
      <CoachDashboardContent />
    </Suspense>
  );
}