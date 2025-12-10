import React from 'react';
import { useAppStore } from '../lib/store';
import { User, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';

export function Layout({ children }) {
    const { setView, resetToHome } = useAppStore();

    return (
        <div className="w-full min-h-screen bg-[#F9F8F6] flex flex-col antialiased">
            {/* 1. Global Navigation (Sticky Header) */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white border-b border-[#E6E4DF] shadow-sm">

                {/* Left: Logo/Icon (Resets to Home) */}
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={resetToHome}
                >
                    <div className="w-8 h-8 bg-[#1F1F1F] text-white rounded-md flex items-center justify-center font-serif font-bold text-lg group-hover:bg-[#333] transition-colors">
                        IA
                    </div>
                    <span className="font-serif text-lg font-bold text-[#1F1F1F] tracking-tight hidden sm:block">
                        IntelliApply
                    </span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">

                    {/* Profile Icon */}
                    <button
                        onClick={() => setView('profile')}
                        className="w-8 h-8 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#1F1F1F] hover:bg-[#D97757] hover:text-white transition-colors"
                        title="Profile & Settings"
                    >
                        <User className="w-4 h-4" strokeWidth={2} />
                    </button>

                    {/* External Link */}
                    <a
                        href="#"
                        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#F9F8F6] text-[#6B6B6B] hover:text-[#D97757] transition-colors"
                        title="Go to Full Web Dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalLink className="w-5 h-5" strokeWidth={1.5} />
                    </a>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col p-6 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
