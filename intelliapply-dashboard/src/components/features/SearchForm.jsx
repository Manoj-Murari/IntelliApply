import React, { useState } from 'react';

// This is the form, extracted and simplified.
export default function SearchForm({ search, profiles, onSave, onCancel }) {
    const [formData, setFormData] = useState({ 
        ...search, 
        // profile_id: search.profile_id || '', // <-- This is now obsolete
        experience_level: search.experience_level || 'entry_level',
        hours_old: search.hours_old || 24 
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        const finalValue = name === 'hours_old' ? parseInt(value, 10) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // We no longer pass profile_id from the form
        const dataToSave = { ...formData, profile_id: null }; 
        onSave(dataToSave);
    };

    const experienceLevels = [
        { value: 'entry_level', label: 'Entry Level' },
        { value: 'mid_level', label: 'Mid Level' },
        { value: 'senior_level', label: 'Senior Level' },
        { value: 'executive', label: 'Executive' },
    ];
    
    const datePostedOptions = [
        { value: 24, label: 'Last 24 hours' },
        { value: 72, label: 'Last 3 days' },
        { value: 168, label: 'Last 7 days' },
        { value: 720, label: 'Last 30 days' },
    ];

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border">
            <h2 className="text-2xl font-bold mb-6">{search.id ? 'Edit Search' : 'Create New Search'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="search_name" className="block text-sm font-medium text-slate-700 mb-1">Search Name</label>
                    <input type="text" id="search_name" name="search_name" value={formData.search_name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="e.g., Remote AI Jobs" required />
                </div>
                <div>
                    <label htmlFor="search_term" className="block text-sm font-medium text-slate-700 mb-1">Search Term</label>
                    <input type="text" id="search_term" name="search_term" value={formData.search_term} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="e.g., AI Engineer" required />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <div>
                    <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                    <input type="text" id="country" name="country" value={formData.country} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="e.g., India (or leave blank)" />
                </div>
                <div>
                    <label htmlFor="experience_level" className="block text-sm font-medium text-slate-700 mb-1">Experience Level</label>
                    <select id="experience_level" name="experience_level" value={formData.experience_level} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
                        {experienceLevels.map(level => ( <option key={level.value} value={level.value}>{level.label}</option> ))}
                    </select>
                </div>
            </div>

            <div className="mb-6">
                <label htmlFor="hours_old" className="block text-sm font-medium text-slate-700 mb-1">Date Posted</label>
                <select id="hours_old" name="hours_old" value={formData.hours_old} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
                    {datePostedOptions.map(option => ( <option key={option.value} value={option.value}>{option.label}</option> ))}
                </select>
            </div>
            
            {/* The "Link to Profile" dropdown is now gone */}
            
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md font-semibold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md font-semibold">Save Search</button>
            </div>
        </form>
    );
}