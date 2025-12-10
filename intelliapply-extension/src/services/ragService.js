// This service handles the Resume Generation Prompting
// In a real scenario, this would call an AI API (e.g., OpenAI, Gemini) directly from the client.
// We'll assume the API key is available or proxied.
// For "Zero-Cost", we might use a user-provided API key stored in local storage.

export const ragService = {
    // 1. Generate Prompt Context (Structured for API)
    generateContext(jobDescription, allParsedResumes) {
        // Aggregate all text
        const combinedText = allParsedResumes.map(r =>
            `--- RESUME (${r.filename}) ---\n${r.resume_context}`
        ).join('\n\n');

        // Return object structure matching backend API requirements
        return {
            job_description: jobDescription,
            resume_data: { raw_text: combinedText }
        };
    },

    // 2. Gap Analysis (Real API call)
    async analyzeGaps(contextPayload) {
        try {
            const response = await fetch('http://localhost:8000/api/v1/resume/analyze-gaps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resume_data: contextPayload.resume_data,
                    job_description: contextPayload.job_description
                })
            });

            if (!response.ok) throw new Error('Gap analysis failed');
            const data = await response.json();

            // Transform API response to match UI expectations
            // API returns { gaps: [{missing_skill, question, ...}] }
            // UI expects { missingSkills: [], question: "" }

            const missingSkills = data.gaps.map(g => g.missing_skill);
            // Combine questions or pick the first one
            const combinedQuestion = data.gaps.length > 0
                ? "We found some gaps. Do you have experience with these?"
                : "No major gaps found.";

            return {
                missingSkills: missingSkills,
                question: combinedQuestion,
                fullAnalysis: data // Keep full data if needed later
            };
        } catch (error) {
            console.error("API Error:", error);
            // Fallback mock if API is down
            return {
                missingSkills: ['API Connection Failed'],
                question: "Could not connect to AI backend."
            };
        }
    },

    // 3. Generate Final Resume (Real API call)
    async generateResume(contextPayload, gapAnswers) {
        try {
            const response = await fetch('http://localhost:8000/api/v1/resume/generate-tailored', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resume_data: contextPayload.resume_data,
                    job_description: contextPayload.job_description,
                    gap_answers: gapAnswers
                })
            });

            if (!response.ok) throw new Error('Generation failed');
            const resumeJson = await response.json();

            // Transform JSON to Markdown for UI display
            return this.jsonToMarkdown(resumeJson);

        } catch (error) {
            console.error("API Error:", error);
            return "# Error\nCould not generate resume. Check backend connection.";
        }
    },

    // Helper to format backend JSON to Markdown
    jsonToMarkdown(json) {
        let md = `# ${json.basics?.name || 'Tailored Resume'}\n\n`;
        md += `**${json.basics?.label || ''}**\n\n`;
        md += `*${json.basics?.email || ''} | ${json.basics?.phone || ''} | ${json.basics?.location?.city || ''}*\n\n`;

        md += `## Summary\n${json.basics?.summary || ''}\n\n`;

        if (json.work?.length) {
            md += `## Experience\n`;
            json.work.forEach(job => {
                md += `### ${job.position} at ${job.name}\n`;
                md += `*${job.startDate || ''} - ${job.endDate || 'Present'}*\n`;
                md += `${job.summary || ''}\n`;
                if (job.highlights) {
                    job.highlights.forEach(h => md += `- ${h}\n`);
                }
                md += `\n`;
            });
        }

        if (json.education?.length) {
            md += `## Education\n`;
            json.education.forEach(edu => {
                md += `**${edu.institution}** - ${edu.area}\n`;
                md += `*${edu.studyType}, ${edu.startDate || ''} - ${edu.endDate || ''}*\n\n`;
            });
        }

        if (json.skills?.length) {
            md += `## Skills\n`;
            json.skills.forEach(skillCat => {
                const name = skillCat.name || 'Skills';
                const keywords = Array.isArray(skillCat.keywords) ? skillCat.keywords.join(', ') : skillCat.keywords;
                md += `- **${name}:** ${keywords}\n`;
            });
        }

        if (json.projects?.length) {
            md += `\n## Projects\n`;
            json.projects.forEach(proj => {
                md += `### ${proj.name}\n`;
                md += `${proj.description}\n`;
                if (proj.highlights) proj.highlights.forEach(h => md += `- ${h}\n`);
                md += `\n`;
            });
        }

        return md;
    }
};
