# core/ai_analysis.py
import json
import google.generativeai as genai  # <-- THE FIX IS HERE
from config import gemini_model
import logging

log = logging.getLogger(__name__)

def get_gemini_analysis(resume_context: str, job_description: str, experience_level: str) -> dict | None:
    """
    Gets a qualitative analysis and rating from the Gemini API.
    
    FIX: This now uses Gemini's JSON mode for reliable parsing.
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
        # Use GenerationConfig to force JSON output
        generation_config = genai.types.GenerationConfig(
            response_mime_type="application/json"
        )
        response = gemini_model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        # The response.text is now guaranteed to be a JSON string
        return json.loads(response.text)
        
    except Exception as e:
        log.error(f"Gemini analysis error: {e}")
        # Log the full response if it's not a JSON error
        if hasattr(e, 'response'):
            log.error(f"Gemini non-JSON response: {e.response}")
        return None