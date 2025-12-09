
# app/services/ai_analysis.py
import json
import google.generativeai as genai
from app.core.config import gemini_model
import logging

log = logging.getLogger(__name__)

def get_gemini_analysis(resume_context: str, job_description: str, experience_level: str) -> dict | None:
    """
    Gets a qualitative analysis and rating from the Gemini API.
    """
    if not gemini_model:
        log.error("Gemini client not initialized. Cannot perform analysis.")
        return None
        
    log.info(f"Getting Gemini analysis for '{experience_level}' role...")
    
    prompt = f"""
    Act as an extremely strict, expert technical recruiter. Your only goal is to protect my time by filtering out irrelevant job postings.

    MY RESUME CONTEXT:
    ---
    {resume_context}
    ---
    This resume clearly indicates my skills are in SOFTWARE development.

    THE JOB I AM LOOKING FOR:
    ---
    I am looking for an '{experience_level}' role.
    ---

    JOB DESCRIPTION TO ANALYZE:
    ---
    {job_description}
    ---

    YOUR INSTRUCTIONS (Follow these exactly):
    1.  **EXPERIENCE LEVEL CHECK (MOST IMPORTANT):** Analyze the job title and description for keywords related to seniority (e.g., "Senior", "Sr.", "Lead", "Principal", "Manager", "Staff"). If the job requires a higher experience level than '{experience_level}', you MUST give it a low rating and reject it.
    2.  **FIELD RELEVANCE CHECK:** Analyze if the core responsibilities are a strong match for my SOFTWARE skills. Immediately REJECT jobs that are primarily for hardware, mechanical engineering, sales, or other non-software fields.
    3.  **RATING:** Based on BOTH checks above, provide a suitability rating from 1 to 10. A rating of 7 or higher means it is a very strong match for BOTH my software skills AND my desired '{experience_level}'. Be extremely critical.
    4.  **JSON OUTPUT:** Return ONLY a valid JSON object with two keys: "gemini_rating" (int) and "ai_reason" (a concise, one-sentence reason for your rating).
    """
    
    try:
        generation_config = genai.types.GenerationConfig(
            response_mime_type="application/json"
        )
        response = gemini_model.generate_content(
            prompt,
            generation_config=generation_config
        )
        return json.loads(response.text)
        
    except Exception as e:
        log.error(f"Gemini analysis error: {e}")
        if hasattr(e, 'response'):
            log.error(f"Gemini non-JSON response: {e.response}")
        return None

def get_interview_prep(resume_context: str, job_description: str) -> dict | None:
    """
    Gets interview prep questions from the Gemini API.
    """
    if not gemini_model:
        log.error("Gemini client not initialized. Cannot perform analysis.")
        return None
        
    log.info("Getting Gemini interview prep...")
    
    prompt = f"""
    Act as a senior hiring manager preparing to interview a candidate.

    THE CANDIDATE'S RESUME CONTEXT:
    ---
    {resume_context}
    ---

    THE JOB DESCRIPTION:
    ---
    {job_description}
    ---

    INSTRUCTIONS:
    1.  Based on the job description AND the resume, generate a list of 5-7 likely interview questions.
    2.  Include a mix of Behavioral ("Tell me about a time..."), Technical ("How would you..."), and Situational ("What would you do if...") questions.
    3.  Return ONLY a valid JSON object with three keys: "Behavioral", "Technical", and "Situational".
    4.  The value for each key should be an array of strings, where each string is a specific question.
    
    Example Output:
    {{
      "Behavioral": ["..."],
      "Technical": ["..."],
      "Situational": ["..."]
    }}
    """
    
    try:
        generation_config = genai.types.GenerationConfig(
            response_mime_type="application/json"
        )
        response = gemini_model.generate_content(
            prompt,
            generation_config=generation_config
        )
        return json.loads(response.text)
        
    except Exception as e:
        log.error(f"Gemini interview prep error: {e}")
        return None

def get_resume_suggestions(resume_context: str, job_description: str) -> dict | None:
    """
    Gets resume tailoring suggestions from the Gemini API.
    """
    if not gemini_model:
        log.error("Gemini client not initialized. Cannot get suggestions.")
        return None
        
    log.info("Getting Gemini resume suggestions...")
    
    prompt = f"""
    Act as an expert career coach. Your task is to help me tailor my resume for a specific job.

    My current resume context is:
    ---
    {resume_context}
    ---

    The job description I am applying for is:
    ---
    {job_description}
    ---

    INSTRUCTIONS:
    1. Analyze my resume against the job description.
    2. Provide 3-5 specific, actionable suggestions for improvement.
    3. Focus on highlighting relevant skills, rephrasing bullet points, and adding keywords.
    4. Return ONLY a valid JSON object with one key: "suggestions".
    5. The value of "suggestions" should be an array of strings.
    
    Example Output:
    {{
      "suggestions": [
        "Rephrase 'Managed a team' to 'Led a team of 5 engineers to increase deployment frequency by 30%' to better match the leadership skills.",
        "Add a bullet point highlighting your experience with 'React' and 'TypeScript' as these are key requirements."
      ]
    }}
    """
    
    try:
        generation_config = genai.types.GenerationConfig(
            response_mime_type="application/json"
        )
        response = gemini_model.generate_content(
            prompt,
            generation_config=generation_config
        )
        return json.loads(response.text)
        
    except Exception as e:
        log.error(f"Gemini suggestions error: {e}")
        return None

def get_cover_letter(resume_context: str, job_description: str, company: str, title: str) -> dict | None:
    """
    Generates a cover letter from the Gemini API.
    """
    if not gemini_model:
        log.error("Gemini client not initialized. Cannot write cover letter.")
        return None
        
    log.info(f"Getting Gemini cover letter for {title} at {company}...")
    
    prompt = f"""
    Act as an expert career coach and professional writer. Your task is to write a concise, professional, and compelling cover letter.

    MY RESUME CONTEXT:
    ---
    {resume_context}
    ---

    THE JOB I AM APPLYING FOR:
    - Company: {company}
    - Job Title: {title}
    - Job Description: {job_description}
    ---

    INSTRUCTIONS:
    1.  Write a three-paragraph cover letter.
    2.  The tone should be professional, confident, and tailored.
    3.  Return ONLY a valid JSON object with one key: "coverLetter".
    4.  The value of "coverLetter" should be a single string containing the full letter text (with newlines as \n).
    """
    
    try:
        generation_config = genai.types.GenerationConfig(
            response_mime_type="application/json"
        )
        response = gemini_model.generate_content(
            prompt,
            generation_config=generation_config
        )
        return json.loads(response.text)
        
    except Exception as e:
        log.error(f"Gemini cover letter error: {e}")
        return None
