import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, Building, Sparkles, ExternalLink, FileText, Users, Plus,
    Trash2, Briefcase, CheckSquare, Brain, Loader2, User, Save, Pencil, FilePen
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { debounce } from 'lodash';
import { ErrorBoundary } from '../ui/ErrorBoundary';

const useDebounce = (callback, delay) => {
    const debouncedFn = useCallback(debounce((...args) => callback(...args), delay), [delay]);
    useEffect(() => {
        return () => { debouncedFn.cancel(); };
    }, [debouncedFn]);
    return debouncedFn;
};

function JobDetailsPanelContent({
    job,
    setSelectedJob,
    onOpenTailorModal,
    onOpenCoverLetterModal,
    onOpenApplicationHelper,
    onOpenOptimizedResumeModal,
    activeProfile
}) {
    const [activeTab, setActiveTab] = useState('description');
    const [notes, setNotes] = useState('');
    const [contacts, setContacts] = useState([]);
    const [newContact, setNewContact] = useState({ name: '', title: '', contact_info: '' });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [localDescription, setLocalDescription] = useState('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    const navigate = useNavigate();

    const updateJobDetails = useStore(state => state.updateJobDetails);
    const addNotification = useStore(state => state.addNotification);
    const handleAnalyzeJob = useStore(state => state.handleAnalyzeJob);
    const handleDeleteJob = useStore(state => state.handleDeleteJob);
    const openConfirmationModal = useStore(state => state.openConfirmationModal);
    const setPrefilledJobDescription = useStore(state => state.setPrefilledJobDescription);

    const debouncedSaveNotes = useDebounce((jobId, newNotes) => {
        if (jobId) updateJobDetails(jobId, { notes: newNotes });
    }, 1000);

    useEffect(() => {
        if (job) {
            setNotes(job.notes || '');
            setContacts(job.contacts || []);
            setLocalDescription(job.description || '');
            setActiveTab('description');
            setIsAnalyzing(false);
            setIsEditingDescription(!job.description);
        }
    }, [job?.id, job?.description]);

    const onAnalyzeClick = async () => {
        if (!activeProfile) {
            addNotification("Please select an active profile on the dashboard first.", "error");
            return;
        }
        if (!localDescription) {
            addNotification("Please paste a job description before analyzing.", "error");
            return;
        }
        setIsAnalyzing(true);
        try {
            await handleAnalyzeJob(job.id, activeProfile.id, localDescription);
        } catch (error) {
            setIsAnalyzing(false);
        }
    };

    const onDeleteClick = () => {
        openConfirmationModal(
            "Delete Job",
            "Are you sure you want to permanently delete this job? This action cannot be undone.",
            () => handleDeleteJob(job.id)
        );
    };

    const handleNotesChange = (e) => {
        setNotes(e.target.value);
        if (job?.id) debouncedSaveNotes(job.id, e.target.value);
    };

    const onSaveDescription = () => {
        if (!localDescription) {
            addNotification("Description can't be empty.", "error");
            return;
        }
        updateJobDetails(job.id, { description: localDescription });
        setIsEditingDescription(false);
    };

    const handleAddContact = () => {
        if (!newContact.name || !newContact.contact_info || !job?.id) return;
        const newContacts = [...(contacts || []), newContact];
        setContacts(newContacts);
        updateJobDetails(job.id, { contacts: newContacts });
        setNewContact({ name: '', title: '', contact_info: '' });
    };
    const handleDeleteContact = (index) => {
        if (!job?.id) return;
        const newContacts = contacts.filter((_, i) => i !== index);
        setContacts(newContacts);
        updateJobDetails(job.id, { contacts: newContacts });
    };

    const handleAddToTracker = () => {
        if (!job?.id) return;
        updateJobDetails(job.id, { is_tracked: true, status: 'Applied' });
        addNotification(`'${job.title}' added to your tracker!`, 'success');
    };

    // --- NEW HANDLER for Feature 2: Contextual Prefilling ---
    const openMakerPage = () => {
        if (!activeProfile) {
            addNotification("Please select an active profile on the dashboard first.", "error");
            return;
        }
        if (!localDescription) {
            addNotification("The job description is empty. Please paste it first.", "error");
            return;
        }
        setPrefilledJobDescription(localDescription);
        setSelectedJob(null); // Close the panel
        navigate('/app/maker');
    };
    // --- END NEW HANDLER ---

    if (!job) return null;

    const TabButton = ({ tabName, icon, label }) => {
        const Icon = icon;
        return (
            <button onClick={() => setActiveTab(tabName)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tabName ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-100'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
            </button>
        );
    };

    const AIRatingDisplay = () => (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-blue-800">
                <Brain className="w-5 h-5" />
                AI Analysis
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-blue-700">{job.gemini_rating}</span>
                <span className="text-lg font-medium text-blue-600">/ 10</span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{job.ai_reason}</p>
            {job.profile_id && (
                <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-4 h-4" />
                    <span>Analyzed using profile ID: {job.profile_id}</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedJob(null)}>
            <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}>
                
                <div className="flex items-start justify-between p-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{job.title}</h2>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5"><Building className="w-4 h-4" /> {job.company}</p>
                        {job.location && <p className="text-xs text-slate-400 mt-1">Location: {job.location}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {job.job_url && (
                            <a
                                href={job.job_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                                title="View on original site"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </a>
                        )}
                        <button
                            onClick={onDeleteClick}
                            className="p-2 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete Job"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => setSelectedJob(null)} className="p-2 rounded-full hover:bg-slate-100">
                            <X className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>
                
                <div className="p-2 border-b border-slate-200 flex items-center gap-2">
                    <TabButton tabName="description" icon={Briefcase} label="Description" />
                    <TabButton tabName="notes" icon={FileText} label="Notes" />
                    <TabButton tabName="contacts" icon={Users} label="Contacts" />
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow">
                    {job.gemini_rating && <AIRatingDisplay />}
                    
                    {activeTab === 'description' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-800">Job Description</h3>
                                {isEditingDescription ? (
                                    <button
                                        onClick={onSaveDescription}
                                        disabled={!localDescription}
                                        className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-emerald-300"
                                        title="Save description"
                                    >
                                        <Save className="w-4 h-4" /> Save
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsEditingDescription(true)}
                                        className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200"
                                        title="Edit description"
                                    >
                                        <Pencil className="w-4 h-4" /> Edit
                                    </button>
                                )}
                            </div>

                            {isEditingDescription ? (
                                <div className="space-y-4">
                                    {!job.description && (
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <h4 className="font-semibold text-slate-600">No Description Found</h4>
                                            <p className="text-sm text-slate-500">
                                                Click the "View on original site" icon (top right) to find and paste the description here.
                                            </p>
                                        </div>
                                    )}
                                    <textarea
                                        value={localDescription}
                                        onChange={(e) => setLocalDescription(e.target.value)}
                                        placeholder="Paste the full job description here..."
                                        className="w-full h-96 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500"
                                    />
                                </div>
                            ) : (
                                <div className="prose prose-slate max-w-none">
                                    <p>{localDescription}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">My Notes</h3>
                            <textarea value={notes} onChange={handleNotesChange} placeholder="Add your notes here... (auto-saves)"
                                className="w-full h-64 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500" />
                        </div>
                    )}
                    {activeTab === 'contacts' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Key Contacts</h3>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="p-3 bg-white border rounded-lg">
                        <h4 className="text-sm font-semibold text-slate-600 mb-3">AI Toolkit</h4>
                        
                        {activeProfile && (
                            <div className="mb-3 p-2 bg-slate-100 rounded-md flex items-center gap-2 text-xs text-slate-600">
                                <User className="w-4 h-4" />
                                <span>Using profile: <span className="font-semibold">{activeProfile.profile_name}</span></span>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={onAnalyzeClick}
                                disabled={isAnalyzing || !localDescription || !activeProfile}
                                className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                                {isAnalyzing ? 'Analyzing...' : (job.gemini_rating ? 'Re-Analyze' : 'Analyze Job')}
                            </button>
                            
                            <button
                                onClick={onOpenTailorModal}
                                disabled={!localDescription || !activeProfile}
                                className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-all disabled:bg-sky-400 disabled:cursor-not-allowed"
                            >
                                <Sparkles className="w-5 h-5" />Tailor Resume
                            </button>
                            
                            <button
                                onClick={onOpenCoverLetterModal}
                                disabled={!localDescription || !activeProfile}
                                className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-all disabled:bg-purple-400 disabled:cursor-not-allowed"
                            >
                                <FileText className="w-5 h-5" />Cover Letter
                            </button>
                            
                            <button
                                onClick={onOpenOptimizedResumeModal}
                                disabled={!localDescription || !activeProfile}
                                className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-all disabled:bg-emerald-400 disabled:cursor-not-allowed"
                            >
                                <FilePen className="w-5 h-5" />Optimize Resume
                            </button>
                        </div>

                        {/* --- NEW BUTTON for Feature 2: Open Maker Page --- */}
                        <button
                            onClick={openMakerPage}
                            disabled={!localDescription || !activeProfile}
                            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-slate-800 rounded-md hover:bg-slate-700 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            <FilePen className="w-5 h-5" /> Full Resume & Letter Maker
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {job.is_tracked ? (
                            <span className="flex-1 flex items-center justify-center gap-2 px-4 py-2 font-semibold text-emerald-700 bg-emerald-100 rounded-md">
                                <CheckSquare className="w-5 h-5" /> Tracked
                            </span>
                        ) : (
                            <button onClick={handleAddToTracker} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-slate-800 rounded-md hover:bg-slate-700 transition-all">
                                <Plus className="w-5 h-5" /> Add to Tracker
                            </button>
                        )}
                        <button
                            onClick={onOpenApplicationHelper}
                            disabled={!activeProfile}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 font-semibold text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200 transition-all disabled:bg-sky-50 disabled:text-sky-400 disabled:cursor-not-allowed"
                        >
                            <ExternalLink className="w-5 h-5" />Apply Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function JobDetailsPanel(props) {
    return (
        <ErrorBoundary>
            <JobDetailsPanelContent {...props} />
        </ErrorBoundary>
    )
}