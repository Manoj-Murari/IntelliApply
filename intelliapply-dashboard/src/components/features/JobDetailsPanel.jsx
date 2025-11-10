import React, { useState, useEffect, useCallback } from 'react';
import { X, Building, Sparkles, ExternalLink, FileText, Users, Plus, Trash2, Briefcase, CheckSquare, Brain, Loader2, User } from 'lucide-react';
import { useStore } from '../../lib/store';
import { debounce } from 'lodash';

const useDebounce = (callback, delay) => {
    const debouncedFn = useCallback(debounce((...args) => callback(...args), delay), [delay]);
    useEffect(() => {
        return () => { debouncedFn.cancel(); };
    }, [debouncedFn]);
    return debouncedFn;
};

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError(error) { return { hasError: true }; }
    componentDidCatch(error, errorInfo) { console.error("Error Boundary caught:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 text-center">
                    <p className="text-red-500 font-semibold">Something went wrong.</p>
                    <button onClick={() => this.setState({ hasError: false })} className="mt-2 px-4 py-2 bg-sky-100 text-sky-700 rounded-md">
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function JobDetailsPanelContent({ job, setSelectedJob, onOpenTailorModal, onOpenCoverLetterModal, onOpenApplicationHelper, activeProfile }) {
    const [activeTab, setActiveTab] = useState('description');
    const [notes, setNotes] = useState('');
    const [contacts, setContacts] = useState([]);
    const [newContact, setNewContact] = useState({ name: '', title: '', contact_info: '' });
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const updateJobDetails = useStore(state => state.updateJobDetails);
    const addNotification = useStore(state => state.addNotification);
    const handleAnalyzeJob = useStore(state => state.handleAnalyzeJob);
    const handleDeleteJob = useStore(state => state.handleDeleteJob);
    const openConfirmationModal = useStore(state => state.openConfirmationModal);

    const debouncedSaveNotes = useDebounce((jobId, newNotes) => {
        if (jobId) updateJobDetails(jobId, { notes: newNotes });
    }, 1000);

    useEffect(() => {
        if (job) {
            setNotes(job.notes || '');
            setContacts(job.contacts || []);
            setActiveTab('description');
            setIsAnalyzing(false); 
        }
    }, [job?.id]);

    const onAnalyzeClick = async () => {
        // --- NEW: Guard clause uses the activeProfile prop ---
        if (!activeProfile) {
            addNotification("Please select an active profile on the dashboard first.", "error");
            return;
        }
        setIsAnalyzing(true);
        try {
            // Pass the active profile's ID
            await handleAnalyzeJob(job.id, activeProfile.id);
            // We no longer set isAnalyzing(false) here.
            // The Realtime update will re-render the panel, resetting the state.
        } catch (error) {
            setIsAnalyzing(false); // Only set false on error
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
            {/* NEW: Show which profile was used for the rating */}
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
                        <div className="prose prose-slate max-w-none">
                            {job.description ? (
                                <p>{job.description}</p>
                            ) : (
                                <div className="text-center p-8 bg-slate-50 rounded-lg">
                                    <h3 className="font-semibold text-slate-600">No Description Available</h3>
                                    <p className="text-sm text-slate-500">
                                        This job was saved without a description (likely from LinkedIn).
                                    </p>
                                    <a 
                                        href={job.job_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 transition-all no-underline">
                                        View on original site <ExternalLink className="w-4 h-4" />
                                    </a>
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
                            {/* ... (contacts content) ... */}
                        </div> 
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="p-3 bg-white border rounded-lg">
                        <h4 className="text-sm font-semibold text-slate-600 mb-3">AI Toolkit</h4>
                        
                        {/* --- UPDATED: AI Toolkit now shows active profile --- */}
                        {activeProfile && (
                            <div className="mb-3 p-2 bg-slate-100 rounded-md flex items-center gap-2 text-xs text-slate-600">
                                <User className="w-4 h-4" />
                                <span>Using profile: <span className="font-semibold">{activeProfile.profile_name}</span></span>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2 flex-wrap">
                            {!job.gemini_rating && job.description && (
                                <button 
                                    onClick={onAnalyzeClick}
                                    disabled={isAnalyzing || !activeProfile} // <-- Disable if no active profile
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed"
                                >
                                    {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                                    {isAnalyzing ? 'Analyzing...' : 'Analyze Job'}
                                </button>
                            )}
                            <button onClick={onOpenTailorModal} disabled={!activeProfile} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-all disabled:bg-sky-400 disabled:cursor-not-allowed"><Sparkles className="w-5 h-5" />Tailor Resume</button>
                            <button onClick={onOpenCoverLetterModal} disabled={!activeProfile} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-all disabled:bg-purple-400 disabled:cursor-not-allowed"><FileText className="w-5 h-5" />Generate Cover Letter</button>
                        </div>
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