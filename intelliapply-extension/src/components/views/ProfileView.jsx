import React from 'react';
import { useAppStore } from '../../lib/store';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { User, FileText, CreditCard, ChevronRight, Key, ArrowLeft, LogOut } from 'lucide-react';

export function ProfileView() {
    const { setView, user, profile, signOut } = useAppStore();

    const handleSignOut = async () => {
        await signOut();
        // Since user becomes null, App.jsx will automatically redirect to LoginView
    };

    return (
        <div className="flex flex-col h-full gap-6">

            {/* Header */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setView('home')}
                    className="p-1 rounded-md hover:bg-[#E6E4DF] text-[#6B6B6B]"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-serif text-xl font-bold text-[#1F1F1F]">Profile & Settings</h2>
            </div>

            {/* User Card */}
            <Card className="p-4 flex items-center gap-4 bg-[#1F1F1F] text-white border-none shadow-md">
                <div className="w-12 h-12 rounded-full bg-[#D97757] flex items-center justify-center text-xl font-serif font-bold uppercase">
                    {user?.email?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-lg leading-tight truncate">
                        {profile?.full_name || 'User'}
                    </h3>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white font-medium uppercase tracking-wider">
                        {user?.email}
                    </span>
                </div>
            </Card>

            {/* Base Resume Status */}
            <section>
                <h4 className="text-sm font-bold text-[#6B6B6B] uppercase tracking-wide mb-3">Master Resume</h4>
                <Card className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-[#F9F8F6] rounded-md text-[#D97757]">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            {profile?.resume_context ? (
                                <>
                                    <p className="text-sm font-medium text-[#1F1F1F]">Resume Data Synced</p>
                                    <p className="text-xs text-[#6B6B6B]">Ready for tailoring</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-[#1F1F1F] mb-1">No Resume Found</p>
                                    <button
                                        onClick={() => chrome.tabs.create({ url: 'http://localhost:5173/app/settings' })}
                                        className="text-xs text-[#D97757] hover:underline text-left"
                                    >
                                        Upload via Dashboard &rarr;
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            </section>

            {/* Footer Links */}
            <div className="mt-auto space-y-1 border-t border-[#E6E4DF] pt-4">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-between p-2 text-sm text-[#D97757] hover:bg-red-50 rounded transition-colors"
                >
                    <span className="font-semibold">Sign Out</span>
                    <LogOut className="w-4 h-4" />
                </button>
            </div>

        </div>
    );
}
