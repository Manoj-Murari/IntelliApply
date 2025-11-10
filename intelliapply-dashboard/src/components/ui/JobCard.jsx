import React from 'react';
import { Briefcase, Linkedin, CheckSquare, Square } from 'lucide-react';

/**
 * This is the new, consolidated JobCard component.
 * It will show a checkbox for selection only if 'onToggleSelect' is provided.
 */
export default function JobCard({ job, setSelectedJob, isSelected, onToggleSelect }) {
  
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

  // Conditionally handle the checkbox click if the function is provided
  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(job.id);
    }
  };
  
  // Show checkbox *only if* onToggleSelect is provided
  const showCheckbox = onToggleSelect !== undefined;

  return (
    <div 
      onClick={handleCardClick}
      className={`relative bg-white p-4 rounded-lg border-2 transition-all ${
          isSelected 
            ? 'border-sky-500 shadow-md' 
            : 'border-slate-200 hover:border-sky-500'
      } cursor-pointer`}
    >
      {/* --- Conditional Checkbox --- */}
      {showCheckbox && (
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
      )}

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