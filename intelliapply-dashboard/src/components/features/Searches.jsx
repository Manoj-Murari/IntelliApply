import React, { useState } from 'react';
import { Plus, Edit, Trash2, Link2, BarChartHorizontal, Clock } from 'lucide-react';
import SearchForm from './SearchForm'; // <-- NEW IMPORT

// This is the main component for the "Searches" tab
export default function Searches({ searches, profiles, onSave, onDeleteRequest }) {
    const [editingSearch, setEditingSearch] = useState(null);

    // We no longer need the profileMap
    const experienceLevelLabels = { 'entry_level': 'Entry Level', 'mid_level': 'Mid Level', 'senior_level': 'Senior Level', 'executive': 'Executive' };
    const datePostedLabels = { 24: 'Last 24h', 72: 'Last 3d', 168: 'Last 7d', 720: 'Last 30d' };

    if (editingSearch) {
        return <SearchForm 
            search={editingSearch} 
            profiles={profiles} // We pass this but the form ignores it
            onSave={(s) => { onSave(s); setEditingSearch(null); }} 
            onCancel={() => setEditingSearch(null)} 
        />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Custom Job Searches</h2>
                <button onClick={() => setEditingSearch({ id: null, search_name: '', search_term: '', country: '', profile_id: '', experience_level: 'entry_level', hours_old: 24 })} className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-sky-700 transition">
                    <Plus className="w-5 h-5" /> New Search
                </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {searches.length === 0 && <p className="text-slate-500">You haven't created any searches yet.</p>}
                {searches.map(search => (
                    <div key={search.id} className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">{search.search_name}</h3>
                                <p className="text-sm text-slate-600">Term: "{search.search_term}" | Country: {search.country || 'Any'}</p>
                                <div className="flex items-center flex-wrap gap-4 mt-2">
                                    {/* This is no longer relevant
                                    <div className="flex items-center gap-2 text-xs text-sky-700 font-semibold bg-sky-100 px-2 py-1 rounded-full w-fit">
                                        <Link2 className="w-3 h-3" />
                                        <span>Profile: {profileMap.get(search.profile_id) || 'None'}</span>
                                    </div>
                                    */}
                                     <div className="flex items-center gap-2 text-xs text-purple-700 font-semibold bg-purple-100 px-2 py-1 rounded-full w-fit">
                                        <BarChartHorizontal className="w-3 h-3" />
                                        <span>Exp: {experienceLevelLabels[search.experience_level] || 'Any'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold bg-amber-100 px-2 py-1 rounded-full w-fit">
                                        <Clock className="w-3 h-3" />
                                        <span>Posted: {datePostedLabels[search.hours_old] || 'Any'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingSearch(search)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => onDeleteRequest(search.id)} className="p-2 hover:bg-red-50 rounded-md text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}