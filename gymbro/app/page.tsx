"use client";

import React, { useState, useEffect } from 'react';
import { Target, Flame, CalendarDays, ChevronRight, X, User as UserIcon, Lock, Mail, Calendar, UserPlus } from 'lucide-react';
import Link from 'next/link';
import ShareButton from './component/ShareButton';
import WorkoutCoordinator from './component/WorkoutCoordinator';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';

import { loginApi, registerApi, fetchWorkout, fetchRecentPlanId, fetchWorkoutPlans, changePasswordApi } from './lib/apiClient';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, login, token, user } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot_password' | null>(null);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin') {
      router.push('/admin');
    }
  }, [isLoggedIn, user, router]);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');

  // Dashboard states
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [isWorkoutCoordinatorOpen, setIsWorkoutCoordinatorOpen] = useState(false);


  
  // Today's Plan States
  const [todaysPlanName, setTodaysPlanName] = useState<string | null>(null);
  const [todaysExercises, setTodaysExercises] = useState<any[]>([]);

  useEffect(() => {
    if (isLoggedIn && token) {
      // Fetch user's actual workouts (e.g. limit to 50 for volume calc, and show latest in feed)
      fetchWorkout(token, '', 50)
        .then((data: any) => {
          if (Array.isArray(data)) {
            // Calculate PRs dynamically (highest weight for that exercise type so far) to show the "New PR!" tag
            const chronologicalData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            let calculatedPrCount = 0;
            const maxWeights: Record<string, number> = {};

            const processedData = chronologicalData.map(activity => {
              const type = activity.workout_type;
              const weight = Number(activity.weight) || 0;
              let isPR = activity.pr || false; // default to true if backend provided it

              if (type && weight > 0) {
                if (maxWeights[type] === undefined) {
                  maxWeights[type] = weight; // Baseline set, first one isn't counted as breaking a PR
                } else if (weight > maxWeights[type]) {
                  isPR = true;
                  maxWeights[type] = weight;
                  calculatedPrCount++;
                }
              }
              return { ...activity, pr: isPR };
            });

            // Sort back to newest first for the feed
            const newestFirstData = processedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setRecentActivities(newestFirstData);
            setTotalWorkouts(newestFirstData.length);

            // Calculate Weekly Streak
            if (newestFirstData.length > 0) {
              const sortedDates = newestFirstData
                .map((d: any) => new Date(d.date))
                .filter((d: Date) => !isNaN(d.getTime()))
                .sort((a: Date, b: Date) => b.getTime() - a.getTime());

              if (sortedDates.length > 0) {
                // Normalize dates to the start of the week (Monday)
                const normalizeWeek = (date: Date) => {
                  const d = new Date(date);
                  d.setHours(0, 0, 0, 0);
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                  d.setDate(diff);
                  return d.getTime();
                };

                const workoutWeeks = new Set(sortedDates.map((d: Date) => normalizeWeek(d)));
                let checkTime = normalizeWeek(new Date()); // Start checking from current week

                let currentStreak = 0;

                // Handle case where user hasn't worked out THIS week yet, but has last week
                if (!workoutWeeks.has(checkTime)) {
                  checkTime -= 7 * 24 * 60 * 60 * 1000;
                }

                while (workoutWeeks.has(checkTime)) {
                  currentStreak++;
                  checkTime -= 7 * 24 * 60 * 60 * 1000;
                }

                setWeeklyStreak(currentStreak);
              } else {
                setWeeklyStreak(0);
              }
            }
          }
        })
        .catch((err: any) => console.error("Failed to load workouts:", err));

      // Fetch Today's Plan
      const fetchPlan = async () => {
        try {
          const recentPlanRes = await fetchRecentPlanId(token);
          if (recentPlanRes && recentPlanRes.plan_id) {
            const planId = recentPlanRes.plan_id;
            const plans = await fetchWorkoutPlans(token);
            
            const currentPlan = plans.find((p: any) => 
              p.plan_id === planId && 
              p.type !== 'G' && 
              p.Type !== 'G' && 
              p.plan_type !== 'G' && 
              p.PlanType !== 'G'
            );
            if (currentPlan) {
              const d = new Date();
              const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
              // Map JS getDay to DB Day (0-6 mapping in DB schema is Mon-Sun)
              const dbDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              
              const todaysDayData = currentPlan.days?.find((day: any) => day.day === dbDay);
              
              if (todaysDayData && todaysDayData.exercises.length > 0) {
                setTodaysPlanName(currentPlan.plan_name);
                setTodaysExercises(todaysDayData.exercises);
              } else {
                setTodaysPlanName(currentPlan.plan_name);
                setTodaysExercises([]); // Maybe a rest day
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch today's plan:", error);
        }
      };
      
      fetchPlan();
    }
  }, [isLoggedIn, token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    try {
      const data = await loginApi(username || email, password);
      const token = data.auth_token;
      const user = data.user;

      if (!token || !user) throw new Error('Invalid token or user received');

      // Success
      login(token, user);
      setAuthMode(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    try {
      const data = await registerApi({
        username,
        password,
        email,
        firstName,
        lastName,
        birthdate
      });

      const token = data.auth_token;
      const user = data.user;

      if (!token || !user) throw new Error('Invalid token or user received');

      // Success
      login(token, user);
      setAuthMode(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    try {
      await changePasswordApi(username, birthdate, password);
      // Success
      setAuthMode('login');
      setErrorMsg('Password changed successfully. Please log in.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change password');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-900 dark:text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        
        <div className="z-10 text-center space-y-6 max-w-2xl px-6">
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <Target size={64} className="text-pink-500" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">GymBro</span>
          </h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400">
            Track your workouts, follow specialized coach plans, and crush your goals. The ultimate fitness companion.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
              className="w-full sm:w-auto px-8 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-full font-bold text-lg transition-all"
            >
              Log In
            </button>
            <button 
              onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
              className="w-full sm:w-auto px-8 py-4 bg-pink-600 hover:bg-pink-500 shadow-lg shadow-pink-600/25 text-zinc-900 dark:text-white rounded-full font-bold text-lg transition-all"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Auth Modal */}
        {authMode && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 w-full max-w-[500px] overflow-y-auto max-h-[90vh] relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setAuthMode(null)}
                className="absolute top-6 right-6 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-3xl font-bold mb-6">
                {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Create Account' : 'Change Password'}
              </h2>
              
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm">
                  {errorMsg}
                </div>
              )}

              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Username or Email</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="text" 
                        required
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setEmail(e.target.value); }}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                        placeholder="bro@gym.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                        placeholder="��������"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setAuthMode('forgot_password')} className="text-sm text-pink-500 hover:text-pink-400 font-medium">Forgot/Change Password?</button>
                  </div>
                  <button type="submit" className="w-full bg-pink-600 hover:bg-pink-500 text-white rounded-xl py-4 font-bold mt-4 transition-colors">
                    Confirm
                  </button>
                  <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-4">
                    Don't have an account? {' '}
                    <button type="button" onClick={() => setAuthMode('signup')} className="text-pink-500 hover:text-pink-400 font-medium">Sign up</button>
                  </p>
                </form>
              ) : authMode === 'forgot_password' ? (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="text" required value={username} onChange={e => setUsername(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all"
                        placeholder="johndoe123"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="date" required value={birthdate} onChange={e => setBirthdate(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="password" required value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-pink-600 hover:bg-pink-500 text-white rounded-xl py-4 font-bold mt-4 transition-colors">
                    Change Password
                  </button>
                  <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-4">
                    Remember your password? {' '}
                    <button type="button" onClick={() => setAuthMode('login')} className="text-pink-500 hover:text-pink-400 font-medium">Log in</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">First Name</label>
                      <input 
                        type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-pink-500 transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Last Name</label>
                      <input 
                        type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-pink-500 transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="text" required value={username} onChange={e => setUsername(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all"
                        placeholder="johndoe123"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Birthdate</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      
                      <input 
                        type="date" required value={birthdate} onChange={e => setBirthdate(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all [color-scheme:dark]"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="password" required value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-pink-600 hover:bg-pink-500 text-white rounded-xl py-4 font-bold mt-6 transition-colors">
                    Confirm Registration
                  </button>
                  <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-4">
                    Already have an account? {' '}
                    <button type="button" onClick={() => setAuthMode('login')} className="text-pink-500 hover:text-pink-400 font-medium">Log in</button>
                  </p>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Welcome back, {user?.username || 'Bro'}! 🦍</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Ready to crush your goals today?</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsWorkoutCoordinatorOpen(true)}
            className="bg-pink-600 hover:bg-pink-500 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-pink-600/20"
          >
            Start Workout
          </button>
          <ShareButton />
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Workouts', value: totalWorkouts.toString(), icon: Target, color: 'text-blue-500' },
          { label: 'Streak', value: `${weeklyStreak} wks`, icon: Flame, color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
            <div className={`p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Plan */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col">
          {user?.role === 'gymgoer' && (
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl p-4 mb-6 relative">
              <h3 className="text-zinc-900 dark:text-white font-bold text-sm mb-1">Looking for expert guidance?</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-3">
                Subscribe to have a verified trainer guide your exercises to your goals.
              </p>
              <div className="flex justify-end">
                <Link href="/subscribe" className="text-pink-400 hover:text-pink-300 text-xs font-bold transition-colors">
                  Subscribe Now →
                </Link>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Today's Plan</h2>
            <Link href="/workouts" className="text-sm text-pink-500 hover:text-pink-400 flex items-center">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="bg-zinc-100/50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-700/50 flex-grow">
            {todaysPlanName ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{todaysPlanName}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {todaysExercises.length > 0 
                        ? `${todaysExercises.length} exercises scheduled for today` 
                        : 'Rest Day! Enjoy your recovery.'}
                    </p>
                  </div>
                </div>
                {todaysExercises.length > 0 && (
                  <ul className="space-y-3 mb-6">
                    {todaysExercises.map((ex, i) => (
                      <li key={i} className="flex justify-between items-center text-sm">
                        <span className="text-zinc-700 dark:text-zinc-200">{ex.name}</span>
                        {/* If DB doesn't have sets/reps in the plan, you can just show a placeholder */}
                        <span className="text-zinc-500">Scheduled 🏋️</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">No plan assigned for today or currently active.</p>
                <Link href="/workouts">
                  <button className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                    Find a Plan
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Recent Activity</h2>
            <Link href="/progress" className="text-sm text-pink-500 hover:text-pink-400 flex items-center">
              History <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivities.slice(0, 3).map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-100/30 dark:bg-zinc-800/30 hover:bg-zinc-100/50 dark:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-300 dark:border-zinc-700 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-white">{activity.workout_type || 'Workout'}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {activity.weight ? `${activity.weight} kg x ${activity.reps || 0} reps` : (activity.reps ? `${activity.reps} reps` : 'Completed')}
                      {' • '} {activity.date ? new Date(activity.date).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>
                {activity.pr && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/20">
                    New PR! 🏆
                  </span>
                )}
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">No recent activity. Start crushing it!</p>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Workout Coordinator */}
      {isWorkoutCoordinatorOpen && (
        <WorkoutCoordinator onClose={() => setIsWorkoutCoordinatorOpen(false)} />
      )}
    </div>
  );
}
