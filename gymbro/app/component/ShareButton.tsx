'use client';

import { Share2 } from "lucide-react";
import { useState } from "react";
import React from 'react'
import { useAuth } from '../context/AuthContext';
import { generateShareImage } from "../lib/apiClient";

export default function ShareButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [prid, setPrid] = useState('');
    const { token } = useAuth();

    const handleShare = async () => {
        setIsLoading(true);
        try {
            if (!token) throw new Error("No token available");
            if (!prid) {
                alert("Please enter a PRID");
                setIsLoading(false);
                return;
            }
            const blob = await generateShareImage(token, prid);

            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);

            alert('Image copied to clipboard!');
        } catch (error: any) {
            console.error('Error:', error);
            alert(`Failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input 
                type="text" 
                placeholder="PRID for testing..."
                value={prid}
                onChange={(e) => setPrid(e.target.value)}
                className="bg-zinc-800 text-zinc-100 px-3 py-2 rounded-md border border-zinc-700 outline-none"
            />
            <button 
                type="button"
                onClick={handleShare} 
                disabled={isLoading}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 rounded-full font-medium transition-colors border border-zinc-700 disabled:opacity-50"
            >
                <Share2 size={18} />
                {isLoading ? 'Sharing...' : 'Share PR'}
            </button>
        </div>
    )
}
