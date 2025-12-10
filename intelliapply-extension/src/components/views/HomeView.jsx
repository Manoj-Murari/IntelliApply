import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { Button } from '../ui/Button';
import { Sparkles, Clipboard, FileText, Clock, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';

export function HomeView() {
    const { setView, setJobData, history, analyzeMatch, isAnalyzing, matchAnalysis } = useAppStore();
    const [detectedJob, setDetectedJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Validation Helper
    const isValidJob = (job) => {
        if (!job) return false;
        if (!job.title || !job.description) return false;

        const invalidTitles = ['LinkedIn', 'Feed', 'Home', 'Dashboard', 'Jobs', 'Unknown'];
        if (invalidTitles.some(t => job.title.includes(t)) && job.title.length < 15) return false;

        if (job.description.length < 50) return false;

        return true;
    };

    const detectJob = async () => {
        setIsLoading(true);
        setDetectedJob(null);
        // Clear previous analysis when switching jobs (optional, but good practice)
        useAppStore.setState({ matchAnalysis: null });

        try {
            if (!chrome?.tabs) {
                setIsLoading(false);
                return;
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) {
                setIsLoading(false);
                return;
            }

            chrome.tabs.sendMessage(tab.id, { action: 'SCRAPE_JOB' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Content script error:', chrome.runtime.lastError);
                    setIsLoading(false);
                    return;
                }

                if (response && isValidJob(response)) {
                    setDetectedJob(response);
                    // auto-set job data so we can analyze immediately
                    setJobData(response);
                } else {
                    console.log('Job validation failed or no data:', response);
                    setDetectedJob(null);
                }
                setIsLoading(false);
            });
        } catch (error) {
            console.error('Job detection failed:', error);
            setIsLoading(false);
        }
    };

    // Detect on mount & setup listener for navigation changes
    useEffect(() => {
        detectJob();

        // Listen for tab updates (navigation)
        const handleTabUpdate = (tabId, changeInfo, tab) => {
            // Only react if URL changed or page finished loading
            if (changeInfo.status === 'complete' || changeInfo.url) {
                // Check if this update is on the active tab
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length > 0 && tabs[0].id === tabId) {
                        console.log('IntelliApply: Tab updated, re-detecting job...');
                        detectJob();
                    }
                });
            }
        };

        if (chrome?.tabs?.onUpdated) {
            chrome.tabs.onUpdated.addListener(handleTabUpdate);
        }

        return () => {
            if (chrome?.tabs?.onUpdated) {
                chrome.tabs.onUpdated.removeListener(handleTabUpdate);
            }
        };
    }, []);

    const handleRunAnalysis = async () => {
        if (detectedJob) {
            await analyzeMatch(detectedJob.description);
        }
    };

    const handleAnalyzeClick = () => {
        if (detectedJob) {
            setJobData(detectedJob);
            setView('analysis');
        }
    };

    const handleManualEntry = () => {
        setJobData(null); // Clear data so Analysis view shows input or empty state
        setView('analysis');
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        return `${diffDays} days ago`;
    };

    return (
        <div className="flex flex-col h-full gap-8">

            {/* 2. Job Detection Area (Top 40%) */}
            <section className="flex flex-col items-center justify-center text-center mt-6 min-h-[220px]">

                {isLoading ? (
                    <div className="animate-pulse flex flex-col items-center w-full max-w-sm">
                        <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded mb-6"></div>
                        <div className="h-14 w-full bg-gray-200 rounded"></div>
                    </div>
                ) : detectedJob ? (
                    <div className="w-full max-w-sm fade-in">
                        <div className="mb-4">
                            <span className="text-xs font-bold text-[#D97757] uppercase tracking-wide bg-[#D97757]/10 px-2 py-1 rounded">
                                Detected Job
                            </span>
                            <h2 className="font-serif text-xl font-bold text-[#1F1F1F] mt-2 leading-tight line-clamp-2">
                                {detectedJob.title}
                            </h2>
                            <p className="text-sm text-[#6B6B6B] line-clamp-1">at {detectedJob.company || 'Unknown Company'}</p>
                        </div>

                        {/* Validation: Real ATS Score */}
                        {matchAnalysis ? (
                            <div className="mb-6 animate-in zoom-in duration-300">
                                <div className="relative inline-flex items-center justify-center">
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="#E6E4DF" strokeWidth="8" fill="transparent" />
                                        <circle
                                            cx="48" cy="48" r="40"
                                            stroke={matchAnalysis.match_score > 70 ? "#2E7D32" : matchAnalysis.match_score > 40 ? "#D97757" : "#C62828"}
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 * (1 - matchAnalysis.match_score / 100)}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-2xl font-bold text-[#1F1F1F]">{matchAnalysis.match_score}%</span>
                                        <span className="text-[10px] uppercase text-[#6B6B6B] font-bold">Match</span>
                                    </div>
                                </div>
                                <p className="text-xs text-[#6B6B6B] mt-2 italic">
                                    "{matchAnalysis.gaps?.[0]?.missing_skill || 'Good match'}..."
                                </p>
                            </div>
                        ) : (
                            <Button
                                onClick={handleRunAnalysis}
                                disabled={isAnalyzing}
                                variant="secondary"
                                className="w-full mb-3 h-12 text-sm border-[#D97757] text-[#D97757] hover:bg-[#D97757]/10"
                            >
                                {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                                {isAnalyzing ? "Analyzing Match..." : "Check ATS Score"}
                            </Button>
                        )}

                        <Button
                            onClick={handleAnalyzeClick}
                            disabled={!matchAnalysis && !detectedJob} // Allow if job is detected, analysis optional but good
                            className="w-full h-14 text-base shadow-md bg-[#D97757] hover:bg-[#c56a4c] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Sparkles className="w-5 h-5 mr-2" />
                            Tailor Resume to This Job
                        </Button>
                    </div>
                ) : (
                    <div className="w-full max-w-sm fade-in">
                        <h2 className="font-serif text-2xl font-bold text-[#1F1F1F] mb-1">
                            No Job Detected
                        </h2>
                        <p className="text-sm text-[#6B6B6B] mb-6 px-4">
                            Navigate to a job post to detect automatically, or paste description manually.
                        </p>

                        <Button
                            onClick={handleManualEntry}
                            className="w-full h-14 text-lg shadow-md bg-[#1F1F1F] text-white hover:bg-[#333]"
                        >
                            Paste Job Description (Check Score)
                        </Button>

                        <Button
                            onClick={() => setView('resume-maker')}
                            variant="secondary"
                            className="w-full h-12 text-sm border-[#1F1F1F] text-[#1F1F1F] hover:bg-gray-100 mt-2"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Open Resume Maker (CrewAI)
                        </Button>

                        <button
                            onClick={detectJob}
                            className="mt-4 text-sm text-[#6B6B6B] hover:text-[#D97757] hover:underline flex items-center justify-center w-full gap-2 transition-colors"
                            title="Try detecting again"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Retry Detection
                        </button>
                    </div>
                )}
            </section>

            <hr className="border-[#E6E4DF]" />

            {/* 3. Resume Vault (Bottom 60%) */}
            <section className="flex-1 overflow-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                        Resume Vault
                    </h3>
                    <button
                        onClick={() => setView('history')}
                        className="text-xs font-medium text-[#D97757] hover:underline"
                    >
                        View All
                    </button>
                </div>

                {/* Vault Cards */}
                <div className="flex flex-col gap-3 pb-4">
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-[#6B6B6B] text-sm">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            No recent applications found.
                        </div>
                    ) : (
                        history.slice(0, 3).map((item) => (
                            <Card
                                key={item.id}
                                className="p-4 flex items-center justify-between hover:bg-[#F9F8F6] transition-colors cursor-pointer group border-transparent hover:border-[#E6E4DF] border-b-[#E6E4DF]/50"
                            >
                                <div className="flex-1 min-w-0 pr-4">
                                    <h4 className="font-sans font-bold text-[#1F1F1F] text-sm group-hover:text-[#D97757] transition-colors truncate">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-[#6B6B6B] truncate">
                                        {item.company} • {formatDate(item.date)}
                                    </p>
                                </div>
                                <div className="text-[#6B6B6B] group-hover:text-[#D97757] transition-colors shrink-0">
                                    <FileText className="w-5 h-5" strokeWidth={1.5} />
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
