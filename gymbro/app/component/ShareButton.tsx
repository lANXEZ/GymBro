'use client';

import { Share2 } from "lucide-react";
import { useState } from "react";
import React from 'react'
import { useAuth } from '../context/AuthContext';
import { generateShareImage } from "../lib/apiClient";

export default function ShareButton() {
    const [isLoading, setIsLoading] = useState(false);
    const { token } = useAuth();

    const handleShare = async () => {
        setIsLoading(true);
        try {
            if (!token) throw new Error("No token available");
            const blob = await generateShareImage(token, "15 kg", "12 reps");

            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);

            alert('Image copied to clipboard!');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to copy image to clipboard.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button 
            onClick={handleShare} 
            disabled={isLoading}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-full font-medium transition-colors border border-zinc-700 disabled:opacity-50"
        >
            <Share2 size={18} />
            {isLoading ? 'Sharing...' : 'Share PR'}
        </button>
    )
}
