'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/apiClient';

type WorkoutStep = 'SELECT_PLAN' | 'SELECT_DAY' | 'RECORD_BODY_STATS' | 'SELECT_EXERCISE' | 'ACTIVE_WORKOUT';

interface WorkoutCoordinatorProps {
  onClose: () => void;
}

export default function WorkoutCoordinator({ onClose }: WorkoutCoordinatorProps) {
  const { user, token } = useAuth();
  const [step, setStep] = useState<WorkoutStep>('SELECT_PLAN');
  
  // States for flow progression
  const [plans, setPlans] = useState<any[]>([]);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [recentBodyStats, setRecentBodyStats] = useState<{ userWeight: number; userHeight: number } | null>(null);
  const [bodyStats, setBodyStats] = useState<{ userWeight: number; userHeight: number } | null>(null);
  
  const [draftWeight, setDraftWeight] = useState<number | ''>('');
  const [draftHeight, setDraftHeight] = useState<number | ''>('');
  
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(true);

  // 1. Fetch Plans and Today's Completed Exercises on mount
  useEffect(() => {
    if (!token) return;
    
    const initializeData = async () => {
      setLoading(true);
      try {
        // Fetch plans
        const plansRes = await fetch(`${API_BASE_URL}/api/workout-plan`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const plansData = plansRes.ok ? await plansRes.json() : [];
        const activePlans = plansData.filter((p: any) => 
          p.type !== 'G' && 
          p.Type !== 'G' && 
          p.plan_type !== 'G' && 
          p.PlanType !== 'G'
        );
        setPlans(activePlans);

        // Fetch completed exercises for today
        const completedRes = await fetch(`${API_BASE_URL}/api/workout/today-completed`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const completedData = completedRes.ok ? await completedRes.json() : [];
        setCompletedExercises(completedData);

        // Fetch recent body stats
        const bodyStatsRes = await fetch(`${API_BASE_URL}/api/workout/recent-body-stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const bodyStatsData = bodyStatsRes.ok ? await bodyStatsRes.json() : null;
        if (bodyStatsData && bodyStatsData.UserWeight !== null) {
          const rw = Number(bodyStatsData.UserWeight);
          const rh = Number(bodyStatsData.UserHeight);
          setRecentBodyStats({ userWeight: rw, userHeight: rh });
          setDraftWeight(rw);
          setDraftHeight(rh);
        }

      } catch (error) {
        console.error('Failed to initialize workout data', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [token]);

  // Render helpers
  const renderSelectPlan = () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-white mb-4">Select a Workout Plan</h2>
      {plans.length === 0 && !loading && <p>No plans found.</p>}
      {plans.map((plan: any, index: number) => (
        <button
          key={plan.id || plan.plan_id || index}
          onClick={() => {
            setSelectedPlan(plan);
            const d = new Date().getDay();
            const todayDb = d === 0 ? 6 : d - 1;
            setSelectedDay(todayDb);
            setStep('SELECT_DAY');
          }}
          className="p-4 bg-zinc-800 rounded-xl text-left hover:bg-zinc-700 transition"
        >
          <div className="text-xl font-bold text-white">{plan.plan_name}</div>
        </button>
      ))}
    </div>
  );

  const renderSelectDay = () => {
    if (!selectedPlan) return null;

    const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const d = new Date().getDay();
    const todayDbDay = d === 0 ? 6 : d - 1;
    
    // Safety check fallback
    const currentDay = selectedDay !== null ? selectedDay : todayDbDay;
    
    // Find exercises for the currently viewed day in the plan
    const currentDayData = selectedPlan.days?.find((d: any) => d.day === currentDay);
    const exercisesForDay = currentDayData?.exercises || [];

    const handleConfirmDay = () => {
      // Suggesting today's routine unless warning explicitly accepted
      if (currentDay !== todayDbDay) {
        const confirmMsg = "You are going to continue with a workout outside today's routine. Do you want to continue?";
        if (!window.confirm(confirmMsg)) return;
      }
      
      // If we haven't asked for daily body stats yet, ask now
      if (!bodyStats) {
        setStep('RECORD_BODY_STATS');
      } else {
        setStep('SELECT_EXERCISE');
      }
    };

    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        <div>
          <button 
            onClick={() => setStep('SELECT_PLAN')} 
            className="text-sm font-medium text-pink-500 hover:text-pink-400 mb-4 flex items-center transition"
          >
            ← Back to Plans
          </button>
          <h2 className="text-2xl font-bold text-white mb-1">Select Day</h2>
          <p className="text-zinc-400 text-sm">Plan: <span className="text-white font-medium">{selectedPlan.plan_name}</span></p>
        </div>

        {/* Horizontal Days Scroll View */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex justify-between items-center w-full">
            {DAY_NAMES.map((name, idx) => {
              const isToday = idx === todayDbDay;
              const isSelected = idx === currentDay;
              const hasRoutine = selectedPlan.days?.some((d: any) => d.day === idx && d.exercises?.length > 0);
              
              // Determine styling
              let wrapperClass = "flex flex-col items-center gap-2 cursor-pointer group ";
              let circleClass = "flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ";
              let textClass = "text-xs font-medium ";

              if (isToday) {
                // "highlighted circle over it with the inverted color for the day text"
                circleClass += "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] ";
                textClass += "text-white ";
              } else if (isSelected) {
                // Selected but not today
                circleClass += "bg-zinc-700 text-white outline outline-2 outline-offset-2 outline-pink-500 ";
                textClass += "text-zinc-300 ";
              } else if (!hasRoutine) {
                // Rest day ghosted text
                circleClass += "bg-transparent text-zinc-600 group-hover:bg-zinc-800 ";
                textClass += "text-zinc-600 ";
              } else {
                // Normal routine day
                circleClass += "bg-zinc-800 text-zinc-300 group-hover:bg-zinc-700 ";
                textClass += "text-zinc-400 ";
              }

              return (
                <div key={name} className={wrapperClass} onClick={() => setSelectedDay(idx)}>
                  <div className={circleClass}>{name[0]}</div>
                  <span className={textClass}>{name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day's Exercises */}
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-bold text-white mb-2 pb-2 border-b border-zinc-800">
            Routine for {DAY_NAMES[currentDay]} {isToday(currentDay, todayDbDay)}
          </h3>
          
          {exercisesForDay.length > 0 ? (
            <div className="space-y-3">
              {exercisesForDay.map((ex: any, i: number) => (
                <div key={i} className="bg-zinc-800/80 p-4 rounded-xl flex items-center justify-between border border-zinc-700/50 hover:border-zinc-600 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-sm">
                      {i + 1}
                    </div>
                    <span className="font-semibold text-white">{ex.name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 py-8 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-4xl mb-3">😴</span>
              <p className="text-zinc-400 font-medium">Rest Day</p>
              <p className="text-zinc-600 text-sm">No exercises scheduled for this day.</p>
            </div>
          )}
        </div>

        {/* Confirm Action */}
        <button 
          onClick={handleConfirmDay}
          disabled={exercisesForDay.length === 0}
          className={`mt-4 p-4 rounded-2xl font-bold text-center transition-all ${
            exercisesForDay.length > 0 
              ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20 hover:bg-pink-500 hover:-translate-y-1" 
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          Confirm Day Plan
        </button>
      </div>
    );
  };

  // Helper for rendering Select Day text
  const isToday = (current: number, today: number) => {
    return current === today ? <span className="text-pink-500 ml-1">(Today)</span> : null;
  };

  const renderRecordBodyStats = () => {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        <div>
          <button 
            onClick={() => setStep('SELECT_DAY')} 
            className="text-sm font-medium text-pink-500 hover:text-pink-400 mb-4 flex items-center transition"
          >
            ← Back to Day Selection
          </button>
          <h2 className="text-2xl font-bold text-white mb-1">Daily Check-in</h2>
          <p className="text-zinc-400 text-sm">
            Log your body weight and height before starting.
            {recentBodyStats && <span className="block mt-1 text-pink-400 font-medium">Values are auto-filled from your last session.</span>}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <label className="text-zinc-400 text-sm font-medium mb-3 block">
              Body Weight
              {recentBodyStats?.userWeight && (
                <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                  Last: {recentBodyStats.userWeight} kg
                </span>
              )}
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={draftWeight} 
                onChange={(e) => setDraftWeight(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">kg</span>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <label className="text-zinc-400 text-sm font-medium mb-3 block">
              Height
              {recentBodyStats?.userHeight && (
                <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                  Last: {recentBodyStats.userHeight} cm
                </span>
              )}
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={draftHeight} 
                onChange={(e) => setDraftHeight(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">cm</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            setBodyStats({ userWeight: Number(draftWeight), userHeight: Number(draftHeight) });
            setStep('SELECT_EXERCISE');
          }}
          className="w-full p-4 rounded-2xl font-bold text-center transition-all bg-pink-600 text-white shadow-lg shadow-pink-600/20 hover:bg-pink-500 hover:-translate-y-1 block mt-4"
        >
          Confirm & Start Workout
        </button>
      </div>
    );
  };

  const renderSelectExercise = () => {
    if (!selectedPlan || selectedDay === null) return null;

    const currentDayData = selectedPlan.days?.find((d: any) => d.day === selectedDay);
    const exercisesForDay = currentDayData?.exercises || [];
    
    // Check if the user has completed all exercises for this day's routine
    const allCompleted = exercisesForDay.length > 0 && exercisesForDay.every((ex: any) => completedExercises.includes(ex.ex_move_id));

    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        <div>
          <button 
            onClick={() => setStep('SELECT_DAY')} 
            className="text-sm font-medium text-pink-500 hover:text-pink-400 mb-4 flex items-center transition"
          >
            ← Back to Day Selection
          </button>
          <h2 className="text-2xl font-bold text-white mb-1">Select Exercise</h2>
          <p className="text-zinc-400 text-sm">Pick your next move</p>
        </div>

        <div className="flex flex-col gap-3">
          {exercisesForDay.map((ex: any, i: number) => {
            const isCompleted = completedExercises.includes(ex.ex_move_id);
            
            return (
              <button
                key={i}
                disabled={isCompleted}
                onClick={() => {
                  setSelectedExercise(ex);
                  setStep('ACTIVE_WORKOUT');
                }}
                className={`p-4 rounded-2xl flex items-center justify-between border transition-all text-left ${
                  isCompleted 
                    ? 'bg-zinc-900 border-zinc-800/50 opacity-50 cursor-not-allowed' 
                    : 'bg-zinc-800 border-zinc-700 hover:border-pink-500 hover:bg-zinc-750'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    isCompleted ? 'bg-zinc-800 text-zinc-500' : 'bg-pink-500/20 text-pink-400'
                  }`}>
                    {isCompleted ? '✓' : (i + 1)}
                  </div>
                  <div>
                    <span className={`font-semibold text-lg ${isCompleted ? 'text-zinc-500' : 'text-white'}`}>
                      {ex.name}
                    </span>
                  </div>
                </div>
                {!isCompleted && <span className="text-zinc-400">→</span>}
              </button>
            );
          })}
        </div>

        {allCompleted && (
          <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl text-center my-2">
            <span className="text-4xl mb-3 block">🎉</span>
            <p className="text-green-400 font-bold mb-1 text-lg">All done for today!</p>
            <p className="text-green-500/80 text-sm">You've crushed every exercise in this routine.</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-zinc-800">
          {allCompleted && (
            <button 
              onClick={() => {
                // If they want to continue, let them select a different plan/day entirely
                setStep('SELECT_PLAN');
              }}
              className="w-full p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold transition-all border border-zinc-700"
            >
              Continue (Change Plan)
            </button>
          )}
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to end your workout session?")) {
                window.location.reload();
              }
            }}
            className="w-full p-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-2xl font-bold transition-all border border-red-500/20"
          >
            End Workout
          </button>
        </div>
      </div>
    );
  };

  const handleFinishExercise = (exId: number) => {
    setCompletedExercises(prev => [...prev, exId]);
    setStep('SELECT_EXERCISE');
  };

  const renderActiveWorkout = () => {
    if (!selectedExercise) return null;
    return (
      <ActiveWorkoutView 
        exercise={selectedExercise} 
        token={token} 
        bodyStats={bodyStats}
        onBack={() => setStep('SELECT_EXERCISE')}
        onFinish={() => handleFinishExercise(selectedExercise.ex_move_id)}
      />
    );
  };

  if (loading) {
    return <div className="fixed inset-0 z-50 bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-y-auto p-4">
      <div className="max-w-md mx-auto mt-4 mb-20">
        <div className="flex justify-end mb-4">
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-white">
            ✕
          </button>
        </div>

        {step === 'SELECT_PLAN' && renderSelectPlan()}
        {step === 'SELECT_DAY' && renderSelectDay()}
        {step === 'RECORD_BODY_STATS' && renderRecordBodyStats()}
        {step === 'SELECT_EXERCISE' && renderSelectExercise()}
        {step === 'ACTIVE_WORKOUT' && renderActiveWorkout()}
        
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------
// SUB-COMPONENTS for ACTIVE_WORKOUT phase
// ------------------------------------------------------------------------------------

const SnapScroller = ({ label, value, onChange, min = 0, max = 100, step = 1, unit = '', lastValue = null }: any) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      const selectedEl = containerRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [value]);

  const items = [];
  for (let i = min; i <= max; i = Math.round((i + step) * 100) / 100) {
    items.push(i);
  }

  return (
    <div className="my-4">
      <div className="text-zinc-400 text-sm font-medium mb-3 flex items-center">
        {label} 
        {lastValue !== null && (
          <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">
            Last: {lastValue}{unit && ` ${unit}`}
          </span>
        )}
      </div>
      <div ref={containerRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 py-2 pb-6 -mx-4 no-scrollbar items-center">
        {items.map((item) => {
          const isSelected = value === item;
          const isLast = lastValue === item;
          return (
            <button
              key={item}
              data-selected={isSelected}
              onClick={() => onChange(item)}
              className={`relative shrink-0 w-[72px] h-[72px] rounded-2xl flex flex-col items-center justify-center font-bold text-xl snap-center transition-all duration-200 ease-out ${
                isSelected 
                  ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] scale-110 border-none z-10' 
                  : isLast
                    ? 'bg-zinc-800 text-orange-400 border-2 border-orange-500/50 hover:bg-zinc-700'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700/50'
              }`}
            >
              {isLast && !isSelected && <span className="absolute -top-2 bg-orange-500 text-black text-[9px] px-1.5 py-0.5 rounded-full font-black tracking-widest uppercase shadow-sm">LAST</span>}
              <span>{item}</span>
              {unit && <span className={`text-xs uppercase tracking-wider font-medium ${isSelected ? 'text-pink-200' : isLast ? 'text-orange-400' : 'text-zinc-500'}`}>{unit}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ActiveWorkoutView = ({ exercise, token, bodyStats, onBack, onFinish }: any) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Struggle detection state
  const [showStruggleAlert, setShowStruggleAlert] = useState(false);
  const [isStruggling, setIsStruggling] = useState(false);

  // Exercise record states
  const [weight, setWeight] = useState(0); // kg/lbs
  const [reps, setReps] = useState(10);
  const [time, setTime] = useState(0); // seconds
  const [setCount, setSetCount] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Last record state
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const [lastReps, setLastReps] = useState<number | null>(null);

  // Timer specific states
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    const fetchExerciseData = async () => {
      setLoading(true);
      try {
        // 1. Fetch deep details (steps, cautions, record type)
        const detailsRes = await fetch(`${API_BASE_URL}/api/workout/exercise/${exercise.ex_move_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (detailsRes.ok) {
          const data = await detailsRes.json();
          setDetails(data);
        }

        // 2. Check struggle status
        const struggleRes = await fetch(`${API_BASE_URL}/api/workout/is-struggle?workout_type=${encodeURIComponent(exercise.name)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (struggleRes.ok) {
          const struggleData = await struggleRes.json();
          setIsStruggling(struggleData.struggling);
          if (struggleData.struggling) setShowStruggleAlert(true);
        }
        
        // 3. Fetch last record
        const recentRes = await fetch(`${API_BASE_URL}/api/workout/fetch?workout_type=${encodeURIComponent(exercise.name)}&limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (recentRes.ok) {
          const recentData = await recentRes.json();
          if (recentData && recentData.length > 0) {
            const recent = recentData[0];
            if (recent.weight !== null) {
              setLastWeight(Number(recent.weight));
              setWeight(Number(recent.weight)); // default to last weight
            }
            if (recent.reps !== null) {
              setLastReps(Number(recent.reps));
              setReps(Number(recent.reps)); // default to last reps
            }
            if (recent.time !== null) {
              setTime(Number(recent.time));
            }
          }
        }
        
      } catch (err) {
        console.error("Failed loading active exercise details", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExerciseData();
  }, [exercise, token]);

  const handleSaveSet = async (isFinishing: boolean = false) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const isTimeTypeLocal = details?.RecordType?.toLowerCase() === 'time';
      const payload = {
        workout_type: exercise.name,
        ex_move_id: exercise.ex_move_id || exercise.ExMoveID,
        weight: isTimeTypeLocal ? null : weight,
        reps: isTimeTypeLocal ? null : reps,
        date: new Date().toISOString(),
        time: isTimeTypeLocal ? time : null,
        UserWeight: bodyStats?.userWeight,
        UserHeight: bodyStats?.userHeight
      };

      await fetch(`${API_BASE_URL}/api/workout/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (isFinishing) {
        onFinish();
      } else {
        setSetCount(prev => prev + 1);
        // Reset timer states but keep rep/weight exactly the same for the next set
        setTimerRunning(false);
        setTimerSeconds(0);
        setTime(0);
        // We do *not* hide the struggle alert automatically so user can keep seeing the advice
        alert(`Set ${setCount} saved! Get ready for the next one.`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save set');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-20 text-pink-500 font-bold">Getting station ready...</div>;
  }

  const isTimeType = details?.RecordType?.toLowerCase() === 'time';

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div>
        <button 
          onClick={onBack} 
          className="text-sm font-medium text-pink-500 hover:text-pink-400 mb-4 flex items-center transition"
        >
          ← Cancel & Go Back
        </button>
        <span className="text-pink-500 font-bold tracking-widest text-sm uppercase mb-1 block">Set {setCount}</span>
        <h2 className="text-3xl font-bold text-white leading-tight">{exercise.name}</h2>
      </div>

      {/* Struggle Alert */}
      {showStruggleAlert && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 relative">
          <button 
            onClick={() => setShowStruggleAlert(false)}
            className="absolute top-2 right-2 p-2 text-orange-500/50 hover:text-orange-500"
          >
            ✕
          </button>
          <div className="flex gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="font-bold text-orange-500 mb-1">Struggle Detected</h4>
              <p className="text-orange-200/80 text-sm leading-relaxed">
                Based on your recent history, we suggest dropping the weight down by a notch or reducing reps to focus strictly on perfect form. You've got this!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Boxes */}
      <div className="grid grid-cols-2 gap-3">
        {details?.Steps && (
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl col-span-2">
            <h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">👟</span> Steps
            </h4>
            <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">{details.Steps}</p>
          </div>
        )}
        {details?.Caution && (
          <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl col-span-2">
            <h4 className="font-bold text-red-400 mb-2 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">✋</span> Caution
            </h4>
            <p className="text-red-300/80 text-sm leading-relaxed whitespace-pre-line">{details.Caution}</p>
          </div>
        )}
      </div>

      {/* Inputs block depending on RecordType */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <div className="mb-2 border-b border-zinc-800 pb-3 flex justify-between items-center">
          <h3 className="font-bold text-white">Record Your Stats</h3>
          <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400 uppercase tracking-widest">{isTimeType ? 'Timer Mode' : 'Weight / Reps'}</span>
        </div>

        {isTimeType ? (
          // Timer UI
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-6xl font-black text-white tracking-wider tabular-nums font-mono">
              {formatTime(timerSeconds)}
            </div>
            
            <div className="flex gap-4 w-full px-6">
              <button 
                onClick={() => setTimerRunning(!timerRunning)}
                className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all ${timerRunning ? 'bg-orange-500 hover:bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-pink-600 hover:bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]'}`}
              >
                {timerRunning ? 'PAUSE' : 'START CLOCK'}
              </button>
            </div>

            <div className="w-full h-px bg-zinc-800 my-2" />

            <div className="flex w-full items-end gap-3 px-2">
              <div className="flex-1">
                <label className="text-zinc-400 text-sm font-medium mb-2 block">Final Logged Time (Seconds)</label>
                <input 
                  type="number" 
                  value={time} 
                  onChange={(e) => setTime(Number(e.target.value))}
                  className="w-full bg-zinc-800 border box-border border-zinc-700 rounded-xl p-4 text-white font-bold text-xl outline-none focus:border-pink-500 transition-colors"
                />
              </div>
              <button 
                onClick={() => setTime(timerSeconds)}
                className="p-4 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-pink-400 font-bold rounded-xl whitespace-nowrap"
              >
                Autofill ⏱️
              </button>
            </div>
          </div>
        ) : (
          // Weight and Rep UI with snapscroller
          <div>
            <SnapScroller 
              label="Weight" 
              value={weight} 
              onChange={setWeight} 
              min={0} max={250} step={2.5} 
              unit="kg"
              lastValue={lastWeight}
            />
            <SnapScroller 
              label="Reps" 
              value={reps} 
              onChange={setReps} 
              min={1} max={50} step={1} 
              unit="reps" 
              lastValue={lastReps}
            />
          </div>
        )}
      </div>

      {/* Confirmation Actions */}
      <div className="flex flex-col gap-3 mt-4">
        <button 
          onClick={() => handleSaveSet(false)}
          disabled={isSaving}
          className="p-5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-pink-500 hover:text-white transition-all text-zinc-300 font-bold rounded-2xl flex items-center justify-center gap-2"
        >
          {isSaving ? <span className="animate-spin text-xl">⏳</span> : <span className="text-xl">⚡</span>}
          Continue for More Sets
        </button>
        
        <button 
          onClick={() => handleSaveSet(true)}
          disabled={isSaving}
          className="p-5 bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all text-white font-black text-lg rounded-2xl"
        >
          Finish Exercise
        </button>
      </div>

    </div>
  );
};
