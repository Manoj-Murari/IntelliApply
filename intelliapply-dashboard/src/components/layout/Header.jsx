import React, { useState, useEffect, useRef } from 'react';
import { 
    Briefcase, 
    Settings, 
    BarChart3, 
    Loader2,
    LogOut,
    User,
    Inbox,
    Archive
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { supabase } from '../../lib/supabaseClient';

// --- Reusable NavLink ---
function NavLink({ view, setView, currentView, viewName, children }) {
    const isActive = currentView === viewName;
    return (
        <button
            onClick={() => setView(viewName)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
            {children}
        </button>
    );
}

// --- Avatar Component (Unchanged) ---
function Avatar({ email }) {
    const getInitials = (email) => {
        return email ? email[0].toUpperCase() : <User className="w-4 h-4" />;
    };

    const getColor = (email) => {
        let hash = 0;
        if (!email) return 'bg-slate-500';
        for (let i = 0; i < email.length; i++) {
            hash = email.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-sky-500'];
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={`w-9 h-9 rounded-full ${getColor(email)} flex items-center justify-center font-bold text-white text-sm ring-1 ring-white/20`}>
            {getInitials(email)}
        </div>
    );
}

export default function Header() {
    // --- Get state from the store individually ---
    const view = useStore((state) => state.view);
    const setView = useStore((state) => state.setView);
    const isSearching = useStore((state) => state.isSearching);
    const handleSignOut = useStore((state) => state.handleSignOut);
    const profiles = useStore((state) => state.profiles);
    const activeProfileId = useStore((state) => state.activeProfileId);
    const setActiveProfileId = useStore((state) => state.setActiveProfileId);

    // --- State for user and dropdown ---
    const [userEmail, setUserEmail] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch user email on mount
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email);
            }
        };
        fetchUser();
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]); 

    return (
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    
                    {/* --- LEFT SIDE (LOGO ONLY) --- */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-7 h-7 text-sky-600" />
                            <h1 className="text-xl font-bold text-slate-800">IntelliApply</h1>
                        </div>
                        {/* --- Navigation has been moved --- */}
                    </div>

                    {/* --- RIGHT SIDE (NAV + ACTIONS) --- */}
                    <div className="flex items-center gap-6"> {/* <-- Increased gap */}
                        
                        {/* --- NAVIGATION (MOVED HERE) --- */}
                        <nav className="hidden md:flex items-center gap-2">
                            <NavLink view={view} setView={setView} currentView={view} viewName="inbox"><Inbox className="w-4 h-4" />Inbox</NavLink>
                            <NavLink view={view} setView={setView} currentView={view} viewName="library"><Archive className="w-4 h-4" />Job Library</NavLink>
                            <NavLink view={view} setView={setView} currentView={view} viewName="tracker"><Briefcase className="w-4 h-4" />Tracker</NavLink>
                            <NavLink view={view} setView={setView} currentView={view} viewName="analytics"><BarChart3 className="w-4 h-4" />Analytics</NavLink>
                        </nav>
                        {/* --- END NAVIGATION --- */}

                        {/* --- Global Profile Selector --- */}
                        {profiles.length > 0 && (
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-500" />
                                <select
                                    id="global-active-profile"
                                    value={activeProfileId || ''}
                                    onChange={(e) => setActiveProfileId(e.target.value)}
                                    className="text-sm font-medium text-slate-700 bg-transparent border-0 rounded-md focus:ring-0 focus:outline-none"
                                    title="Set active AI profile"
                                >
                                    {profiles.map(profile => (
                                        <option key={profile.id} value={profile.id}>
                                            {profile.profile_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {isSearching && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-sky-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Searching...</span>
                            </div>
                        )}
                        
                        {/* --- Profile Dropdown --- */}
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                                className="rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                                title="Account settings"
                            >
                                <Avatar email={userEmail} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-fade-in-down">
                                    <div className="p-4 border-b border-slate-100">
                                        <p className="text-sm text-slate-500">Signed in as</p>
                                        <p className="font-semibold text-slate-800 truncate" title={userEmail}>{userEmail || "Loading..."}</p>
                                    </div>
                                    <nav className="p-2">
                                        <button
                                            onClick={() => {
                                                setView('settings');
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}