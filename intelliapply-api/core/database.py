# core/database.py
from config import supabase
import logging
from datetime import datetime

log = logging.getLogger(__name__)

def save_job_to_db(job_data: dict, user_id: str, search_id: str): # <-- NEW ARGS
    """
    Saves a single processed job to the Supabase database.
    
    FIX:
    - Now requires user_id and search_id to stamp the job.
    - De-duplicates based on 'user_id', 'title', AND 'company'.
    """
    try:
        job_title = job_data.get('title')
        job_company = job_data.get('company')
        job_url = job_data.get('job_url')

        if not job_title or not job_company:
            log.warning("Skipped save. Job is missing a title or company.")
            return

        # --- THIS IS THE NEW DUPLICATE CHECK ---
        # Check if a job with the same user, title, AND company already exists
        result = supabase.table('jobs').select('id') \
            .eq('user_id', user_id) \
            .ilike('title', job_title) \
            .ilike('company', job_company) \
            .execute()
        
        if result.data:
            log.info(f"Skipped save. Job '{job_title}' at '{job_company}' already exists for user.")
            return
        # --- END NEW CHECK ---

        if not job_url:
            log.warning(f"Skipped save. Job '{job_title}' has no URL.")
            return

        # We explicitly build our object to include user_id and search_id
        job_to_save = {
            "title": job_title,
            "company": job_company,
            "job_url": str(job_url),
            "description": job_data.get("description"),
            "location": job_data.get("location"),
            "created_at": datetime.now().isoformat(),
            "status": "Applied", # Default status
            "gemini_rating": None,
            "ai_reason": None,
            "user_id": user_id,       # <-- NEW
            "search_id": search_id,   # <-- NEW
            "is_tracked": False       # <-- NEW (Default to not tracked)
        }

        log.info(f"Saving new RAW job '{job_to_save['title']}' to database for user {user_id}...")
        supabase.table('jobs').insert(job_to_save).execute()
        log.info("Raw save successful.")
        
    except Exception as e:
        log.error(f"DB save error: {e}")
        raise e