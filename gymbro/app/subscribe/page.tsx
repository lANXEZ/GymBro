"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { processPayment, upgradeSubscription } from '../lib/apiClient';
import { CircleCheck, Zap, ArrowRight, ShieldCheck, Dumbbell, CalendarCheck } from 'lucide-react';

export default function SubscribePage() {
  const { isLoggedIn, token, user, login } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If user is already upgraded:
  if (user?.role === 'training_client' || user?.role === 'trainer') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
          <CircleCheck strokeWidth={2.5} size={40} />
        </div>
        <h1 className="text-3xl font-bold text-white">You're already subscribed!</h1>
        <p className="text-zinc-400 max-w-md">Your account is fully upgraded with expert guidance and premium features.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-full font-bold transition-all mt-4"
        >
          Return Home
        </button>
      </div>
    );
  }

  const handleUpgrade = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    
    try {
      // 1. Mock payment processing (using 'tok_visa' to simulate success)
      await processPayment(token, 99, 'tok_visa');
      
      // 2. Change user status and get new token
      const upgradeRes = await upgradeSubscription(token);
      
      if (upgradeRes.auth_token && upgradeRes.user) {
        // Update global auth state with new token/role
        login(upgradeRes.auth_token, upgradeRes.user);
        setSuccess(true);
      } else {
        throw new Error('Failed to update account status.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong during payment.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center animate-bounce">
          <Zap strokeWidth={2.5} size={48} />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
          Upgrade Successful!
        </h1>
        <p className="text-xl text-zinc-300 max-w-md">
          Welcome to the Pro tier! You are now a Training Client. Get ready to elevate your workouts with expert guidance.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-600/25 px-8 py-4 rounded-full font-bold transition-all mt-8 flex items-center gap-2"
        >
          Let's Go <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Level Up Your Training</h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          Get verified expert guidance to hit your goals faster. Try GymBro Pro today.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-2xl text-center font-medium">
          {error}
        </div>
      )}

      <div className="relative rounded-3xl bg-zinc-900 border border-zinc-800 p-8 md:p-12 overflow-hidden max-w-2xl mx-auto shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-pink-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
          <div className="flex-1 space-y-6">
            <h2 className="text-2xl font-bold text-white">Pro Plan</h2>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">99 ฿</span>
              <span className="text-zinc-400 font-medium mb-1">/ month</span>
            </div>
            
            <ul className="space-y-4 pt-4">
              <li className="flex items-center gap-3 text-zinc-300">
                <Dumbbell className="text-pink-500" size={20} />
                <span>Custom plans from verified trainers</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <ShieldCheck className="text-pink-500" size={20} />
                <span>One-on-one expert feedback</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <CalendarCheck className="text-pink-500" size={20} />
                <span>Advanced progress tracking</span>
              </li>
            </ul>
          </div>
          
          <div className="w-full md:w-auto flex flex-col items-center">
            <button
              onClick={handleUpgrade}
              disabled={loading || !isLoggedIn}
              className="w-full md:w-56 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg py-4 px-6 rounded-full transition-all shadow-lg shadow-pink-600/25 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Upgrade Now'
              )}
            </button>
            <p className="text-xs text-zinc-500 mt-4 text-center">
              Secure payment processing.<br/>Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
