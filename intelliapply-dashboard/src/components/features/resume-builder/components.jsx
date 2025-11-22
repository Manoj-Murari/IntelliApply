import React, { useState } from 'react';
import { useResumeStore } from './store';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
    Upload, FileText, CheckCircle, AlertCircle, ArrowRight,
    Briefcase, Loader2, ChevronRight, Download, RefreshCw, Edit3
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// --- SHARED COMPONENTS ---
export const Button = ({ children, onClick, variant = 'primary', className, disabled, icon: Icon }) => {
    const base = "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/30",
        secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm",
        ghost: "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(base, variants[variant], className)}
        >
            {Icon && <Icon className="w-5 h-5" />}
            {children}
        </button>
    );
};

export const StepIndicator = () => {
    const { step } = useResumeStore();
    const steps = [
        { num: 1, label: "Upload" },
        { num: 2, label: "Analyze" },
        { num: 3, label: "Interview" },
        { num: 4, label: "Workspace" }
    ];

    return (
        <div className="w-full max-w-3xl mx-auto mb-12">
            <div className="relative flex justify-between">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10" />
                {steps.map((s) => {
                    const isActive = step >= s.num;
                    const isCurrent = step === s.num;

                    return (
                        <div key={s.num} className="flex flex-col items-center gap-2 bg-white px-2">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: isActive ? '#2563eb' : '#f3f4f6',
                                    scale: isCurrent ? 1.1 : 1
                                }}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                                    isActive ? "text-white shadow-lg shadow-blue-500/30" : "text-gray-400"
                                )}
                            >
                                {isActive ? <CheckCircle className="w-5 h-5" /> : s.num}
                            </motion.div>
                            <span className={cn(
                                "text-xs font-medium transition-colors",
                                isActive ? "text-blue-600" : "text-gray-400"
                            )}>
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- STEP 1: UPLOAD ---
export const FileUpload = () => {
    const { uploadResume, isUploading, error } = useResumeStore();

    const onDrop = (acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            uploadResume(acceptedFiles[0]);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    return (
        <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload your Resume</h2>
                <p className="text-gray-500">We'll analyze it to find the best match for your target role.</p>
            </div>

            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 bg-white",
                    isDragActive ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                )}
            >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                </div>

                {isUploading ? (
                    <p className="text-lg font-medium text-gray-700">Parsing your resume...</p>
                ) : (
                    <>
                        <p className="text-lg font-medium text-gray-900 mb-2">
                            {isDragActive ? "Drop it here!" : "Click to upload or drag & drop"}
                        </p>
                        <p className="text-sm text-gray-400">PDF only (Max 5MB)</p>
                    </>
                )}
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3"
                >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </motion.div>
            )}
        </div>
    );
};

// --- STEP 2: JOB DESCRIPTION ---
export const JobInput = () => {
    const { jobDescription, setJobDescription, analyzeGaps, isAnalyzing, error } = useResumeStore();

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Target Job Description</h2>
                <p className="text-gray-500">Paste the JD below so we can identify gaps and tailor your resume.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste Job Description here..."
                    className="w-full h-64 p-4 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 resize-none text-gray-700 placeholder-gray-400"
                />

                <div className="mt-6 flex justify-end">
                    <Button
                        onClick={analyzeGaps}
                        disabled={!jobDescription.trim() || isAnalyzing}
                        icon={isAnalyzing ? Loader2 : ArrowRight}
                        className={isAnalyzing ? "cursor-wait" : ""}
                    >
                        {isAnalyzing ? "Analyzing..." : "Analyze Gaps"}
                    </Button>
                </div>
            </div>

            {error && (
                <p className="mt-4 text-center text-red-500 text-sm">{error}</p>
            )}
        </div>
    );
};

// --- STEP 3: GAP INTERVIEW ---
export const GapInterview = () => {
    const { gapAnalysis, gapAnswers, setGapAnswer, generateTailoredResume, isGenerating } = useResumeStore();

    if (!gapAnalysis) return null;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Gap Analysis</h2>
                <div className="flex items-center justify-center gap-2 text-gray-500">
                    <span>Match Score:</span>
                    <span className={cn(
                        "font-bold px-2 py-0.5 rounded-md text-sm",
                        gapAnalysis.match_score >= 70 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                        {gapAnalysis.match_score}%
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {gapAnalysis.gaps.map((gap, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Missing: {gap.missing_skill}</h3>
                                <p className="text-sm text-gray-500 mt-1">{gap.context}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">🤖 {gap.question}</p>
                            <textarea
                                value={gapAnswers[gap.missing_skill] || ""}
                                onChange={(e) => setGapAnswer(gap.missing_skill, e.target.value)}
                                placeholder="E.g. Yes, I used this in my project X..."
                                className="w-full p-3 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 text-sm"
                                rows={2}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
                <Button
                    onClick={generateTailoredResume}
                    disabled={isGenerating}
                    icon={isGenerating ? Loader2 : FileText}
                >
                    {isGenerating ? "Generating Resume..." : "Generate Tailored Resume"}
                </Button>
            </div>
        </div>
    );
};

// --- STEP 4: WORKSPACE ---
export const Workspace = () => {
    const {
        resumePdfUrl, coverLetterPdfUrl, coverLetterText,
        generateCoverLetter, isGenerating
    } = useResumeStore();

    const [activeTab, setActiveTab] = useState('resume'); // 'resume' | 'cover-letter'

    return (
        <div className="h-[calc(100vh-200px)] min-h-[600px] flex gap-6">
            {/* Sidebar / Controls */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Documents</h3>

                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveTab('resume')}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                                activeTab === 'resume' ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-600"
                            )}
                        >
                            <FileText className="w-5 h-5" />
                            <span className="font-medium">Tailored Resume</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('cover-letter')}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                                activeTab === 'cover-letter' ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-600"
                            )}
                        >
                            <Edit3 className="w-5 h-5" />
                            <span className="font-medium">Cover Letter</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1">
                    <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

                    {activeTab === 'resume' && (
                        <div className="space-y-3">
                            <a
                                href={resumePdfUrl}
                                download="tailored_resume.pdf"
                                className="flex items-center justify-center gap-2 w-full p-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                            >
                                <Download className="w-4 h-4" /> Download PDF
                            </a>
                        </div>
                    )}

                    {activeTab === 'cover-letter' && (
                        <div className="space-y-3">
                            {!coverLetterText ? (
                                <Button
                                    onClick={generateCoverLetter}
                                    disabled={isGenerating}
                                    className="w-full"
                                    icon={isGenerating ? Loader2 : RefreshCw}
                                >
                                    Generate Cover Letter
                                </Button>
                            ) : (
                                <>
                                    <a
                                        href={coverLetterPdfUrl}
                                        download="cover_letter.pdf"
                                        className="flex items-center justify-center gap-2 w-full p-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        <Download className="w-4 h-4" /> Download PDF
                                    </a>
                                    <Button
                                        onClick={generateCoverLetter}
                                        variant="secondary"
                                        className="w-full"
                                        icon={RefreshCw}
                                        disabled={isGenerating}
                                    >
                                        Regenerate
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden relative">
                {activeTab === 'resume' && (
                    resumePdfUrl ? (
                        <iframe src={resumePdfUrl} className="w-full h-full" title="Resume Preview" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No PDF generated yet
                        </div>
                    )
                )}

                {activeTab === 'cover-letter' && (
                    coverLetterPdfUrl ? (
                        <iframe src={coverLetterPdfUrl} className="w-full h-full" title="Cover Letter Preview" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                            <p>No Cover Letter generated yet</p>
                            {!isGenerating && !coverLetterText && (
                                <Button onClick={generateCoverLetter} variant="secondary">Generate Now</Button>
                            )}
                            {isGenerating && <Loader2 className="w-8 h-8 animate-spin text-blue-500" />}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
