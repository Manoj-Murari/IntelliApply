# arq_worker.py
import logging
from datetime import datetime
from config import is_ready
from core.ai_analysis import get_gemini_analysis
from core.database import save_job_to_db
from core.scraping import run_job_scrape 

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

async def startup(ctx):
    log.info("Arq worker is starting up...")

async def shutdown(ctx):
    log.info("Arq worker is shutting down...")

# --- JOB 1: THE SCRAPER (NEW!) ---
async def scrape_and_fanout(ctx, search_config: dict):
    """
    This is the new "Conductor" job.
    1. It runs the scraper.
    2. It "fans out" the analysis work by enqueuing one 'analyze_and_save_job' for each job found.
    """
    log.info(f"--- WORKER RECEIVED JOB: scrape_and_fanout ---")
    log.info(f"Search Config: {search_config}")
    
    # 1. Run the Scraper
    scraped_jobs = run_job_scrape(
        search_term=search_config.get("search_term"),
        location=search_config.get("location"),
        hours_old=search_config.get("hours_old", 24)
    )
    
    if not scraped_jobs:
        log.info("Scraping finished. No jobs found.")
        return {"status": "ok", "jobs_found": 0}

    # 2. Fan-Out the Work
    # Get the Arq redis connection from the context
    redis = ctx['redis'] 
    
    log.info(f"Found {len(scraped_jobs)} jobs. Enqueuing them for AI analysis...")
    
    for job in scraped_jobs:
        # For each job, create a *new* analysis job.
        # This is powerful. 1 scrape job becomes 20 analysis jobs.
        await redis.enqueue_job(
            "analyze_and_save_job",
            {
                "title": job.get("title"),
                "company": job.get("company"),
                "job_url": job.get("job_url"),
                "description": job.get("description"),
                "location": job.get("location"),
                # We'll pass the profile/search info later
            }
        )
        
    log.info(f"--- WORKER FINISHED JOB: scrape_and_fanout ---")
    return {"status": "ok", "jobs_enqueued": len(scraped_jobs)}


# --- JOB 2: THE AI ANALYST (UPDATED) ---
async def analyze_and_save_job(ctx, job_data: dict):
    """
    This is the "Specialist" job.
    It analyzes one single job and saves it to the DB.
    """
    log.info(f"--- WORKER RECEIVED JOB: analyze_and_save_job ---")
    
    if not is_ready():
        log.error("Worker is not ready (missing Supabase/Gemini keys). Aborting job.")
        raise Exception("Worker not configured (Supabase/Gemini keys missing)")

    # --- This is placeholder data. ---
    DUMMY_RESUME = "Manoj Murari, B.Tech graduate. Skilled in Python, React, and AI development."
    DUMMY_EXP_LEVEL = "entry_level"
    # --- End placeholder data ---

    try:
        # Check for minimal data
        if not job_data.get("description") or not job_data.get("job_url"):
            log.warning(f"Skipping job '{job_data.get('title')}' due to missing description or URL.")
            return {"status": "skipped", "reason": "Missing data"}

        # 1. Get AI Analysis
        log.info(f"Analyzing job: '{job_data.get('title')}'")
        ai_result = get_gemini_analysis(
            resume_context=DUMMY_RESUME,
            job_description=job_data.get("description"),
            experience_level=DUMMY_EXP_LEVEL
        )
        
        if not ai_result:
            raise Exception("AI analysis failed to return valid data.")

        # 2. Combine and Save
        job_to_save = {
            "title": job_data.get("title"),
            "company": job_data.get("company"),
            "job_url": str(job_data.get("job_url")),
            "description": job_data.get("description"),
            "location": job_data.get("location"), # <-- New field
            "gemini_rating": ai_result.get("gemini_rating"),
            "ai_reason": ai_result.get("ai_reason"),
            "created_at": datetime.now().isoformat(),
            "status": "Applied" # Default status
        }
        
        # 3. Save to DB
        log.info(f"Saving job to Supabase: '{job_data.get('title')}'")
        save_job_to_db(job_to_save)
        
        log.info(f"--- WORKER FINISHED JOB: {job_data.get('title')} ---")
        return {"status": "ok", "job_title": job_data.get('title')}

    except Exception as e:
        log.error(f"Failed to process job '{job_data.get('title')}': {e}")
        raise e

# --- JOB 3: THE TEST JOB (No changes) ---
async def test_job(ctx, message: str):
    log.info(f"--- WORKER RECEIVED JOB: test_job ---")
    log.info(f"Message: '{message}'")
    log.info(f"--- WORKER FINISHED JOB: test_job ---")
    return f"Successfully processed: {message}"


# --- WORKER SETTINGS (UPDATED) ---
class WorkerSettings:
    functions = [
        scrape_and_fanout,  # <-- NEW
        analyze_and_save_job,
        test_job
    ] 
    on_startup = startup
    on_shutdown = shutdown
    redis_host = '127.0.0.1'
    redis_port = 6379