# arq_worker.py
import logging
from datetime import datetime
from config import is_ready, supabase
from core.ai_analysis import get_gemini_analysis
from core.database import save_job_to_db
from core.scraping import run_job_scrape 

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

async def startup(ctx):
    log.info("Arq worker is starting up...")

async def shutdown(ctx):
    log.info("Arq worker is shutting down...")

# --- JOB 1: THE SCRAPER (HEAVILY UPDATED) ---
async def scrape_and_save(ctx, search_config: dict, user_id: str, search_id: str): # <-- NEW ARGS
    """
    NEW "Save-then-Analyze" LOGIC:
    1. It runs the scraper.
    2. It saves ALL found jobs to the DB as "raw" jobs,
       stamped with the correct user_id and search_id.
    3. It does NOT call the AI.
    """
    log.info(f"--- WORKER RECEIVED JOB: scrape_and_save (User: {user_id}, Search: {search_id}) ---")
    
    scraped_jobs = run_job_scrape(
        search_term=search_config.get("search_term"),
        location=search_config.get("location"),
        hours_old=search_config.get("hours_old", 24)
    )
    
    if not scraped_jobs:
        log.info("Scraping finished. No jobs found.")
        return {"status": "ok", "jobs_found": 0}

    log.info(f"Found {len(scraped_jobs)} jobs. Saving them to DB (raw)...")
    
    saved_count = 0
    for job in scraped_jobs:
        try:
            job['created_at'] = datetime.now().isoformat()
            # Pass the user_id and search_id to the save function
            save_job_to_db(job, user_id, search_id)
            saved_count += 1
        except Exception as e:
            log.warning(f"Failed to save job '{job.get('title')}': {e}")
            
    log.info(f"--- WORKER FINISHED JOB: scrape_and_save ---")
    return {"status": "ok", "jobs_found": len(scraped_jobs), "newly_saved": saved_count}


# --- JOB 2: ON-DEMAND AI ANALYST (No changes needed) ---
async def analyze_job_on_demand(ctx, job_id: int, profile_id: int): 
    """
    This function is fine. The user_id check should happen in the
    API endpoint that *triggers* this job, not in the worker itself.
    """
    log.info(f"--- WORKER RECEIVED JOB: analyze_job_on_demand (Job ID: {job_id}, Profile ID: {profile_id}) ---")
    
    if not is_ready():
        raise Exception("Worker not configured (Supabase/Gemini keys missing)")

    try:
        # 1. Fetch the job
        log.info(f"Fetching job {job_id}...")
        job_res = supabase.table("jobs").select("id, description").eq("id", job_id).single().execute()
        job = job_res.data
        if not job: raise Exception(f"Job {job_id} not found.")
        if not job.get("description"): raise Exception(f"Job {job_id} has no description.")

        # 2. Fetch the profile
        log.info(f"Fetching profile {profile_id}...")
        profile_res = supabase.table("profiles").select("resume_context, experience_level").eq("id", profile_id).single().execute()
        profile = profile_res.data
        if not profile: raise Exception(f"Profile {profile_id} not found.")

        # 3. Get AI Analysis (Using REAL data)
        ai_result = get_gemini_analysis(
            resume_context=profile.get("resume_context"),
            job_description=job.get("description"),
            experience_level=profile.get("experience_level", "entry_level")
        )
        
        if not ai_result:
            raise Exception("AI analysis failed to return valid data.")

        # 4. Update the job in Supabase
        update_data = {
            "gemini_rating": ai_result.get("gemini_rating"),
            "ai_reason": ai_result.get("ai_reason"),
            "profile_id": profile_id 
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