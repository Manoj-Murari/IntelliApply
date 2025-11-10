import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { X, Sparkles, Clipboard, Check } from 'lucide-react';
import AILoader from '../ui/AILoader'; // --- IMPORT ---
import PasteDescription from '../ui/PasteDescription'; // --- IMPORT ---

// --- AILoader component definition is REMOVED ---
// --- PasteDescription component definition is REMOVED ---

export default function AICoverLetterModal({ isOpen, onClose, job, profile }) {
    const isGenerating = useStore(state => state.isGenerating);
    const coverLetter = useStore(state => state.coverLetter);
    const aiError = useStore(state => state.aiError);
    const handleGetCoverLetter = useStore(state => state.handleGetCoverLetter);

    const [description, setDescription] = useState('');
    const [hasCopied, setHasCopied] = useState(false);

    useEffect(() => {
        if (isOpen && job) setDescription(job.description || '');
    }, [isOpen, job]);

    const onGenerate = (descToUse) => {
        if (!profile || !job) {
            useStore.getState().addNotification("Job or Profile missing.", "error");
            return;
        }
        setDescription(descToUse);
        handleGetCoverLetter(job, profile.id, descToUse);
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(coverLetter);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-sky-500" />
                        <h2 className="text-xl font-bold text-slate-800">AI Cover Letter Generator</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                        <p><span className="font-semibold">Target Job:</span> {job?.title || 'N/A'}</p>
                        <p><span className="font-semibold">Using Profile:</span> {profile?.profile_name || 'N/A'}</p>
                    </div>
                    {isGenerating ? (
                        <AILoader text="Your AI co-pilot is writing the first draft..." />
                    ) : aiError ? (
                        <p className="text-center text-red-500 p-8">{aiError}</p>
                    ) : coverLetter ? (
                        <div className="bg-slate-100 p-4 rounded-md border prose prose-slate max-w-none">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{coverLetter}</p>
                        </div>
                    ) : (
                        description ? (
                            <div className="text-center p-8">
                                <p className="text-slate-600">Click the button below to generate a tailored first draft.</p>
                            </div>
                        ) : (
                            <PasteDescription onGenerate={onGenerate} buttonText="Generate Cover Letter" />
                        )
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-4">
                    {coverLetter && (
                         <button onClick={handleCopyToClipboard} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200 transition-all">
                            {hasCopied ? <><Check className="w-5 h-5" /> Copied!</> : <><Clipboard className="w-5 h-5" /> Copy to Clipboard</>}
                         </button>
                    )}
                    {(description && !isGenerating && !aiError) && (
                        <button
                            onClick={() => onGenerate(description)}
                            disabled={isGenerating}
                            className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-all disabled:bg-sky-400 disabled:cursor-not-allowed"
                        >
                            <Sparkles className="w-5 h-5" />
                            {isGenerating ? 'Generating...' : (coverLetter ? 'Regenerate' : 'Generate Cover Letter')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}