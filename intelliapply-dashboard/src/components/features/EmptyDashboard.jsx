import React from 'react';
import { Search, Inbox } from 'lucide-react';
import { useStore } from '../../lib/store';

export default function EmptyDashboard() {
  const setView = useStore(state => state.setView);

  return (
    <div className="text-center p-12 bg-white/50 border-2 border-dashed border-slate-300 rounded-lg">
      <Inbox className="w-16 h-16 text-slate-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-slate-700 mb-2">
        Your Job Inbox is Empty
      </h3>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">
        You don't have any saved job searches yet. Create a search to let the
        AI find and filter new jobs for you.
      </p>
      <button
        onClick={() => setView('searches')}
        className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-all mx-auto"
      >
        <Search className="w-5 h-5" />
        Create Your First Search
      </button>
    </div>
  );
}