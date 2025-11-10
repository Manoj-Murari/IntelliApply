import React, { useEffect, useState } from 'react';
import { useStore } from '../../lib/store';
import { X, Sparkles, HelpCircle, AlertTriangle } from 'lucide-react';
import AILoader from '../ui/AILoader'; // --- IMPORT ---
import PasteDescription from '../ui/PasteDescription'; // --- IMPORT ---

// --- AILoader component definition is REMOVED ---
// --- PasteDescription component definition is REMOVED ---

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
    const isGenerating = useStore(state => state.isGenerating);
    const interviewPrepData = useStore(state => state.interviewPrepData);
    const aiError = useStore(state => state.aiError);
    const generateInterviewPrep = useStore(state => state.generateInterviewPrep);

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
                        <AILoader text="Your AI co-pilot is preparing your interview questions..." />
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
                            <PasteDescription onGenerate={onGenerate} buttonText="Generate Questions" />
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