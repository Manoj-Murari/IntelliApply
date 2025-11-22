import { create } from 'zustand';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const useResumeStore = create((set, get) => ({
    step: 1,
    file: null,
    isUploading: false,
    isAnalyzing: false,
    isGenerating: false,
    error: null,

    // Data
    resumeData: null,
    jobDescription: "",
    gapAnalysis: null,
    gapAnswers: {},
    tailoredResume: null,

    // PDF URLs
    resumePdfUrl: null,
    coverLetterPdfUrl: null,
    coverLetterText: "",

    setStep: (step) => set({ step }),
    setFile: (file) => set({ file }),
    setJobDescription: (jd) => set({ jobDescription: jd }),
    setGapAnswer: (skill, answer) => set((state) => ({
        gapAnswers: { ...state.gapAnswers, [skill]: answer }
    })),

    // Actions
    uploadResume: async (file) => {
        set({ isUploading: true, error: null });
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/resume/ingest`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");

            const data = await response.json();
            set({ resumeData: data.data, step: 2 });
        } catch (err) {
            set({ error: err.message });
        } finally {
            set({ isUploading: false });
        }
    },

    analyzeGaps: async () => {
        set({ isAnalyzing: true, error: null });
        const { resumeData, jobDescription } = get();

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/resume/analyze-gaps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume_data: resumeData, job_description: jobDescription }),
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();
            set({ gapAnalysis: data, step: 3 });
        } catch (err) {
            set({ error: err.message });
        } finally {
            set({ isAnalyzing: false });
        }
    },

    generateTailoredResume: async () => {
        set({ isGenerating: true, error: null });
        const { resumeData, jobDescription, gapAnswers } = get();

        try {
            // 1. Generate JSON
            const response = await fetch(`${API_BASE_URL}/api/v1/resume/generate-tailored`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resume_data: resumeData,
                    job_description: jobDescription,
                    gap_answers: gapAnswers
                }),
            });

            if (!response.ok) throw new Error("Generation failed");
            const tailoredJson = await response.json();
            set({ tailoredResume: tailoredJson });

            // 2. Render PDF
            const pdfResponse = await fetch(`${API_BASE_URL}/api/v1/resume/render-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tailoredJson),
            });

            if (!pdfResponse.ok) throw new Error("PDF Rendering failed");

            const blob = await pdfResponse.blob();
            const url = URL.createObjectURL(blob);
            set({ resumePdfUrl: url, step: 4 });

        } catch (err) {
            set({ error: err.message });
        } finally {
            set({ isGenerating: false });
        }
    },

    generateCoverLetter: async () => {
        set({ isGenerating: true, error: null });
        const { tailoredResume, jobDescription } = get();

        try {
            // 1. Generate Text
            const response = await fetch(`${API_BASE_URL}/api/v1/resume/generate-cover-letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resume_data: tailoredResume,
                    job_description: jobDescription
                }),
            });

            if (!response.ok) throw new Error("Cover Letter failed");
            const data = await response.json();
            set({ coverLetterText: data.cover_letter_text });

            // 2. Render PDF
            const pdfResponse = await fetch(`${API_BASE_URL}/api/v1/resume/render-cover-letter-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resume_data: tailoredResume,
                    cover_letter_text: data.cover_letter_text
                }),
            });

            if (!pdfResponse.ok) throw new Error("CL PDF failed");

            const blob = await pdfResponse.blob();
            const url = URL.createObjectURL(blob);
            set({ coverLetterPdfUrl: url });

        } catch (err) {
            set({ error: err.message });
        } finally {
            set({ isGenerating: false });
        }
    },

    reset: () => set({
        step: 1, file: null, resumeData: null, jobDescription: "",
        gapAnalysis: null, gapAnswers: {}, tailoredResume: null,
        resumePdfUrl: null, coverLetterPdfUrl: null, coverLetterText: "", error: null
    })
}));
