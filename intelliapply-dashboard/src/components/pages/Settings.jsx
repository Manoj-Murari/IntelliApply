import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { User, Search as SearchIcon, Settings as SettingsIcon } from 'lucide-react';

// Import the components that will live inside the tabs
import Profiles from '../features/Profiles';
// import Searches from '../features/Searches'; // Deprecated

// TabButton component (local to this file)
function TabButton({ icon, label, isActive, onClick }) {
  const Icon = icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${isActive
        ? 'bg-sky-100 text-sky-700'
        : 'text-slate-500 hover:bg-slate-100'
        }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export default function Settings() {
  const [subView, setSubView] = useState('profiles'); // profiles | searches

  // --- THIS IS THE FIX ---
  // We select each piece of state individually to prevent infinite re-renders.
  const profiles = useStore((state) => state.profiles);
  const searches = useStore((state) => state.searches);
  const loading = useStore((state) => state.loading);
  const handleSaveProfile = useStore((state) => state.handleSaveProfile);
  const handleDeleteProfile = useStore((state) => state.handleDeleteProfile);
  const handleRemoveResume = useStore((state) => state.handleRemoveResume);
  const handleSaveSearch = useStore((state) => state.handleSaveSearch);
  const handleDeleteSearch = useStore((state) => state.handleDeleteSearch);
  const openConfirmationModal = useStore((state) => state.openConfirmationModal);
  // --- END OF FIX ---

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-7 h-7" />
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      {/* The Tab Buttons */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
        <TabButton
          icon={User}
          label="Resume Profiles"
          isActive={subView === 'profiles'}
          onClick={() => setSubView('profiles')}
        />
        {/* Searches tab deprecated */}
      </div>

      {/* The Tab Content */}
      <div>
        {subView === 'profiles' && (
          <Profiles
            profiles={profiles}
            loading={loading}
            onSave={handleSaveProfile}
            onRemoveResume={handleRemoveResume}
            onDeleteRequest={(id) =>
              openConfirmationModal(
                'Delete Profile',
                `This will also delete any jobs found using this profile's searches. Are you sure?`,
                () => handleDeleteProfile(id)
              )
            }
          />
        )}

        {subView === 'searches' && (
          <Searches
            searches={searches}
            onSave={handleSaveSearch}
            onDeleteRequest={(id) =>
              openConfirmationModal(
                'Delete Search',
                `This will also delete any jobs found with this search. Are you sure?`,
                () => handleDeleteSearch(id)
              )
            }
          />
        )}
      </div>
    </div>
  );
}