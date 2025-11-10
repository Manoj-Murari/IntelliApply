import React, { useEffect, useState } from 'react';
import { useStore } from '../../lib/store';
import { X, Sparkles, HelpCircle, AlertTriangle, Loader2 } from 'lucide-react';

function AILoader() {
    return (
        <div className="text-center p-8">
            <Loader2 className="w-12 h-12 text-purple-500 mx-auto animate-spin" />
            <p className="mt-4 font-semibold text-slate-600">Your AI co-pilot is preparing your interview questions...</p>
            <p className="text-sm text-slate-500">This may take a moment.</p>
        </div>
    );
}

function PasteDescription({ onGenerate }) {
    const [pastedDesc, setPastedDesc] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (pastedDesc.trim()) onGenerate(pastedDesc);
    };
    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <h3 className="font-semibold text-slate-700">No Description Found</h3>
            <p className="text-sm text-slate-500">
                This job was saved without a description. Please paste the
                job description below to generate interview questions.
            </p>
            <textarea
                value={pastedDesc}
                onChange={(e) => setPastedDesc(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full h-48 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500"
                required
            />
            <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-all"
            >
                <Sparkles className="w-5 h-5" />
                Generate Questions
            </button>
        </form>
    );
}

function QuestionCategory({ title, questions }) {
    if (!questions || questions.length === 0) return null;
    return (
        <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 border-b-2 border-purple-200 pb-2">{title}</h3>
            <ul className="space-y-4">
                {questions.map((question, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                        <p className="text-slate-700">{question}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function AIInterviewPrepModal({ isOpen, onClose, job, profile }) {
    // --- THIS IS THE FIX ---
    const isGenerating = useStore(state => state.isGenerating);
    const interviewPrepData = useStore(state => state.interviewPrepData);
    const aiError = useStore(state => state.aiError);
    const generateInterviewPrep = useStore(state => state.generateInterviewPrep);
    // --- END FIX ---

    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen && job) setDescription(job.description || '');
    }, [isOpen, job]);
    
    useEffect(() => {
        if (isOpen && profile && description && !interviewPrepData && !isGenerating && !aiError) {
            generateInterviewPrep(job, profile, description);
        }
    }, [isOpen, profile, description, interviewPrepData, isGenerating, aiError, generateInterviewPrep, job]);

    const onGenerate = (descToUse) => {
        if (!profile || !job) {
            useStore.getState().addNotification("Job or Profile missing.", "error");
            return;
        }
        setDescription(descToUse);
        generateInterviewPrep(job, profile, descToUse);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-purple-500" />
                        <h2 className="text-xl font-bold text-slate-800">AI Interview Prep</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                        <p><span className="font-semibold">Prepping for:</span> {job?.title || 'N/A'}</p>
                        <p><span className="font-semibold">Using Profile:</span> {profile?.profile_name || 'N/A'}</p>
                    </div>
                    {isGenerating ? (
                        <AILoader />
                    ) : aiError ? (
                        <div className="text-center text-red-600 p-8 bg-red-50 rounded-lg">
                            <AlertTriangle className="w-10 h-10 mx-auto mb-3" />
                            <p className="font-semibold">An Error Occurred</p>
                            <p className="text-sm">{aiError}</p>
                        </div>
                    ) : interviewPrepData ? (
                        <div className="space-y-8">
                            <QuestionCategory title="Behavioral Questions" questions={interviewPrepData.Behavioral} />
                            <QuestionCategory title="Technical Questions" questions={interviewPrepData.Technical} />
                            <QuestionCategory title="Situational Questions" questions={interviewPrepData.Situational} />
                        </div>
                    ) : (
                        description ? (
                             <div className="text-center p-8">
                                 <p className="text-slate-600">Preparing questions...</p>
                             </div>
                        ) : (
                            <PasteDescription onGenerate={onGenerate} />
                        )
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                    {(interviewPrepData || aiError) && (
                        <button
                            onClick={() => onGenerate(description)}
                            disabled={isGenerating}
                            className="flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-all disabled:bg-purple-400 disabled:cursor-not-allowed"
                        >
                            <Sparkles className="w-5 h-5" />
                            {isGenerating ? 'Generating...' : 'Regenerate Questions'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}