# core/ai_crew.py
import logging
from crewai import Agent, Task, Crew, Process
from config import crew_llm

log = logging.getLogger(__name__)

def run_resume_crew(job_description: str, resume_context: str) -> str:
    if not crew_llm:
        log.error("CrewAI LLM not configured.")
        return "Error: AI Crew is not configured."

    log.info("Starting Resume Optimization Crew...")

    # --- Agents ---
    resume_analyzer = Agent(
        role='Resume Analyst',
        goal='Analyze the provided resume and extract key skills, experiences, and projects.',
        backstory=(
            "You are an expert technical recruiter and resume analyst. "
            "You have a keen eye for detail and can quickly parse a resume."
        ),
        llm=crew_llm,
        verbose=True,
        allow_delegation=False,
    )

    job_analyzer = Agent(
        role='Job Description Analyst',
        goal='Extract the most important keywords and required skills from the job description.',
        backstory=(
            "You are a senior hiring manager who knows exactly what skills and experience matter most."
        ),
        llm=crew_llm,
        verbose=True,
        allow_delegation=False,
    )
    
    resume_optimizer = Agent(
        role='Professional Resume Optimizer',
        goal='Rewrite the resume to align perfectly with the job description in ATS-friendly Markdown format.',
        backstory=(
            "You are a world-class career coach and resume writer who crafts optimized resumes that get candidates hired."
        ),
        llm=crew_llm,
        verbose=True,
        allow_delegation=False,
    )

    # --- Tasks ---
    task_analyze_resume = Task(
        description=(
            "Analyze this resume and extract all skills, experiences, and projects:\n\n"
            "{resume_text}"
        ),
        expected_output='A structured summary of skills, experience, and projects.',
        agent=resume_analyzer,
    )

    task_analyze_job = Task(
        description=(
            "Analyze this job description and identify the top 5-7 critical skills and requirements:\n\n"
            "{job_description}"
        ),
        expected_output='A list of the top 5-7 keywords and required skills.',
        agent=job_analyzer,
    )

    task_optimize_resume = Task(
        description=(
            "Using the analyses provided, rewrite this resume to align with the job description. "
            "Use keywords from the job analysis. Output the complete resume in Markdown format.\n\n"
            "Original Resume:\n{resume_text}"
        ),
        expected_output=(
            "A complete, optimized resume in Markdown format with sections: "
            "Name/Contact, Professional Summary, Skills, Experience, Projects, Education."
        ),
        agent=resume_optimizer,
        context=[task_analyze_resume, task_analyze_job],
    )
    
    # Create crew
    crew = Crew(
        agents=[resume_analyzer, job_analyzer, resume_optimizer],
        tasks=[task_analyze_resume, task_analyze_job, task_optimize_resume],
        process=Process.sequential,
        verbose=True
    )
    
    inputs = {
        'resume_text': resume_context,
        'job_description': job_description
    }

    try:
        log.info("Kicking off crew...")
        result = crew.kickoff(inputs=inputs)
        log.info("Crew completed successfully.")
        
        # Extract the final output from CrewOutput object
        if hasattr(result, 'raw'):
            final_output = result.raw
        elif hasattr(result, 'output'):
            final_output = result.output
        else:
            final_output = str(result)
        
        # Clean up the markdown code fences if present
        if isinstance(final_output, str):
            final_output = final_output.strip()
            if final_output.startswith('```markdown'):
                final_output = final_output[len('```markdown'):].strip()
            if final_output.endswith('```'):
                final_output = final_output[:-3].strip()
        
        log.info(f"Final output length: {len(final_output)} characters")
        return final_output if final_output else "Error: Empty result from crew."
        
    except Exception as e:
        log.error(f"CrewAI kickoff failed: {e}", exc_info=True)
        return f"Error: The AI crew failed to process the request. {str(e)}"