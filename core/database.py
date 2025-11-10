# core/database.py
from config import supabase
import logging

log = logging.getLogger(__name__)

def save_job_to_db(job_data: dict):
    """
    Saves a single processed job to the Supabase database, avoiding duplicates.
    
    UPDATED: Now re-raises an exception if the save fails.
    """
    try:
        job_url = job_data.get('job_url')
        if not job_url:
            log.warning("Skipped save. Job has no URL.")
            return

        # Check if a job with the same URL already exists
        result = supabase.table('jobs').select('id').eq('job_url', job_url).execute()
        if result.data:
            log.info(f"Skipped save. Job '{job_data['title']}' already exists.")
            return

        log.info(f"Saving new job '{job_data['title']}' to database...")
        supabase.table('jobs').insert(job_data).execute()
        log.info("Save successful.")
    except Exception as e:
        log.error(f"DB save error: {e}")
        # THIS IS THE FIX: Re-raise the exception so the Arq worker knows it failed.
        raise e