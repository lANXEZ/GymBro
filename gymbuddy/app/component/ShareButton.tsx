'use client';
import Image from "next/image";
const baseUrl = 'http://localhost:3000';
import React from 'react'

export default function Home() {

    const handleShare = async () => {
        try {
            const response = await fetch(`${baseUrl}/api/generate-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "stats": {
                        "distance": "10.5 km",
                        "time": "55:00"
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
        }
    };


    return (
        <button onClick={handleShare} className="bg-pink-700">Copy to clipboard!</button>
    )
}
