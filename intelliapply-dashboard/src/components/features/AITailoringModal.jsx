import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { X, Sparkles, Lightbulb } from 'lucide-react';
import AILoader from '../ui/AILoader'; // --- IMPORT ---
import PasteDescription from '../ui/PasteDescription'; // --- IMPORT ---

// --- AILoader component definition is REMOVED ---
// --- PasteDescription component definition is REMOVED ---

export default function AITailoringModal({ isOpen, onClose, job, profile }) {
    const isGenerating = useStore(state => state.isGenerating);
    const tailoringSuggestions = useStore(state => state.tailoringSuggestions);
    const aiError = useStore(state => state.aiError);
    const handleGetTailoring = useStore(state => state.handleGetTailoring);
    
    const [description, setDescription] = useState('');
    useEffect(() => {
        if (isOpen && job) setDescription(job.description || '');
    }, [isOpen, job]);

    const onGenerate = (descToUse) => {
        if (!profile) {
            useStore.getState().addNotification("No profile selected.", "error");
            return;
        }
        setDescription(descToUse); 
        handleGetTailoring(descToUse, profile.id);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-sky-500" />
                        <h2 className="text-xl font-bold text-slate-800">AI Resume Tailoring</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                        <p><span className="font-semibold">Target Job:</span> {job?.title || 'N/A'}</p>
                        <p><span className="font-semibold">Using Profile:</span> {profile?.profile_name || 'N/A'}</p>
                    </div>
                    {isGenerating ? (
                        <AILoader text="Your AI Career Coach is analyzing the data..." />
                    ) : aiError ? (
                        <p className="text-center text-red-500 p-8">{aiError}</p>
                    ) : tailoringSuggestions.length > 0 ? (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-700">Here are your AI-powered suggestions:</h3>
                            {tailoringSuggestions.map((suggestion, index) => (
                                <div key={index} className="flex items-start gap-3 bg-sky-50/50 p-3 rounded-md border border-sky-200">
                                    <Lightbulb className="w-5 h-5 text-sky-500 mt-1 flex-shrink-0" />
                                    <p className="text-slate-700">{suggestion}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        description ? (
                            <div className="text-center p-8">
                                <p className="text-slate-600">Click the button below to get personalized suggestions.</p>
                            </div>
                        ) : (
                            <PasteDescription onGenerate={onGenerate} buttonText="Generate Suggestions" />
                        )
                    )}
                </div>
                {(description && tailoringSuggestions.length === 0 && !isGenerating && !aiError) && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                        <button
                            onClick={() => onGenerate(description)}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-all disabled:bg-sky-400 disabled:cursor-not-allowed"
                        >
                            <Sparkles className="w-5 h-5" />
                            {isGenerating ? 'Generating...' : 'Get AI Suggestions'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}