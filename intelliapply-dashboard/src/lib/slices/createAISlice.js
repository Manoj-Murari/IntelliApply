
// src/lib/slices/createAISlice.js
import { API_BASE_URL, getAuthHeaders, getErrorMessage } from '../api';

export const createAISlice = (set, get) => ({
    isGenerating: false,
    tailoringSuggestions: [],
    coverLetter: '',
    interviewPrepData: null,
    aiError: null,
    optimizedResume: '',

    // Maker specific
    isMakerGenerating: false,
    makerResumeOutput: '',
    makerCoverLetterOutput: '',
    makerAiError: null,
    prefilledJobDescription: '',

    setPrefilledJobDescription: (description) => set({ prefilledJobDescription: description }),
    clearPrefilledJobDescription: () => set({ prefilledJobDescription: '' }),

    handleAnalyzeJob: async (jobId, profileId, description) => {
        if (!jobId || profileId === null || profileId === undefined) {
            get().addNotification('Could not start analysis: No profile selected.', 'error');
            return;
        }
        get().addNotification('Sending job to AI for analysis...', 'info');
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/analyze`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    profile_id: profileId,
                    description: description
                }),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
        } catch (error) {
            get().addNotification(`Error: ${error.message}`, 'error');
            throw error;
        }
    },

    handleBulkAnalyze: async (jobsToAnalyze) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) {
            get().addNotification('Please select an active profile first.', 'error');
            return;
        }
        const jobIdsToAnalyze = jobsToAnalyze
            .filter(job => !job.gemini_rating && job.description)
            .map(job => job.id);
        if (jobIdsToAnalyze.length === 0) {
            get().addNotification('No new jobs with descriptions to analyze.', 'info');
            return;
        }
        get().addNotification(`Sending ${jobIdsToAnalyze.length} jobs for analysis...`, 'info');
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/bulk-analyze`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    profile_id: activeProfileId,
                    job_ids: jobIdsToAnalyze
                })
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            const data = await response.json();
            get().addNotification(data.message, 'success');
        } catch (error) {
            get().addNotification(`Error starting bulk analysis: ${error.message}`, 'error');
        }
    },

    handleGetTailoring: async (jobDescription, profileId) => {
        set({ isGenerating: true, aiError: null, tailoringSuggestions: [] });
        try {
            const response = await fetch(`${API_BASE_URL}/ai/tailor-resume`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    job_description: jobDescription,
                    profile_id: profileId,
                }),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            const data = await response.json();
            set({ tailoringSuggestions: data.suggestions || [] });
        } catch (err) {
            set({ aiError: err.message });
        } finally {
            set({ isGenerating: false });
        }
    },

    handleGetCoverLetter: async (job, profileId, jobDescription) => {
        set({ isGenerating: true, aiError: null, coverLetter: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/ai/generate-cover-letter`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    job_description: jobDescription,
                    profile_id: profileId,
                    company: job.company,
                    title: job.title,
                }),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            const data = await response.json();
            set({ coverLetter: data.coverLetter || '' });
        } catch (err) {
            set({ aiError: err.message });
        } finally {
            set({ isGenerating: false });
        }
    },

    generateInterviewPrep: async (job, profile, jobDescription) => {
        if (!job || !jobDescription) {
            get().addNotification('Job description is missing.', 'error');
            return;
        }
        if (!profile) {
            get().addNotification('No profile selected.', 'error');
            return;
        }
        set({ isGenerating: true, interviewPrepData: null, aiError: null });
        try {
            const response = await fetch(`${API_BASE_URL}/ai/interview-prep`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    job_description: jobDescription,
                    profile_id: profile.id,
                }),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            const data = await response.json();
            set({ interviewPrepData: data });
        } catch (err) {
            console.error('Error generating interview prep:', err);
            set({ aiError: err.message });
        } finally {
            set({ isGenerating: false });
        }
    },

    handleGenerateOptimizedResume: async (jobId, profileId) => {
        set({ isGenerating: true, aiError: null, optimizedResume: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/ai/generate-optimized-resume`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    job_id: jobId,
                    profile_id: profileId,
                }),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            const data = await response.json();
            set({ optimizedResume: data.optimized_resume || '' });
        } catch (err) {
            set({ aiError: err.message });
        } finally {
            set({ isGenerating: false });
        }
    },

    handleGenerateMakerResume: async (jobDescription, resumeContext) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) {
            get().addNotification('Please select an active profile first.', 'error');
            return;
        }
        set({ isMakerGenerating: true, makerAiError: null, makerResumeOutput: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/ai/generate-resume-from-text`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    profile_id: activeProfileId,
                    job_description: jobDescription,
                    resume_context: resumeContext,
                }),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            const data = await response.json();
            set({ makerResumeOutput: data.optimized_resume || '' });
        } catch (err) {
            set({ makerAiError: err.message });
        } finally {
            set({ isMakerGenerating: false });
        }
    },

    handleGenerateMakerCoverLetter: async (jobDescription, resumeContext, company, title) => {
        const activeProfileId = get().activeProfileId;
        if (!activeProfileId) {
            get().addNotification('Please select an active profile first.', 'error');
            return;
        }
        set({ isMakerGenerating: true, makerAiError: null, makerCoverLetterOutput: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/ai/generate-cover-letter`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    job_description: jobDescription,
                    profile_id: activeProfileId,
                    company: company || "The Company",
                    title: title || "The Role",
                }),
            });
            if (!response.ok) throw new Error(await getErrorMessage(response));
            const data = await response.json();
            set({ makerCoverLetterOutput: data.coverLetter || '' });
        } catch (err) {
            set({ makerAiError: err.message });
        } finally {
            set({ isMakerGenerating: false });
        }
    },
});
