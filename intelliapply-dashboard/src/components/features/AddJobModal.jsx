// src/components/features/AddJobModal.jsx
import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { X, Plus, Briefcase, Building, Link, MapPin, FileText, Loader2 } from 'lucide-react';

export default function AddJobModal({ isOpen, onClose }) {
    const handleSaveManualJob = useStore((state) => state.handleSaveManualJob);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        job_url: '',
        location: '',
        description: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await handleSaveManualJob(formData);
        setIsLoading(false);
        if (success) {
            onClose();
            setFormData({ title: '', company: '', job_url: '', location: '', description: '' });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Plus className="w-6 h-6 text-sky-500" />
                        <h2 className="text-xl font-bold text-slate-800">Add a Job Manually</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <p className="text-sm text-slate-500">
                        Found a job on a site we don't scan? Paste the details here to add it to your library.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Job Title*</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Briefcase className="w-5 h-5 text-slate-400" /></span>
                                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md" placeholder="e.g., AI Engineer" required />
                            </div>
                        </div>
                        {/* Company */}
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1">Company*</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Building className="w-5 h-5 text-slate-400" /></span>
                                <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md" placeholder="e.g., OpenAI" required />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Job URL */}
                        <div>
                            <label htmlFor="job_url" className="block text-sm font-medium text-slate-700 mb-1">Job URL*</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Link className="w-5 h-5 text-slate-400" /></span>
                                <input type="url" id="job_url" name="job_url" value={formData.job_url} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md" placeholder="https://company.com/careers/job" required />
                            </div>
                        </div>
                        {/* Location */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">Location (Optional)</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><MapPin className="w-5 h-5 text-slate-400" /></span>
                                <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md" placeholder="e.g., Remote" />
                            </div>
                        </div>
                    </div>
                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                        <div className="relative">
                            <span className="absolute top-3 left-0 flex items-center pl-3"><FileText className="w-5 h-5 text-slate-400" /></span>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="8" className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md" placeholder="Paste the job description here to enable AI features..."></textarea>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-4">
                    <button onClick={onClose} type="button" className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md font-semibold hover:bg-slate-300 transition">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !formData.title || !formData.company || !formData.job_url}
                        className="w-32 flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-700 transition disabled:bg-sky-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Job"}
                    </button>
                </div>
            </div>
        </div>
    );
}