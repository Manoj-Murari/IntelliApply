import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { X, Sparkles, Clipboard, Check, Loader2 } from 'lucide-react';
import AILoader from '../ui/AILoader'; // We can reuse this!

// This is a simple Markdown renderer for the resume
// We are not using a full library to keep it light.
const SimpleMarkdown = ({ text }) => {
    const lines = text.split('\n');
    return (
        <div className="prose prose-slate max-w-none">
            {lines.map((line, index) => {
                if (line.startsWith('## ')) {
                    return <h2 key={index}>{line.substring(3)}</h2>;
                }
                if (line.startsWith('# ')) {
                    return <h1 key={index}>{line.substring(2)}</h1>;
                }
                if (line.startsWith('- ')) {
                    return <li key={index}>{line.substring(2)}</li>;
                }
                if (line.trim() === '') {
                    return <br key={index} />;
                }
                return <p key={index}>{line}</p>;
            })}
        </div>
    );
};

export default function OptimizedResumeModal({ isOpen, onClose, job, profile }) {
    // Get state from the store
    const isGenerating = useStore(state => state.isGenerating);
    const aiError = useStore(state => state.aiError);
    const optimizedResume = useStore(state => state.optimizedResume);
    const handleGenerateOptimizedResume = useStore(state => state.handleGenerateOptimizedResume);

    const [hasCopied, setHasCopied] = useState(false);

    const onGenerate = () => {
        if (!profile || !job) {
            useStore.getState().addNotification("Job or Profile missing.", "error");
            return;
        }
        handleGenerateOptimizedResume(job.id, profile.id);
    };

    const handleCopyToClipboard = () => {
        if (!optimizedResume) return;
        navigator.clipboard.writeText(optimizedResume);
        setHasCopied(true);
        useStore.getState().addNotification("Resume copied to clipboard!", "success");
        setTimeout(() => setHasCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-emerald-500" />
                        <h2 className="text-xl font-bold text-slate-800">AI Resume Optimizer</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                        <p><span className="font-semibold">Target Job:</span> {job?.title || 'N/A'}</p>
                        <p><span className="font-semibold">Using Profile:</span> {profile?.profile_name || 'N/A'}</p>
                    </div>
                    
                    {isGenerating ? (
                        <AILoader text="The AI Crew is optimizing your resume. This may take 30-60 seconds..." />
                    ) : aiError ? (
                        <p className="text-center text-red-500 p-8">{aiError}</p>
                    ) : optimizedResume ? (
                        <div className="bg-slate-100 p-4 rounded-md border">
                            <SimpleMarkdown text={optimizedResume} />
                        </div>
                    ) : (
                        <div className="text-center p-8">
                            <p className="text-slate-600">Click the button below to generate an optimized resume tailored for this job description.</p>
                            <p className="text-sm text-slate-500 mt-2">(This uses an AI Crew and may take up to a minute)</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-4">
                    {optimizedResume && !isGenerating && (
                         <button onClick={handleCopyToClipboard} className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200 transition-all">
                            {hasCopied ? <><Check className="w-5 h-5" /> Copied!</> : <><Clipboard className="w-5 h-5" /> Copy Markdown</>}
                         </button>
                    )}
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-all disabled:bg-emerald-400 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-5 h-5" />
                        {isGenerating ? 'Generating...' : (optimizedResume ? 'Regenerate' : 'Generate Resume')}
                    </button>
                </div>
            </div>
        </div>
    );
}