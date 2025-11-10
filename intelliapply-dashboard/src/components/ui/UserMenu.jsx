// intelliapply-dashboard/src/components/ui/UserMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../lib/store';
import { User, LogOut, ChevronDown, Settings } from 'lucide-react';

export default function UserMenu({ userEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const handleLogout = useStore((state) => state.handleLogout);
  const setView = useStore((state) => state.setView);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  const onSignOut = () => {
    setIsOpen(false);
    handleLogout();
  };

  const onGoToSettings = () => {
    setIsOpen(false);
    setView('settings');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
      >
        <User className="w-5 h-5 text-slate-600" />
        <span className="hidden md:block text-sm font-medium text-slate-700">
          {userEmail}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in-down">
          <div className="p-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-800 truncate">
              {userEmail}
            </p>
            <p className="text-xs text-slate-500">Signed in</p>
          </div>
          <div className="p-1">
            <button
              onClick={onGoToSettings}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Settings</span>
            </button>
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Simple fade-in animation */}
      <style>{`
        @keyframes animate-fade-in-down {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: animate-fade-in-down 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}