import { create } from 'zustand'

export const useJobStore = create((set) => ({
    currentJob: null, // { title, company, description, location, url }
    generatedResume: null, // The markdown/PDF content
    gapAnalysis: null, // { missingSkills: [], question: "" }

    setJob: (job) => set({ currentJob: job }),

    setGeneratedResume: (resume) => set({ generatedResume: resume }),

    setGapAnalysis: (analysis) => set({ gapAnalysis: analysis }),

    clearJob: () => set({ currentJob: null, generatedResume: null, gapAnalysis: null })
}))
