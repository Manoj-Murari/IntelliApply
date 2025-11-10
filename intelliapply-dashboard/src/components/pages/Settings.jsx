import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { User, Search as SearchIcon, Settings as SettingsIcon } from 'lucide-react';

// Import the components that will live inside the tabs
import Profiles from '../features/Profiles';
import Searches from '../features/Searches';

// TabButton component (local to this file)
function TabButton({ icon, label, isActive, onClick }) {
  const Icon = icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        isActive
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

  // Get all the props needed for the child components from the store
  const {
    profiles,
    searches,
    handleSaveProfile,
    handleDeleteProfile,
    handleSaveSearch,
    handleDeleteSearch,
    openConfirmationModal,
  } = useStore();

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
        <TabButton
          icon={SearchIcon}
          label="Job Searches"
          isActive={subView === 'searches'}
          onClick={() => setSubView('searches')}
        />
      </div>

      {/* The Tab Content */}
      <div>
        {subView === 'profiles' && (
          <Profiles
            profiles={profiles}
            onSave={handleSaveProfile}
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
            profiles={profiles}
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