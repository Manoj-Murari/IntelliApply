import React, { useState, useMemo } from 'react'; // <-- Removed useEffect
import { useStore } from '../../lib/store';
import { Archive, Filter, Linkedin, Briefcase, Trash2, Search, CheckSquare, Square } from 'lucide-react'; 

// --- JobCard (Unchanged) ---
function JobCard({ job, setSelectedJob, isSelected, onToggleSelect }) {
  
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
  
  const handleCardClick = () => {
    setSelectedJob(job);
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation(); 
    onToggleSelect(job.id);
  };
  
  return (
    <div 
      onClick={handleCardClick}
      className={`relative bg-white p-4 rounded-lg border-2 transition-all ${
          isSelected 
            ? 'border-sky-500 shadow-md' 
            : 'border-slate-200 hover:border-sky-500'
      } cursor-pointer`}
    >
      <div 
        onClick={handleCheckboxClick} 
        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-sky-600 z-10"
        title="Select job"
      >
        {isSelected ? (
          <CheckSquare className="w-5 h-5 text-sky-600" />
        ) : (
          <Square className="w-5 h-5" />
        )}
      </div>

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
// --- END JobCard ---

export default function AllJobs({ jobs, setSelectedJob }) {
    const [platformFilter, setPlatformFilter] = useState('all'); 

    // --- THIS IS THE FIX ---
    // We select each value from the store *individually*.
    // This is the stable pattern for Zustand and prevents infinite loops.
    const selectedJobIds = useStore(state => state.selectedJobIds);
    const toggleJobSelection = useStore(state => state.toggleJobSelection);
    const clearJobSelection = useStore(state => state.clearJobSelection);
    const openConfirmationModal = useStore(state => state.openConfirmationModal);
    const handleDeleteAllJobs = useStore(state => state.handleDeleteAllJobs);
    const handleDeleteSelectedJobs = useStore(state => state.handleDeleteSelectedJobs);
    // --- END FIX ---

    const platformFilterOptions = [
        { value: 'all', label: 'All Platforms' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'indeed', label: 'Indeed' },
        { value: 'glassdoor', label: 'Glassdoor' },
    ];

    const filteredJobs = useMemo(() => {
        if (platformFilter === 'all') {
            return jobs;
        }
        return jobs.filter(job => job.job_url && job.job_url.includes(platformFilter));
    }, [jobs, platformFilter]);

    // This logic is correct: call clearJobSelection when the filter changes
    const handleFilterChange = (e) => {
        setPlatformFilter(e.target.value);
        clearJobSelection(); 
    };

    const onDeleteAllClick = () => {
        openConfirmationModal(
            "Delete All Jobs",
            "This will permanently delete all jobs that are NOT on your tracker. Are you sure?",
            () => handleDeleteAllJobs()
        );
    };

    const onDeleteSelectedClick = () => {
        if (selectedJobIds.size === 0) {
            useStore.getState().addNotification("No jobs selected.", "warning");
            return;
        }
        openConfirmationModal(
            `Delete ${selectedJobIds.size} Job(s)`,
            `Are you sure you want to permanently delete ${selectedJobIds.size} selected job(s)? (Tracked jobs will be skipped)`,
            () => handleDeleteSelectedJobs()
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <Archive className="w-7 h-7" />
                    <h2 className="text-2xl font-bold">Job Library</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            value={platformFilter}
                            onChange={handleFilterChange} 
                            className="bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm font-medium"
                        >
                            {platformFilterOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    
                    <button
                        onClick={onDeleteSelectedClick}
                        disabled={selectedJobIds.size === 0}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Selected ({selectedJobIds.size})
                    </button>
                    <button
                        onClick={onDeleteAllClick}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete All
                    </button>
                </div>
            </div>

            <div className="bg-white/50 border border-slate-200 rounded-lg p-4 min-h-[400px]">
                {filteredJobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredJobs.map(job => (
                            <JobCard 
                                key={job.id} 
                                job={job} 
                                setSelectedJob={setSelectedJob}
                                isSelected={selectedJobIds.has(job.id)}
                                onToggleSelect={toggleJobSelection}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-10">
                        <Search className="w-16 h-16 mb-4 text-slate-400" /> 
                        <h3 className="text-lg font-semibold">No jobs found for this filter</h3>
                        <p>Try selecting a different platform or find new jobs from the dashboard.</p>
                    </div>
                )}
            </div>
        </div>
    );
}