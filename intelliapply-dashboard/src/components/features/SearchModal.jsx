import React from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import { useStore } from '../../lib/store';
import SearchForm from './SearchForm'; // Import our new reusable form

export default function SearchModal({ isOpen, onClose }) {
  const { profiles, handleSaveSearch } = useStore();

  const newSearchTemplate = {
    id: null,
    search_name: '',
    search_term: '',
    country: 'India', // Default to India
    profile_id: '',
    experience_level: 'entry_level',
    hours_old: 24,
  };

  const handleSaveAndClose = (search) => {
    handleSaveSearch(search);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <SearchIcon className="w-6 h-6 text-sky-500" />
            <h2 className="text-xl font-bold text-slate-800">Create New Search</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto">
          <SearchForm
            search={newSearchTemplate}
            profiles={profiles} // Pass profiles (even though form ignores it)
            onSave={handleSaveAndClose}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}