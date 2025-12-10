import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { Button } from '../ui/Button';
import { ArrowLeft, Sparkles, Loader2, Download, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';

export function ResumeMakerView() {
    const {
        setView,
        jobData,
        generateMakerResume,
        isMakerGenerating,
        makerError,
        makerResumeOutput,
        downloadMakerPDF
    } = useAppStore();

    const [description, setDescription] = useState('');

    useEffect(() => {
        if (jobData?.description) {
            setDescription(jobData.description);
        }
    }, [jobData]);

    const handleGenerate = async () => {
        if (!description) return;
        await generateMakerResume(description);
    };

    const handleDownloadJSON = () => {
        if (!makerResumeOutput) return;

        // Simple download of the JSON for now, or text content if we parse it
        // The user mentioned "without any loss".
        const content = JSON.stringify(makerResumeOutput, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Optimized_Resume_Data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-[#E6E4DF] flex items-center gap-3">
                <button
                    onClick={() => setView('home')}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-[#1F1F1F]" />
                </button>
                <div className="flex-1">
                    <h2 className="font-serif text-lg font-bold text-[#1F1F1F]">Resume Maker</h2>
                    <p className="text-xs text-[#6B6B6B]">AI Crew Optimization</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">

                {/* Input Section */}
                {!makerResumeOutput && (
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-[#1F1F1F]">
                            Target Job Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Paste the Job Description here..."
                            className="w-full h-64 p-3 border border-[#E6E4DF] rounded-md focus:ring-2 focus:ring-[#D97757] focus:border-transparent resize-none text-sm"
                        />
                        <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700">
                            <strong>Note:</strong> This uses the "CrewAI" agent to deeply analyze and rewrite your resume. This process may take 30-60 seconds.
                        </div>
                    </div>
                )}

                {/* Error State */}
                {makerError && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div>
                            <strong>Error:</strong> {makerError}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isMakerGenerating && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <Loader2 className="w-10 h-10 text-[#D97757] animate-spin" />
                        <div className="text-center">
                            <h3 className="text-sm font-semibold text-[#1F1F1F]">AI Crew is working...</h3>
                            <p className="text-xs text-[#6B6B6B] mt-1">Analyzing keywords, extracting skills, and optimizing.</p>
                        </div>
                    </div>
                )}

                {/* Result State */}
                {makerResumeOutput && !isMakerGenerating && (
                    <div className="space-y-4">
                        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Optimization Complete!
                        </div>

                        {/* Rationale Section */}
                        {makerResumeOutput.rationale && (
                            <Card className="p-4 bg-[#F9F8F6]">
                                <h4 className="font-serif font-bold text-[#1F1F1F] text-sm mb-2">Why this works:</h4>
                                <p className="text-sm text-[#4A4A4A] whitespace-pre-wrap">
                                    {makerResumeOutput.rationale}
                                </p>
                            </Card>
                        )}

                        {/* Resume Preview (Simple for now) */}
                        <div className="border border-[#E6E4DF] rounded-md overflow-hidden">
                            <div className="bg-[#E6E4DF] px-3 py-2 text-xs font-semibold text-[#6B6B6B]">
                                Resume JSON Data (Preview)
                            </div>
                            <pre className="p-3 text-xs overflow-auto bg-gray-50 h-64">
                                {JSON.stringify(makerResumeOutput.resume || makerResumeOutput, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Actions */}
            <div className="p-4 border-t border-[#E6E4DF] bg-white">
                {!makerResumeOutput ? (
                    <Button
                        onClick={handleGenerate}
                        disabled={isMakerGenerating || !description}
                        className="w-full bg-[#1F1F1F] hover:bg-[#333] text-white shadow-lg"
                    >
                        {isMakerGenerating ? 'Generating...' : 'Generate Resume'}
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => useAppStore.setState({ makerResumeOutput: null })}
                            className="flex-1"
                        >
                            Start Over
                        </Button>
                        <Button
                            onClick={handleDownloadJSON}
                            variant="secondary"
                            className="flex-1 bg-gray-100 text-[#1F1F1F]"
                        >
                            JSON
                        </Button>
                        <Button
                            onClick={downloadMakerPDF}
                            className="flex-[2] bg-[#D97757] hover:bg-[#c56a4c] text-white"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
