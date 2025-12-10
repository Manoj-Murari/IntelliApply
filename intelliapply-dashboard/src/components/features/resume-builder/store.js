import { create } from 'zustand';
import { resumeParserService } from '../../../services/resumeParserService';
import { ragService } from '../../../services/ragService';
import { jsPDF } from 'jspdf';

export const useResumeStore = create((set, get) => ({
    step: 1,
    file: null,
    isUploading: false,
    isAnalyzing: false,
    isGenerating: false,
    error: null,

    // Data
    resumeData: null, // This is now the extracted text
    jobDescription: "",
    gapAnalysis: null,
    gapAnswers: {},
    tailoredResume: null, // Markdown output

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
        try {
            const text = await resumeParserService.parseFile(file);
            // Simulate 'ingest' by just setting the text
            const resumeDataObj = { text, filename: file.name };
            set({ resumeData: resumeDataObj, file, step: 2 });
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
            // Use Client-Side RAG Service
            // Context constructed from single resume + JD
            const context = `RESUME:\n${resumeData.text}\n\nJOB DESCRIPTION:\n${jobDescription}`;
            const analysis = await ragService.analyzeGaps(context);

            // Transform to UI expected format if needed
            // UI expects: { match_score, gaps: [{ missing_skill, context, question }] }
            // ragService stub returns simple object. Let's adapt it here or in service.
            // For now, mapping stub to UI format:
            const mappedAnalysis = {
                match_score: 85, // Mock score
                gaps: analysis.missingSkills.map(skill => ({
                    missing_skill: skill,
                    context: "Identified based on job requirements.",
                    question: analysis.question || `Do you have experience with ${skill}?`
                }))
            };

            set({ gapAnalysis: mappedAnalysis, step: 3 });
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
            const context = `RESUME:\n${resumeData.text}\n\nJOB DESCRIPTION:\n${jobDescription}`;
            const markdownResume = await ragService.generateResume(context, gapAnswers);

            set({ tailoredResume: markdownResume });

            // Render PDF client-side
            const doc = new jsPDF();
            // Simple split text to fit page
            const splitText = doc.splitTextToSize(markdownResume, 180);
            let y = 10;

            // Basic Markdown-ish rendering (bold headers)
            splitText.forEach(line => {
                if (y > 280) { doc.addPage(); y = 10; } // pagination
                if (line.startsWith('#')) {
                    doc.setFont(undefined, 'bold');
                    doc.text(line.replace(/#/g, '').trim(), 10, y);
                    doc.setFont(undefined, 'normal');
                } else {
                    doc.text(line, 10, y);
                }
                y += 7;
            });

            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
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
            // Mock Cover Letter Generation
            const clText = `Dear Hiring Manager,\n\nI am excited to apply for this position...\n\n(Generated based on: ${jobDescription.substring(0, 50)}...)\n\nSincerely,\nCandidate`;

            set({ coverLetterText: clText });

            // Render PDF
            const doc = new jsPDF();
            const splitText = doc.splitTextToSize(clText, 180);
            doc.text(splitText, 10, 10);

            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
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
