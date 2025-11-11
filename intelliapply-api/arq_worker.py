# arq_worker.py
import logging
from datetime import datetime
from typing import Optional
from config import is_ready, supabase
from core.ai_analysis import get_gemini_analysis
from core.database import batch_save_jobs # <-- UPDATED IMPORT
from core.scraping import run_job_scrape 

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

async def startup(ctx):
    log.info("Arq worker is starting up...")

async def shutdown(ctx):
    log.info("Arq worker is shutting down...")

# --- JOB 1: THE SCRAPER (UPDATED) ---
async def scrape_and_save(ctx, search_config: dict, user_id: str, search_id: str):
    """
    UPDATED "Save-then-Analyze" LOGIC:
    1. Runs the scraper.
    2. Calls a single batch_save_jobs function to efficiently save all new jobs.
    """
    log.info(f"--- WORKER RECEIVED JOB: scrape_and_save (User: {user_id}, Search: {search_id}) ---")
    
    scraped_jobs = run_job_scrape(
        search_term=search_config.get("search_term"),
        location=search_config.get("location"),
        hours_old=search_config.get("hours_old", 24)
    )
    
    if not scraped_jobs:
        log.info("Scraping finished. No jobs found.")
        return {"status": "ok", "jobs_found": 0, "newly_saved": 0}

    log.info(f"Found {len(scraped_jobs)} jobs. Handing off to batch saver...")
    
    # Add created_at timestamp to all jobs first
    for job in scraped_jobs:
        job['created_at'] = datetime.now().isoformat()
    
    try:
        # Call the new batch function ONCE
        saved_count = batch_save_jobs(scraped_jobs, user_id, search_id)
    except Exception as e:
        log.error(f"Failed to batch save jobs: {e}")
        raise e # Re-raise to fail the job
            
    log.info(f"--- WORKER FINISHED JOB: scrape_and_save ---")
    return {"status": "ok", "jobs_found": len(scraped_jobs), "newly_saved": saved_count}


# --- JOB 2: ON-DEMAND AI ANALYST (No changes) ---
async def analyze_job_on_demand(ctx, job_id: int, profile_id: str, description: Optional[str] = None):
    """
    UPDATED "On-Demand" LOGIC:
    1. Takes an optional 'description'.
    2. If 'description' is provided, it uses that.
    3. If 'description' is None, it fetches it from the DB.
    """
    log.info(f"--- WORKER RECEIVED JOB: analyze_job_on_demand (Job ID: {job_id}, Profile ID: {profile_id}) ---")
    
    if not is_ready():
        raise Exception("Worker not configured (Supabase/Gemini keys missing)")

    job_description = description # Use the passed-in description

    try:
        if not job_description:
            log.info(f"No description provided, fetching job {job_id} from DB...")
            job_res = supabase.table("jobs").select("id, description").eq("id", job_id).single().execute()
            job = job_res.data
            if not job: raise Exception(f"Job {job_id} not found.")
            if not job.get("description"): raise Exception(f"Job {job_id} has no description in DB.")
            job_description = job.get("description")
        else:
            log.info(f"Using provided description for job {job_id}.")

        log.info(f"Fetching profile {profile_id}...")
        profile_res = supabase.table("profiles").select("resume_context, experience_level").eq("id", profile_id).single().execute()
        profile = profile_res.data
        if not profile: raise Exception(f"Profile {profile_id} not found.")

        ai_result = get_gemini_analysis(
            resume_context=profile.get("resume_context"),
            job_description=job_description,
            experience_level=profile.get("experience_level", "entry_level")
        )
        
        if not ai_result:
            raise Exception("AI analysis failed to return valid data.")

        update_data = {
            "gemini_rating": ai_result.get("gemini_rating"),
            "ai_reason": ai_result.get("ai_reason"),
            "profile_id": profile_id,
            "description": job_description 
        }
        
        log.info(f"Updating job {job_id} with AI rating: {ai_result.get('gemini_rating')}/10")
        supabase.table("jobs").update(update_data).eq("id", job_id).execute()
        
        log.info(f"--- WORKER FINISHED JOB: analyze_job_on_demand (Job ID: {job_id}) ---")
        return {"status": "ok", "job_id": job_id, "rating": update_data["gemini_rating"]}

    except Exception as e:
        log.error(f"Failed to process job {job_id}: {e}")
        raise e

# --- WORKER SETTINGS (No changes) ---
class WorkerSettings:
    functions = [
        scrape_and_save,
        analyze_job_on_demand,
    ] 
    on_startup = startup
    on_shutdown = shutdown
    redis_host = '127.0.0.1'
    redis_port = 6379