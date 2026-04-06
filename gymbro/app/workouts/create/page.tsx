'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/apiClient';
import { ChevronLeft, Plus, Search, Dumbbell, X, Save, AlertCircle, Info, Loader2, ArrowRight, Edit, Trash2 } from 'lucide-react';

interface ExerciseMove {
  ExMoveID: number;
  Description: string;
  RecordType: string;
  ProgressType: string;
  Steps?: string;
  Caution?: string;
  URL?: string;
  Accessibility?: string;
  UserID?: number; // Needed to check ownership
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function CreatePlanContent() {
  const { token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const clientId = searchParams.get('clientId');

  const [planName, setPlanName] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  
  // plannedExercises[dayIndex] = array of ExerciseMove
  const [plannedExercises, setPlannedExercises] = useState<Record<number, ExerciseMove[]>>({});
  
  const [publicExercises, setPublicExercises] = useState<ExerciseMove[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingExercises, setLoadingExercises] = useState(true);
  
  // View Exercise Modal
  const [selectedExercise, setSelectedExercise] = useState<ExerciseMove | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Create Exercise Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newExDesc, setNewExDesc] = useState('');
  const [newExSteps, setNewExSteps] = useState('');
  const [newExCaution, setNewExCaution] = useState('');
  const [newExUrl, setNewExUrl] = useState('');
  const [newExRecordType, setNewExRecordType] = useState('weight'); // weight / time
  const [newExAccessibility, setNewExAccessibility] = useState('public'); // public / private
  const [newExProgressType, setNewExProgressType] = useState('increase'); // increase / decrease
  const [creatingExercise, setCreatingExercise] = useState(false);

  const [savingPlan, setSavingPlan] = useState(false);
  const [editingExMoveId, setEditingExMoveId] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(!!planId);
  const [deletingExercise, setDeletingExercise] = useState<number | null>(null);

  useEffect(() => {
    fetchExercises();
    if (planId) {
      fetchPlanDetails();
    }
  }, [token, planId]);

  const fetchPlanDetails = async () => {
    if (!token || !planId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/workout-plan/${planId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlanName(data.plan_name);
        // data.days: [{working_day_id, day, exercises: [{ex_move_id, name}]}]
        const mappedPlanExs: Record<number, ExerciseMove[]> = {};
        if (data.days) {
          data.days.forEach((d: any) => {
            const mappedExs = d.exercises.map((ex: any) => ({
                ExMoveID: ex.ex_move_id,
                Description: ex.name,
                RecordType: '', // We don't have this in brief plan fetch but it's fine for listing
                ProgressType: '',
            }));
            mappedPlanExs[d.day] = mappedExs;
          });
        }
        setPlannedExercises(mappedPlanExs);
      }
    } catch (e) {
      console.error("Fetch plan details failed", e);
    } finally {
      setLoadingPlan(false);
    }
  };

  const fetchExercises = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/workout/exercises`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPublicExercises(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleAddExerciseToDay = (ex: ExerciseMove) => {
    setPlannedExercises(prev => {
      const currentDayEx = prev[selectedDay] || [];
      return {
        ...prev,
        [selectedDay]: [...currentDayEx, ex]
      };
    });
    setIsViewModalOpen(false);
  };

  const handleRemoveExerciseFromDay = (dayIdx: number, idxToRemove: number) => {
    setPlannedExercises(prev => {
      const updated = [...(prev[dayIdx] || [])];
      updated.splice(idxToRemove, 1);
      return {
        ...prev,
        [dayIdx]: updated
      };
    });
  };

  const handleCreateExercise = async () => {
    if (!newExDesc || !newExSteps) {
      alert("Description and Steps are required!");
      return;
    }
    setCreatingExercise(true);
    try {
      const isEdit = editingExMoveId !== null;
      const url = isEdit 
        ? `${API_BASE_URL}/api/workout/exercise/${editingExMoveId}`
        : `${API_BASE_URL}/api/workout/create-exercise`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: newExDesc,
          steps: newExSteps,
          caution: newExCaution,
          url: newExUrl,
          record_type: newExRecordType,
          accessibility: newExAccessibility,
          progress_type: newExProgressType
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
            await fetchExercises(); // refresh public exercises to see updates
        } else {
            // Add to public/local list
            const newEx: ExerciseMove = {
              ExMoveID: data.ex_move_id,
              Description: newExDesc,
              Steps: newExSteps,
              RecordType: newExRecordType,
              ProgressType: newExProgressType,
              Caution: newExCaution,
              Accessibility: newExAccessibility,
              UserID: user?.id
            };
            if (newExAccessibility === 'public' || newExAccessibility === 'private') {
              setPublicExercises(prev => [newEx, ...prev.filter(e => e.ExMoveID !== newEx.ExMoveID)]);
            }
            // Also auto-add to the currently selected day
            handleAddExerciseToDay(newEx);
        }
        setIsCreateModalOpen(false);
        // Reset form
        setEditingExMoveId(null);
        setNewExDesc('');
        setNewExSteps('');
        setNewExCaution('');
        setNewExUrl('');
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save exercise");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingExercise(false);
    }
  };

  const handleDeleteExercise = async (id: number) => {
    if (!confirm("Are you sure you want to delete this exercise? This will delete it from all your custom plans too.")) {
        return;
    }
    setDeletingExercise(id);
    try {
        const res = await fetch(`${API_BASE_URL}/api/workout/exercise/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setPublicExercises(prev => prev.filter(ex => ex.ExMoveID !== id));
            setIsViewModalOpen(false);
        } else {
            const err = await res.json();
            alert(err.error || "Failed to delete exercise");
        }
    } catch (e) {
        console.error(e);
        alert("Network error.");
    } finally {
        setDeletingExercise(null);
    }
  };

  const handleEditExerciseClick = (ex: ExerciseMove) => {
      setIsViewModalOpen(false);
      setEditingExMoveId(ex.ExMoveID);
      setNewExDesc(ex.Description);
      setNewExSteps(ex.Steps || '');
      setNewExRecordType(ex.RecordType || 'weight');
      setNewExProgressType(ex.ProgressType || 'increase');
      setNewExCaution(ex.Caution || '');
      setNewExUrl(ex.URL || '');
      setNewExAccessibility(ex.Accessibility || 'public');
      setIsCreateModalOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planName) {
      alert("Please enter a plan name.");
      return;
    }
    
    let hasAnyExercise = false;
    const daysArray: { day: number; exercises: { ex_move_id: number }[] }[] = [];
    
    Object.keys(plannedExercises).forEach(dIdx => {
      const exList = plannedExercises[Number(dIdx)];
      if (exList && exList.length > 0) {
        hasAnyExercise = true;
        daysArray.push({
          day: Number(dIdx),
          exercises: exList.map(ex => ({ ex_move_id: ex.ExMoveID }))
        });
      }
    });

    if (!hasAnyExercise) {
      alert("Please add at least one exercise to your plan.");
      return;
    }

    setSavingPlan(true);
    try {
      const url = planId 
        ? `${API_BASE_URL}/api/workout-plan/${planId}` 
        : `${API_BASE_URL}/api/workout-plan/create`;
      const method = planId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_name: planName,
          type: clientId ? "P" : "C", // P for Coach provided, C for Custom
          user_id: clientId ? Number(clientId) : user?.id,
          days: daysArray
        })
      });

      if (res.ok) {
        if (clientId) {
          router.push(`/coach?clientId=${clientId}`);
        } else {
          router.push('/workouts');
        }
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save plan");
      }
    } catch (e) {
      console.error(e);
      alert("Network error while saving plan.");
    } finally {
      setSavingPlan(false);
    }
  };

const filteredExercises = (publicExercises || []).filter(ex =>
        (ex?.Description || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-24">
      <header className="flex flex-col gap-4 mb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 p-2.5 rounded-full text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{planId ? 'Edit Plan' : 'Custom Plan'}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">{planId ? 'Update your workout routine.' : 'Design your perfect workout routine manually.'}</p>
          </div>
        </div>
      </header>

      {/* Plan Name */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
        <label className="block text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-2 uppercase tracking-wide">
          Plan Name
        </label>
        <input 
          type="text"
          value={planName}
          onChange={e => setPlanName(e.target.value)}
          placeholder="e.g., Summer Shredding, Push Day Focus..."
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-pink-500/50 rounded-2xl py-4 px-5 text-zinc-900 dark:text-white text-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
        />
      </div>

      {/* Days Selector */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Select Day to Edit</h2>
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {DAYS.map((day, idx) => (
            <button
              key={day}
              onClick={() => setSelectedDay(idx)}
              className={`whitespace-nowrap px-6 py-3 rounded-2xl font-medium transition-all flex flex-col items-center gap-1 ${selectedDay === idx ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20 scale-105 transform origin-bottom' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:text-zinc-200'}`}
            >
              <span>{day.substring(0, 3)}</span>
              {(plannedExercises[idx] && plannedExercises[idx].length > 0) && (
                <div className={`w-1.5 h-1.5 rounded-full ${selectedDay === idx ? 'bg-white' : 'bg-pink-500'}`} />
              )}
            </button>
          ))}
        </div>

        {/* Selected Day Box */}
        <div className="mt-8">
          <h3 className="text-zinc-900 dark:text-white font-medium mb-3 flex items-center justify-between">
            <span>Exercises for {DAYS[selectedDay]}</span>
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-zinc-500 dark:text-zinc-400">
              {(plannedExercises[selectedDay] || []).length} added
            </span>
          </h3>
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-800/50 rounded-2xl p-4 min-h-[120px] transition-all">
            {(plannedExercises[selectedDay] && plannedExercises[selectedDay].length > 0) ? (
              <div className="space-y-3">
                {plannedExercises[selectedDay].map((ex, exIdx) => (
                  <div key={`${ex.ExMoveID}-${exIdx}`} className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-pink-500/10 p-2 rounded-lg text-pink-500">
                        <Dumbbell size={16} />
                      </div>
                      <div>
                        <p className="text-zinc-900 dark:text-white text-sm font-medium">{ex.Description}</p>
                        <p className="text-zinc-500 text-xs">
                          {ex.RecordType === 'time' ? 'Time-based' : 'Weight/Reps'} • {ex.ProgressType === 'increase' ? 'Progressive' : 'Endurance'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveExerciseFromDay(selectedDay, exIdx)}
                      className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-60">
                <ArrowRight className="mb-2 rotate-90 md:rotate-0 md:-ml-12 md:mb-0 md:absolute md:opacity-0" size={20} />
                <p className="text-sm">Select exercises from the list below to add them to {DAYS[selectedDay]}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Public Exercises List & Search */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Exercise Library</h2>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Create Your Own
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..." 
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
          />
        </div>

        {loadingExercises ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-pink-500" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {filteredExercises.map(ex => (
              <div 
                key={ex.ExMoveID}
                onClick={() => { setSelectedExercise(ex); setIsViewModalOpen(true); }}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-pink-500/30 p-4 rounded-2xl cursor-pointer transition-colors group flex justify-between items-center"
              >
                <div>
                  <p className="text-zinc-900 dark:text-white font-medium group-hover:text-pink-100 transition-colors flex items-center gap-2">
                    {ex.Description}
                    {ex.UserID === user?.id && (
                        <span className="bg-pink-900/50 text-pink-300 text-[10px] px-2 py-0.5 rounded-full border border-pink-500/20">Custom</span>
                      )}
                      {ex.Accessibility === 'public' && (
                          <span className="bg-blue-900/50 text-blue-300 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20">Public</span>
                      )}
                    </p>
                  <p className="text-xs text-zinc-500 mt-1">{ex.RecordType === 'time' ? 'Time' : 'Weight/Reps'}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-pink-600 group-hover:text-zinc-900 dark:text-white transition-colors shrink-0">
                  <Plus size={16} />
                </div>
              </div>
            ))}
            {filteredExercises.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 text-sm">
                No exercises found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Save Bar */}
      <div className="fixed bottom-20 md:bottom-0 left-0 md:left-64 right-0 p-4 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800/50 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {Object.values(plannedExercises).reduce((a, b) => a + b.length, 0)} total exercises
          </div>
          <button 
            onClick={handleSavePlan}
            disabled={savingPlan}
            className="w-full md:w-auto bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 dark:text-white px-8 py-3.5 rounded-full font-bold transition-colors shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2"
          >
            {savingPlan ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {planId ? 'Update Plan' : 'Confirm Creating Plan'}
          </button>
        </div>
      </div>

      {/* View Exercise Modal */}
      {isViewModalOpen && selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
             onClick={(e) => {
               if (e.target === e.currentTarget) setIsViewModalOpen(false);
             }}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white pr-4">{selectedExercise.Description}</h3>
                  {selectedExercise.UserID === user?.id && (
                      <div className="flex gap-2">
                          <button onClick={() => handleEditExerciseClick(selectedExercise)} className="text-zinc-500 dark:text-zinc-400 hover:text-blue-400 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg transition-colors">
                              <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteExercise(selectedExercise.ExMoveID)} disabled={deletingExercise === selectedExercise.ExMoveID} className="text-zinc-500 dark:text-zinc-400 hover:text-red-400 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg transition-colors disabled:opacity-50">
                              {deletingExercise === selectedExercise.ExMoveID ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                      </div>
                  )}
              </div>
              
              {selectedExercise.Steps && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Steps</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{selectedExercise.Steps}</p>
                </div>
              )}
              {selectedExercise.Caution && (
                <div className="mb-4 bg-pink-500/10 border border-pink-500/20 p-3 rounded-xl text-pink-300 text-sm flex gap-2">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <p>{selectedExercise.Caution}</p>
                </div>
              )}
              <div className="flex gap-2">
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-600 dark:text-zinc-300">
                  {selectedExercise.RecordType || 'weight'}
                </span>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <button 
                onClick={() => handleAddExerciseToDay(selectedExercise)}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Add to {DAYS[selectedDay]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Exercise Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
             onClick={(e) => {
               if (e.target === e.currentTarget) setIsCreateModalOpen(false);
             }}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Plus className="text-pink-500" size={20} />
                {editingExMoveId ? 'Edit Exercise' : 'Create Exercise'}
              </h3>
              <button onClick={() => {
                setIsCreateModalOpen(false);
                setEditingExMoveId(null);
              }} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">Description *</label>
                <input 
                  type="text" 
                  value={newExDesc} onChange={e => setNewExDesc(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-pink-500"
                  placeholder="e.g., Barbell Bench Press"
                />
              </div>
              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">Steps *</label>
                <textarea 
                  value={newExSteps} onChange={e => setNewExSteps(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-pink-500 min-h-[80px]"
                  placeholder="1. Lie on bench... 2. Unrack bar..."
                />
              </div>
              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">Caution (Optional)</label>
                <input 
                  type="text" 
                  value={newExCaution} onChange={e => setNewExCaution(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-pink-500"
                  placeholder="e.g., Use a spotter"
                />
              </div>
              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">Video URL (Optional)</label>
                <input 
                  type="text" 
                  value={newExUrl} onChange={e => setNewExUrl(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-pink-500"
                  placeholder="https://youtube.com/..."
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-600 dark:text-zinc-300 text-sm pl-2">Record Type</span>
                  <div className="flex bg-white dark:bg-zinc-900 rounded-lg p-1">
                    <button 
                      onClick={() => setNewExRecordType('weight')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${newExRecordType === 'weight' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Weight/Reps</button>
                    <button 
                      onClick={() => setNewExRecordType('time')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${newExRecordType === 'time' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Time</button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-600 dark:text-zinc-300 text-sm pl-2">Accessibility</span>
                  <div className="flex bg-white dark:bg-zinc-900 rounded-lg p-1">
                    <button 
                      onClick={() => setNewExAccessibility('public')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${newExAccessibility === 'public' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Public</button>
                    <button 
                      onClick={() => setNewExAccessibility('private')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${newExAccessibility === 'private' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Private</button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-600 dark:text-zinc-300 text-sm pl-2">Progress Goal</span>
                  <div className="flex bg-white dark:bg-zinc-900 rounded-lg p-1">
                    <button 
                      onClick={() => setNewExProgressType('increase')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${newExProgressType === 'increase' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Increase</button>
                    <button 
                      onClick={() => setNewExProgressType('decrease')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${newExProgressType === 'decrease' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Decrease</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex gap-3">
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingExMoveId(null);
                }}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateExercise}
                disabled={creatingExercise}
                className="flex-1 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-zinc-900 dark:text-white font-medium py-3 rounded-xl transition-colors text-sm flex justify-center items-center gap-2"
              >
                {creatingExercise ? <Loader2 size={16} className="animate-spin" /> : null}
                {editingExMoveId ? 'Save Changes' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatePlanPage() {
  return (
    <Suspense fallback={<div className="text-zinc-900 dark:text-white text-center py-20 flex flex-col justify-center items-center"><Loader2 className="animate-spin text-pink-500 mb-4" size={32} />Loading...</div>}>
      <CreatePlanContent />
    </Suspense>
  );
}
