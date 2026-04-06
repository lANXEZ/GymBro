"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Loader2 } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";
import { fetchWorkoutPlans, API_BASE_URL } from "../../lib/apiClient";

interface Plan {
  plan_id: string | number;
  plan_name: string;
  description: string;
  provider_id: string | number;
}

interface Exercise {
  ExMoveID?: string | number;
  ex_move_id?: string | number;
  Description?: string;
  name?: string;
  muscle_group?: string;
  user_id?: string | number;
  UserID?: string | number;
  provider_id?: string | number;
}

export default function ManageWorkoutsPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<"plans" | "exercises">("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [planToSend, setPlanToSend] = useState<number | null>(null);
  const [sendReceiverId, setSendReceiverId] = useState('');
  const [sendReceiverUsername, setSendReceiverUsername] = useState('');
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  // Edit Exercise Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExId, setEditingExId] = useState<string | number | null>(null);
  const [editExDesc, setEditExDesc] = useState('');
  const [editExSteps, setEditExSteps] = useState('');
  const [editExCaution, setEditExCaution] = useState('');
  const [editExUrl, setEditExUrl] = useState('');
  const [editExRecordType, setEditExRecordType] = useState('weight'); // weight / time
  const [editExAccessibility, setEditExAccessibility] = useState('public'); // public / private
  const [editExProgressType, setEditExProgressType] = useState('increase'); // increase / decrease
  const [savingExercise, setSavingExercise] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Stop loading automatically if user is authenticated but missing a token for some reason.
      if (!user?.id || !token) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Fetch plans and filter by provider_id == user.id
        const allPlans = await fetchWorkoutPlans(token);
        const userPlans = (allPlans || []).filter((plan: Plan) => String(plan.provider_id) === String(user.id));
        
        // Fetch exercises and filter by user_id == user.id
        const exercisesResponse = await fetch(`${API_BASE_URL}/api/workout/exercises`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const allExercises = await exercisesResponse.json().catch(() => []);
        // adjust filter depending on how your API returns the exercise user id
        const userExercises = (allExercises.data || allExercises || []).filter((ex: any) => 
          String(ex.provider_id) === String(user.id) || 
          String(ex.user_id) === String(user.id) || 
          String(ex.UserID) === String(user.id)
        );

        setPlans(userPlans);
        setExercises(userExercises);
      } catch (error) {
        console.error("Error fetching library data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, token]);

  const handleDeletePlan = async (id: string | number) => {
    if (!token) return;

    if (confirm("Are you sure you want to delete this plan?")) {
      try {
        await fetch(`${API_BASE_URL}/api/workout-plan/${id}`, {
          method: 'DELETE',
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        setPlans(plans.filter((p) => p.plan_id !== id));
      } catch (error) {
        console.error("Error deleting plan:", error);
        alert("Failed to delete plan");
      }
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

  const handleOpenEditExercise = async (id: string | number, currentName: string) => {
    if (!token) return;
    setEditingExId(id);
    setEditExDesc(currentName);
    setEditExSteps('Loading...');
    setEditExCaution('');
    setEditExUrl('');
    setIsEditModalOpen(true);
    setSavingExercise(false);

    try {
      const getRes = await fetch(`${API_BASE_URL}/api/workout/exercise/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (getRes.ok) {
        const data = await getRes.json();
        setEditExSteps(data.Steps || data.steps || "");
        setEditExCaution(data.Caution || data.caution || "");
        setEditExUrl(data.URL || data.url || "");
        setEditExRecordType(data.RecordType || data.record_type || "weight");
        setEditExAccessibility(data.Accessibility || data.accessibility || "public");
        setEditExProgressType(data.ProgressType || data.progress_type || "increase");
      } else {
        setEditExSteps('Failed to load steps.');
      }
    } catch (error) {
      console.error("Failed to fetch exercise details:", error);
      setEditExSteps('Failed to load steps.');
    }
  };

  const handleUpdateExercise = async () => {
    if (!token || !editingExId) return;
    if (!editExDesc || !editExSteps) {
      alert("Description and Steps are required!");
      return;
    }

    setSavingExercise(true);
    try {
      const currentEx = {
        description: editExDesc,
        steps: editExSteps,
        caution: editExCaution,
        url: editExUrl,
        record_type: editExRecordType,
        accessibility: editExAccessibility,
        progress_type: editExProgressType
      };
      
      const response = await fetch(`${API_BASE_URL}/api/workout/exercise/${editingExId}`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(currentEx)
      });
      
      if (!response.ok) throw new Error("Failed to update exercise");
      
      setExercises(exercises.map(ex => {
        const exId = ex.ExMoveID || ex.ex_move_id;
        if (exId === editingExId) {
          return { ...ex, Description: editExDesc, name: editExDesc };
        }
        return ex;
      }));

      setIsEditModalOpen(false);
      setEditingExId(null);
    } catch (error) {
      console.error("Error updating exercise:", error);
      alert("Failed to update exercise.");
    } finally {
      setSavingExercise(false);
    }
  };

  const handleDeleteExercise = async (id: string | number) => {
    if (!token) return;

    if (confirm("Are you sure you want to delete this exercise?")) {
      try {
        // Adjust endpoint if necessary
        const targetId = id;
        await fetch(`${API_BASE_URL}/api/workout/exercise/${targetId}`, {
          method: 'DELETE',
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        setExercises(exercises.filter((e) => e.ex_move_id !== id && e.ExMoveID !== id));
      } catch (error) {
        console.error("Error deleting exercise:", error);
        alert("Failed to delete exercise");
      }
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center h-64">
        <p className="text-xl text-zinc-500">Please log in to manage your library.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-24 px-4 pt-8">
      <header className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">Library Manager</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage your custom routines and exercises.</p>
        </div>
        <Link 
          href="/workouts/create" 
          className="bg-pink-600 hover:bg-pink-700 text-zinc-900 dark:text-white font-semibold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-pink-600/20 whitespace-nowrap"
        >
          + Create New
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <button
          className={`pb-3 px-2 font-medium text-lg border-b-2 transition-colors ${
            activeTab === "plans"
              ? "border-pink-500 text-pink-500"
              : "border-transparent text-zinc-500 hover:text-zinc-600 dark:text-zinc-300"
          }`}
          onClick={() => setActiveTab("plans")}
        >
          My Plans
        </button>
        <button
          className={`pb-3 px-2 font-medium text-lg border-b-2 transition-colors ${
            activeTab === "exercises"
              ? "border-pink-500 text-pink-500"
              : "border-transparent text-zinc-500 hover:text-zinc-600 dark:text-zinc-300"
          }`}
          onClick={() => setActiveTab("exercises")}
        >
          My Exercises
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin mb-4"></div>
              <p className="text-zinc-500 text-center animate-pulse">Loading your library...</p>
           </div>
        ) : activeTab === "plans" ? (
          <>
            {plans.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
                <p className="text-zinc-500 text-lg">No plans found. Create one to get started!</p>
              </div>
            ) : (
              plans.map((plan) => (
                <div key={plan.plan_id} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center transition-all hover:border-zinc-300 dark:border-zinc-700">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{plan.plan_name}</h3>
                    {plan.description && <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{plan.description}</p>}
                  </div>
                  <div className="flex space-x-3">
                    <Link 
                      href={`/workouts/create?planId=${plan.plan_id}`}
                      className="text-pink-500 hover:text-pink-400 font-medium px-4 py-2 bg-pink-500/10 rounded-xl transition-colors"
                    >
                      Edit
                    </Link>
                    <button 
                      onClick={() => { setPlanToSend(plan.plan_id as number); setIsSendModalOpen(true); }}
                      className="text-blue-500 hover:text-blue-400 font-medium px-4 py-2 bg-blue-500/10 rounded-xl transition-colors"
                    >
                      Send
                    </button>
                    <button 
                      onClick={() => handleDeletePlan(plan.plan_id)}
                      className="text-red-500 hover:text-red-400 font-medium px-4 py-2 bg-red-500/10 rounded-xl transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {exercises.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
                <p className="text-zinc-500 text-lg">No exercises found. Add some custom moves!</p>
              </div>
            ) : (
              exercises.map((exercise) => {
                const exId = exercise.ExMoveID || exercise.ex_move_id;
                const exName = exercise.Description || exercise.name;
                const exMuscle = exercise.muscle_group || "";
                
                return (
                  <div key={exId} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center transition-all hover:border-zinc-300 dark:border-zinc-700">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{exName}</h3>
                      {exMuscle && (
                        <span className="inline-block mt-2 text-xs font-semibold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-xl">
                          {exMuscle}
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleOpenEditExercise(exId!, exName || "")}
                        className="text-pink-500 hover:text-pink-400 font-medium px-4 py-2 bg-pink-500/10 rounded-xl transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteExercise(exId!)}
                        className="text-red-500 hover:text-red-400 font-medium px-4 py-2 bg-red-500/10 rounded-xl transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>

      {/* Send Plan Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
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

      {/* Edit Exercise Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Exercise</h3>
              <button onClick={() => {
                setIsEditModalOpen(false);
                setEditingExId(null);
              }} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">Description *</label>
                <input 
                  type="text" 
                  value={editExDesc} onChange={e => setEditExDesc(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-pink-500"
                  placeholder="e.g., Barbell Bench Press"
                />
              </div>
              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">Steps *</label>
                <textarea 
                  value={editExSteps} onChange={e => setEditExSteps(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-pink-500 min-h-20"
                  placeholder="1. Lie on bench... 2. Unrack bar..."
                />
              </div>
              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">Caution (Optional)</label>
                <input 
                  type="text" 
                  value={editExCaution} onChange={e => setEditExCaution(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-pink-500"
                  placeholder="e.g., Use a spotter"
                />
              </div>
              <div>
                <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">Video URL (Optional)</label>
                <input 
                  type="text" 
                  value={editExUrl} onChange={e => setEditExUrl(e.target.value)}
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
                      onClick={() => setEditExRecordType('weight')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${editExRecordType === 'weight' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Weight/Reps</button>
                    <button 
                      onClick={() => setEditExRecordType('time')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${editExRecordType === 'time' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Time</button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-600 dark:text-zinc-300 text-sm pl-2">Accessibility</span>
                  <div className="flex bg-white dark:bg-zinc-900 rounded-lg p-1">
                    <button 
                      onClick={() => setEditExAccessibility('public')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${editExAccessibility === 'public' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Public</button>
                    <button 
                      onClick={() => setEditExAccessibility('private')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${editExAccessibility === 'private' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Private</button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-600 dark:text-zinc-300 text-sm pl-2">Progress Goal</span>
                  <div className="flex bg-white dark:bg-zinc-900 rounded-lg p-1">
                    <button 
                      onClick={() => setEditExProgressType('increase')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${editExProgressType === 'increase' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Increase</button>
                    <button 
                      onClick={() => setEditExProgressType('decrease')}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${editExProgressType === 'decrease' ? 'bg-pink-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                    >Decrease</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex gap-3">
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingExId(null);
                }}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateExercise}
                disabled={savingExercise}
                className="flex-1 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-zinc-900 dark:text-white font-medium py-3 rounded-xl transition-colors text-sm flex justify-center items-center gap-2"
              >
                {savingExercise ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
