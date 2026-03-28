'use client';
import { Share2 } from "lucide-react";
import { useState } from "react";
const baseUrl = 'http://localhost:3000';
import React from 'react'

export default function ShareButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleShare = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${baseUrl}/api/generate-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "stats": {
                        "weight": "15 kg",
                        "reps": "12 reps",
                    }
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate image');
            }

            const blob = await response.blob();

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
