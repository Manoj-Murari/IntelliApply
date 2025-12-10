import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Sparkles, ArrowRight, Plus, Check } from 'lucide-react';

export function AnalysisView() {
    const { jobData, setView, selectedGaps, toggleGap, generateResume, isGenerating, addToHistory, matchAnalysis } = useAppStore();

    // Base analysis (Fallback if no API result yet)
    const baseScore = matchAnalysis?.match_score || 0;

    // Mock Gaps (Replace with real gaps later if desired, or mix)
    // For now we keep the UI consistent with the design but use the real score for the gauge.
    const gaps = [
        { id: 'g1', name: 'Docker' },
        { id: 'g2', name: 'Kubernetes' },
        { id: 'g3', name: 'AWS Lambda' },
        { id: 'g4', name: 'CI/CD' },
    ];

    // Calculate current score based on selection
    const currentScore = Math.min(100, baseScore + (selectedGaps.length * 5));

    // Animation/State for score
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        // Animate up to the real score
        if (baseScore > 0) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 2;
                if (progress >= baseScore) {
                    setDisplayScore(baseScore);
                    clearInterval(interval);
                } else {
                    setDisplayScore(progress);
                }
            }, 20);
            return () => clearInterval(interval);
        }
    }, [baseScore]);

    useEffect(() => {
        // Trigger Backend Generation (Tailoring)
        // We do this immediately here because user clicked "Tailor Resume"
        if (jobData && jobData.description) {
            generateResume(jobData.description)
                .then(() => {
                    console.log("Generation Complete");
                })
                .catch(err => console.error("Generation error", err));
        }
    }, [jobData, generateResume]);

    // Update display score if user interacts with gaps
    useEffect(() => {
        setDisplayScore(currentScore);
    }, [currentScore]);

    const handleBoost = () => {
        if (isGenerating) {
            // Still waiting? Show spinner/status? For now let them proceed if they want, 
            // or we could block. But usually we want to wait for generation.
            // Let's assume the user waits or the button shows 'Generating...'
        }

        // Add to history and go to success
        if (jobData) {
            addToHistory({
                title: jobData.title,
                company: jobData.company,
            });
        }
        setView('success');
    };

    if (!jobData) return <div>Loading...</div>;

    return (
        <div className="flex flex-col gap-6">

            {/* 3. The Scoreboard (Top) */}
            <Card className="p-8 bg-white border-[#E6E4DF] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#D97757]"></div>

                <div className="relative z-10 text-center">
                    <h1 className="font-serif text-5xl font-bold text-[#D97757] transition-all duration-300 transform">
                        {displayScore}%
                    </h1>
                    <p className="text-sm font-bold uppercase tracking-wider text-[#6B6B6B] mt-2">
                        Current Match
                    </p>
                </div>

                {/* Background Decorative Circle */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#D97757]/5 rounded-full blur-2xl"></div>
            </Card>

            {/* 4. The "Skill Booster" Section (Middle) */}
            <Card className="p-6 border-[#D97757]/20 bg-[#FFFBF9]">
                <div className="mb-4">
                    <h3 className="font-bold text-sm uppercase tracking-wide text-[#D97757] flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Boost Your Score
                    </h3>
                    <p className="text-sm text-[#1F1F1F] mt-1">
                        Do you have these skills? Tap to add them.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {gaps.map((gap) => {
                        const isSelected = selectedGaps.includes(gap.id);
                        return (
                            <button
                                key={gap.id}
                                onClick={() => toggleGap(gap.id)}
                                className={`group flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${isSelected
                                    ? 'bg-[#2E7D32] border-[#2E7D32] text-white shadow-sm transform scale-105'
                                    : 'bg-white border-[#E6E4DF] text-[#6B6B6B] hover:border-[#D97757] hover:text-[#D97757]'
                                    }`}
                            >
                                {gap.name}
                                {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* 5. Bottom Action */}
            <div className="mt-auto">
                <Button
                    onClick={handleBoost}
                    disabled={isGenerating}
                    className="w-full h-14 text-lg shadow-lg bg-[#D97757] hover:bg-[#c56a4c] transition-all active:scale-[0.98]"
                >
                    {isGenerating ? "Analyzing..." : "Generate PDF"}
                    {!isGenerating && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>
            </div>
        </div>
    );
}
