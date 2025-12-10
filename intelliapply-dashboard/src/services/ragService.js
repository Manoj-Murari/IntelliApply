// This service handles the Resin generation prompting
// Same as extension logic

export const ragService = {
    // 1. Generate Prompt Context
    generateContext(jobDescription, allParsedResumes) {
        // Combine all resume texts
        const resumeContext = allParsedResumes.map(r => `RESUME (${r.filename}):\n${r.resume_context}`).join('\n\n');

        return `
      JOB DESCRIPTION:
      ${jobDescription}

      CANDIDATE EXPERIENCE:
      ${resumeContext}
    `;
    },

    // 2. Gap Analysis (Mock or Real AI call)
    async analyzeGaps(context, apiKey) {
        console.log("Analyzing gaps with context length:", context.length);
        return {
            missingSkills: ['Docker', 'Kubernetes'], // Example
            question: "Do you have experience with containerization tools?"
        };
    },

    // 3. Generate Final Resume
    async generateResume(context, gapAnswers, apiKey) {
        const fullPrompt = `
      ${context}

      USER ANSWERS TO GAPS:
      ${JSON.stringify(gapAnswers)}

      TASK:
      Generate a tailored resume in Markdown format for this job.
      Focus on relevant experience.
    `;

        // Call AI
        return "# Generated Resume\n\n## Summary\n...";
    }
};
