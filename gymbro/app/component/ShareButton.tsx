'use client';

import { Share2, X, Loader2, Trophy, HeartPulse, Search } from "lucide-react";
import { useState, useEffect } from "react";
import React from 'react'
import { useAuth } from '../context/AuthContext';
import { generateShareImage, fetchWorkout, fetchWorkoutPlans, generatePlanShareImage } from "../lib/apiClient";

export default function ShareButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shareType, setShareType] = useState<'selection' | 'pr' | 'plan'>('selection');
    const [isLoading, setIsLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [prList, setPrList] = useState<any[]>([]);
    const [planList, setPlanList] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    
    const { token } = useAuth();

    useEffect(() => {
        setShareType('selection');
    }, [isModalOpen]);

    useEffect(() => {
        if (isModalOpen && shareType === 'pr' && token) {
            setFetchingData(true);
            fetchWorkout(token, '', 100)
                .then((data) => {
                    if (Array.isArray(data)) {
                        const newestFirstData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        setPrList(newestFirstData);
                    }
                })
                .catch(err => console.error("Failed to load PRs:", err))
                .finally(() => setFetchingData(false));
        } else if (isModalOpen && shareType === 'plan' && token) {
            setFetchingData(true);
            fetchWorkoutPlans(token)
                .then((data) => {
                    if (Array.isArray(data)) {
                        setPlanList(data);
                    }
                })
                .catch(err => console.error("Failed to load Plans:", err))
                .finally(() => setFetchingData(false));
        }
    }, [isModalOpen, shareType, token]);

    const handleSharePR = async (selectedPrid: string) => {
        if (!selectedPrid || selectedPrid === 'undefined') {
            alert('Error: Could not identify PR ID for this workout.');
            return;
        }

        setIsLoading(true);
        try {
            if (!token) throw new Error("No token available");
            const blob = await generateShareImage(token, selectedPrid);

            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);

            alert('Image copied to clipboard!');
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Error:', error);
            alert(`Failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSharePlan = async (selectedPlanId: string) => {
        if (!selectedPlanId || selectedPlanId === 'undefined') {
            alert('Error: Could not identify Plan ID.');
            return;
        }

        setIsLoading(true);
        try {
            if (!token) throw new Error("No token available");
              const blob = await generatePlanShareImage(token, Number(selectedPlanId));

            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);

            alert('Plan image copied to clipboard!');
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Error:', error);
            alert(`Failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (totalSecs: number) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentYear = currentDate.getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    const filteredPrList = prList.filter((pr) => {
        if (!pr.date) return false;
        const d = new Date(pr.date);
        if (isNaN(d.getTime())) return false;

        const matchMonth = selectedMonth === "all" || d.getMonth().toString() === selectedMonth;
        const matchYear = selectedYear === "all" || d.getFullYear().toString() === selectedYear;

        return matchMonth && matchYear;
    });

    const filteredPlanList = planList.filter(plan => 
        plan.plan_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <button 
                type="button"
                onClick={() => setIsModalOpen(true)} 
                disabled={isLoading}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-full font-medium transition-colors border border-zinc-700 disabled:opacity-50"
            >
                <Share2 size={18} />
                {isLoading ? 'Sharing...' : 'Share'}
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-200" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <button 
                            onClick={() => {
                                if (shareType !== 'selection') setShareType('selection');
                                else setIsModalOpen(false);
                            }}
                            className="absolute top-4 left-4 text-zinc-400 hover:text-white transition-colors"
                        >
                            {shareType !== 'selection' ? <span className="text-sm">← Back</span> : null}
                        </button>

                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {shareType === 'selection' && (
                            <div className="text-center space-y-6 mt-8 mb-4">
                                <h3 className="text-xl font-bold text-white mb-6">What to share?</h3>
                                <button 
                                    onClick={() => setShareType('pr')}
                                    className="w-full flex flex-col items-center p-4 bg-zinc-800/50 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mb-3">
                                        <Trophy size={24} />
                                    </div>
                                    <span className="font-bold text-white text-lg">Personal Record</span>
                                    <span className="text-sm text-zinc-400 mt-1">Share your best performance</span>
                                </button>

                                <button 
                                    onClick={() => setShareType('plan')}
                                    className="w-full flex flex-col items-center p-4 bg-zinc-800/50 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-colors"
                                >
                                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-3">
                                        <HeartPulse size={24} />
                                    </div>
                                    <span className="font-bold text-white text-lg">Workout Plan</span>
                                    <span className="text-sm text-zinc-400 mt-1">Share your weekly routine</span>
                                </button>
                            </div>
                        )}

                        {shareType === 'pr' && (
                            <>
                                <div className="text-center space-y-4 mb-4 mt-6">
                                    <div className="mx-auto w-12 h-12 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mb-2">
                                        <Trophy size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Select a PR to Share</h3>
                                </div>

                                <div className="flex items-center gap-2 mb-4 justify-center">
                                    <select 
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="bg-zinc-800 text-white border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-pink-500 outline-none text-sm cursor-pointer"
                                    >
                                        <option value="all">All Months</option>
                                        {months.map((month, index) => (
                                            <option key={month} value={index}>{month}</option>
                                        ))}
                                    </select>
                                    <select 
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="bg-zinc-800 text-white border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-pink-500 outline-none text-sm cursor-pointer"
                                    >
                                        <option value="all">All Years</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                {fetchingData ? (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                                        <p className="text-zinc-400 text-sm">Loading your PRs...</p>
                                    </div>
                                ) : filteredPrList.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-zinc-400">No PRs found for the selected date.</p>
                                        <p className="text-xs text-zinc-500 mt-2">Keep training hard! 💪</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 overflow-y-auto pr-2" style={{ flex: 1 }}>
                                        {filteredPrList.map((pr, i) => {
                                            const id = pr.PRID || pr.WorkoutID || pr.id || pr.workout_id || pr.WorkoutId || pr._id;
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSharePR(String(id))}
                                                    disabled={isLoading}
                                                    className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl border border-zinc-700/50 transition-colors text-left disabled:opacity-50"
                                                >
                                                    <div>
                                                        <p className="font-bold text-white text-sm capitalize">{pr.workout_type?.replace(/_/g, ' ')}</p>
                                                        <p className="text-xs text-zinc-400">{new Date(pr.date).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        {pr.time ? (
                                                            <>
                                                                <p className="font-bold text-pink-400">{formatTime(Number(pr.time))}</p>
                                                                <p className="text-xs text-zinc-400">duration</p>
                                                            </>
                                                        ) : pr.weight ? (
                                                            <>
                                                                <p className="font-bold text-pink-400">{pr.weight} kg</p>
                                                                <p className="text-xs text-zinc-400">{pr.reps || 0} reps</p>
                                                            </>
                                                        ) : (
                                                            <p className="font-bold text-pink-400">{pr.reps || 0} reps</p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}

                        {shareType === 'plan' && (
                            <>
                                <div className="text-center space-y-4 mb-4 mt-6">
                                    <div className="mx-auto w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-2">
                                        <HeartPulse size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Select a Plan to Share</h3>
                                </div>

                                <div className="mb-4 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-zinc-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search plans..."
                                        className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-xl pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                </div>

                                {fetchingData ? (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                        <p className="text-zinc-400 text-sm">Loading your Plans...</p>
                                    </div>
                                ) : filteredPlanList.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-zinc-400">No plans found.</p>
                                        <p className="text-xs text-zinc-500 mt-2">Create a plan first! 📋</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 overflow-y-auto pr-2" style={{ flex: 1 }}>
                                        {filteredPlanList.map((plan, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSharePlan(String(plan.plan_id))}
                                                disabled={isLoading}
                                                className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl border border-zinc-700/50 transition-colors text-left disabled:opacity-50"
                                            >
                                                <div>
                                                    <p className="font-bold text-white text-sm capitalize">{plan.plan_name}</p>
                                                    <p className="text-xs text-zinc-400">{plan.days?.length || 0} active days</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
