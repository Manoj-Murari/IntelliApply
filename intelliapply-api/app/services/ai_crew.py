
# app/services/ai_crew.py
import logging
from crewai import Agent, Task, Crew, Process
from app.core.config import crew_llm
from app.schemas.resume import OptimizedResumeOutput

log = logging.getLogger(__name__)

def run_resume_crew(job_description: str, resume_context: str, profile_data: dict) -> str:
    if not crew_llm:
        log.error("CrewAI LLM not configured.")
        return '{"error": "AI Crew is not configured."}'

    log.info("Starting Resume Optimization Crew...")
    
    contact_info_block = f"""
    USER'S REAL CONTACT INFO (Use this for the JSON):
    Name: {profile_data.get('full_name')}
    Email: {profile_data.get('email')}
    Phone: {profile_data.get('phone')}
    LinkedIn: {profile_data.get('linkedin_url')}
    Portfolio: {profile_data.get('portfolio_url')}
    """

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
        goal='Rewrite the resume to align perfectly with the job description in a structured JSON format.',
        backstory=(
            "You are a world-class career coach and resume writer who crafts optimized resumes that get candidates hired."
        ),
        llm=crew_llm,
        verbose=True,
        allow_delegation=False,
    )

    task_analyze_resume = Task(
        description=(
            "Analyze this resume text and extract all skills, experiences, and projects:\n\n"
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
            f"Using the analyses provided, rewrite this resume to align with the job description. "
            "Use keywords from the job analysis. Output ONLY a valid JSON object matching the Pydantic schema.\n\n"
            f"{contact_info_block}\n\n"
            "Original Resume Text:\n{resume_text}"
        ),
        expected_output=(
            "A single, valid JSON object that strictly follows the `OptimizedResumeOutput` Pydantic schema. "
            "The JSON object must have two top-level keys: 'resume' and 'rationale'.\n"
            "1. For the 'resume' key (which is a `ResumeData` object):"
            "   - Use the 'USER'S REAL CONTACT INFO' provided above for: name, phone, email, linkedin, and portfolio."
            "   - For 'github', find the full GitHub URL in the 'Original Resume Text'. If not found, set it to null."
            "   - For 'summary', 'skills', 'experience', and 'projects', generate them by optimizing the 'Original Resume Text' based on the job description analysis."
            "2. For the 'rationale' key (which is a string):"
            "   - Provide a detailed, point-by-point explanation of *why* you made the changes to the summary, experience, and projects."
            "   - Reference specific keywords from the job description analysis in your reasoning."
        ),
        agent=resume_optimizer,
        context=[task_analyze_resume, task_analyze_job],
        output_pydantic=OptimizedResumeOutput
    )
    
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
        
        if not result:
            raise Exception("Crew returned no result.")
            
        final_json_string = result.model_dump_json()
        
        log.info(f"Final output length: {len(final_json_string)} characters")
        return final_json_string
        
    except Exception as e:
        log.error(f"CrewAI kickoff failed: {e}", exc_info=True)
        return f'{{"error": "The AI crew failed to process the request. {str(e)}"}}'
