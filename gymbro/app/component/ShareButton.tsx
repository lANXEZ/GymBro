'use client';

import { Share2, X, Loader2, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import React from 'react'
import { useAuth } from '../context/AuthContext';
import { generateShareImage, fetchWorkout } from "../lib/apiClient";

export default function ShareButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchingPRs, setFetchingPRs] = useState(false);
    const [prList, setPrList] = useState<any[]>([]);
    
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    
    const { token } = useAuth();

    useEffect(() => {
        if (isModalOpen && token) {
            setFetchingPRs(true);
            fetchWorkout(token, '', 100)
                .then((data) => {
                    if (Array.isArray(data)) {
                        // Simply use the raw data sorted by newest first
                        const newestFirstData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        
                        setPrList(newestFirstData);
                    }
                })
                .catch(err => console.error("Failed to load PRs:", err))
                .finally(() => setFetchingPRs(false));
        }
    }, [isModalOpen, token]);

    const handleShare = async (selectedPrid: string) => {
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

    return (
        <>
            <button 
                type="button"
                onClick={() => setIsModalOpen(true)} 
                disabled={isLoading}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-full font-medium transition-colors border border-zinc-700 disabled:opacity-50"
            >
                <Share2 size={18} />
                {isLoading ? 'Sharing...' : 'Share PR'}
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center space-y-4 mb-4">
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

                        {fetchingPRs ? (
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
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {filteredPrList.map((pr, i) => {
                                    const id = pr.PRID || pr.WorkoutID || pr.id || pr.workout_id || pr.WorkoutId || pr._id;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleShare(String(id))}
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
                    </div>
                </div>
            )}
        </>
    )
}
