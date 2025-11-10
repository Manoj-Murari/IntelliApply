import React from 'react';

export default function AnimeLoader() {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <style>
                {`
                    .loader-orb {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background-color: #0ea5e9; /* sky-500 */
                        box-shadow: 0 0 20px #0ea5e9, 0 0 40px #0ea5e9, 0 0 60px #0ea5e9;
                        animation: pulse 2s infinite cubic-bezier(0.66, 0, 0, 1);
                    }
                    @keyframes pulse {
                        0% { transform: scale(0.8); opacity: 0.7; }
                        50% { transform: scale(1.2); opacity: 1; }
                        100% { transform: scale(0.8); opacity: 0.7; }
                    }
                `}
            </style>
            <div className="loader-orb mb-6"></div>
            <h3 className="text-xl font-bold text-slate-700">Searching for Missions...</h3>
            <p className="text-slate-500 mt-2">Analyzing targets and calculating compatibility.</p>
        </div>
    );
}
