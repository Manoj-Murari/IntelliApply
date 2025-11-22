import React, { useEffect } from 'react';
import { useResumeStore } from './resume-builder/store';
import { StepIndicator, FileUpload, JobInput, GapInterview, Workspace } from './resume-builder/components';
import { motion, AnimatePresence } from 'framer-motion';

const ResumeMakerPage = () => {
    const { step, reset } = useResumeStore();

    // Reset store on unmount to ensure fresh state next time
    useEffect(() => {
        return () => reset();
    }, [reset]);

    return (
        <div className="min-h-screen bg-gray-50/50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Resume Builder</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Create a perfectly tailored resume in minutes. Upload your current resume,
                        paste the job description, and let our AI do the rest.
                    </p>
                </header>

                <StepIndicator />

                <div className="mt-12">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <FileUpload />
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <JobInput />
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <GapInterview />
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Workspace />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ResumeMakerPage;