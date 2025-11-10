import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { Search, Loader2, Inbox, Archive, Briefcase, Plus, Linkedin, User } from 'lucide-react';
import EmptyDashboard from './EmptyDashboard';
import AllJobs from './AllJobs';
import KanbanTracker from './KanbanTracker';

// --- JobCard Component (for the Inbox) (Unchanged) ---
function JobCard({ job, setSelectedJob }) {
 
  const getPlatform = (url) => {
    if (!url) return { name: 'Unknown', icon: Briefcase, color: 'bg-slate-100 text-slate-600' };
    if (url.includes('linkedin')) {
      return { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-100 text-blue-700' };
    }
    if (url.includes('indeed')) {
      return { name: 'Indeed', icon: Briefcase, color: 'bg-sky-100 text-sky-700' };
    }
    if (url.includes('glassdoor')) {
      return { name: 'Glassdoor', icon: Briefcase, color: 'bg-emerald-100 text-emerald-700' };
    }
    return { name: 'Other', icon: Briefcase, color: 'bg-slate-100 text-slate-600' };
  };

  const platform = getPlatform(job.job_url);
  const PlatformIcon = platform.icon;

  return (
    <div 
      onClick={() => setSelectedJob(job)}
      className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md hover:border-sky-500 cursor-pointer transition-all animate-fade-in"
    >
      <span className={`flex items-center gap-1.5 w-fit text-xs font-semibold px-2 py-1 rounded-full mb-2 ${platform.color}`}>
        <PlatformIcon className="w-3 h-3" />
        {platform.name}
      </span>
      <h3 className="font-bold text-lg text-slate-800 truncate">{job.title}</h3>
      <p className="text-sm text-slate-600">{job.company}</p>
      <div className="mt-4 flex gap-2">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          job.description 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-slate-100 text-slate-500'
        }`}>
          {job.description ? 'Description ✓' : 'No Description'}
        </span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          job.gemini_rating
            ? 'bg-blue-100 text-blue-800'
            : 'bg-slate-100 text-slate-500'
        }`}>
          AI: {job.gemini_rating ? `${job.gemini_rating}/10` : 'N/A'}
        </span>
      </div>
    </div>
  );
}

// --- SkeletonGrid Component (for the Inbox) (Unchanged) ---
function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="animate-pulse flex flex-col space-y-3">
                        <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        <div className="flex gap-2 pt-2">
                            <div className="h-5 bg-slate-200 rounded-full w-24"></div>
                            <div className="h-5 bg-slate-200 rounded-full w-24"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- JobInbox Component (for the "Inbox" tab) (Unchanged) ---
function JobInbox({ newJobs, setSelectedJob, isSearching }) {
  const searches = useStore(state => state.searches);
  const hasSearches = searches.length > 0;

  return (
    <div className="bg-white/50 border border-slate-200 rounded-lg p-4 min-h-[300px]">
      {isSearching ? (
          <SkeletonGrid />
      ) : !hasSearches ? (
          <EmptyDashboard />
      ) : newJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-10">
              <Inbox className="w-16 h-16 mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold">Your inbox is empty</h3>
              <p>New jobs from your search will appear here in real-time.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newJobs.map(job => (
                  <JobCard key={`new-${job.id}`} job={job} setSelectedJob={setSelectedJob} />
              ))}
          </div>
      )}
    </div>
  );
}

// --- TabButton Component (Unchanged) ---
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


// --- Main Dashboard Component (NOW A CONTAINER) ---
export default function Dashboard({ newJobs, setSelectedJob, onTriggerJobSearch, isSearching }) {
    
    const [subView, setSubView] = useState('inbox'); // inbox | all | tracker
    
    // --- THIS IS THE FIX ---
    // We select each piece of state individually from the store.
    const allJobs = useStore((state) => state.allJobs);
    const updateJobStatus = useStore((state) => state.updateJobStatus);
    const openSearchModal = useStore((state) => state.openSearchModal);
    const profiles = useStore((state) => state.profiles);
    const activeProfileId = useStore((state) => state.activeProfileId);
    const setActiveProfileId = useStore((state) => state.setActiveProfileId);
    // --- END OF FIX ---

    return (
        <div className="space-y-8">
            {/* Section 1: Find New Jobs */}
            <section>
                <div className="bg-white/50 border border-slate-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold">Find New Jobs</h2>
                            <p className="text-slate-500 mt-1">Run your saved searches or create a new one.</p>
                        </div>
                        <div className="flex gap-2"> 
                            <button
                                onClick={openSearchModal} 
                                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 transition-all"
                            >
                                <Plus className="w-4 h-4" /> New Search
                            </button>
                            <button
                                onClick={onTriggerJobSearch}
                                disabled={isSearching}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-all disabled:bg-sky-300 disabled:cursor-not-allowed w-40"
                            >
                                {isSearching ? ( <><Loader2 className="w-4 h-4 animate-spin" /><span>Searching...</span></> ) 
                                            : ( <><Search className="w-4 h-4" /><span>Find Jobs Now</span></> )}
                            </button>
                        </div>
                    </div>
                    
                    {/* --- Active Profile Selector --- */}
                    {profiles.length > 0 && (
                        <div className="border-t border-slate-200 pt-4">
                            <label htmlFor="active-profile" className="block text-sm font-medium text-slate-700 mb-1">
                                Active Profile for AI Analysis
                            </label>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                <select
                                    id="active-profile"
                                    value={activeProfileId || ''}
                                    onChange={(e) => setActiveProfileId(e.target.value)}
                                    className="w-full max-w-xs bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-sky-500"
                                >
                                    {profiles.map(profile => (
                                        <option key={profile.id} value={profile.id}>
                                            {profile.profile_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                AI features like "Analyze Job" will use the context from this profile.
                            </p>
                        </div>
                    )}
                    
                </div>
            </section>

            {/* Section 2: NEW Tabbed Layout */}
            <section>
                {/* The Tab Buttons */}
                <div className="flex items-center gap-2 mb-4">
                    <TabButton 
                        icon={Inbox} 
                        label="Inbox" 
                        isActive={subView === 'inbox'} 
                        onClick={() => setSubView('inbox')} 
                    />
                    <TabButton 
                        icon={Archive} 
                        label="Job Library" 
                        isActive={subView === 'all'} 
                        onClick={() => setSubView('all')} 
                    />
                    <TabButton 
                        icon={Briefcase} 
                        label="Tracker" 
                        isActive={subView === 'tracker'} 
                        onClick={() => setSubView('tracker')} 
                    />
                </div>
                
                {/* The Tab Content */}
                <div>
                    {subView === 'inbox' && (
                        <JobInbox 
                            newJobs={newJobs} 
                            setSelectedJob={setSelectedJob} 
                            isSearching={isSearching} 
                        />
                    )}
                    
                    {subView === 'all' && (
                        <AllJobs 
                            jobs={allJobs} 
                            setSelectedJob={setSelectedJob} 
                        />
                    )}
                    
                    {subView === 'tracker' && (
                        <KanbanTracker 
                            jobs={allJobs} 
                            updateJobStatus={updateJobStatus} 
                            setSelectedJob={setSelectedJob} 
                        />
                    )}
                </div>
            </section>
        </div>
    );
}