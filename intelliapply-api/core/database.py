# core/database.py
from config import supabase
import logging
from datetime import datetime

log = logging.getLogger(__name__)

def batch_save_jobs(jobs_list: list[dict], user_id: str, search_id: str) -> int:
    """
    Saves a list of jobs in a single batch insert.
    
    FIX:
    - Fetches all existing jobs for the user ONCE to check for duplicates.
    - Inserts all new jobs in a SINGLE batch request.
    - This is much, much faster and avoids network timeouts.
    """
    log.info(f"Batch saving {len(jobs_list)} jobs for user {user_id}...")
    
    # 1. Get all existing job titles/companies for this user ONCE.
    try:
        existing_jobs_res = supabase.table("jobs") \
            .select("title, company") \
            .eq("user_id", user_id) \
            .execute()
        
        if hasattr(existing_jobs_res, 'error') and existing_jobs_res.error:
            raise Exception(str(existing_jobs_res.error))

        # Create a set of (title, company) tuples for fast lookup
        existing_job_set = set(
            (job['title'].lower(), job['company'].lower()) for job in existing_jobs_res.data
        )
        log.info(f"Found {len(existing_job_set)} existing jobs for user's duplicate check.")

    except Exception as e:
        log.error(f"Failed to fetch existing jobs for dupe check: {e}")
        raise e # Fail the whole job if we can't check for dupes

    # 2. Filter out duplicates in memory
    jobs_to_save = []
    skipped_count = 0
    for job in jobs_list:
        job_title = job.get('title')
        job_company = job.get('company')
        job_url = job.get('job_url')

        if not job_title or not job_company or not job_url:
            skipped_count += 1
            continue # Skip jobs with missing core data

        # Check against our set
        if (job_title.lower(), job_company.lower()) in existing_job_set:
            skipped_count += 1
            continue # Skip duplicate

        # Add to our batch
        jobs_to_save.append({
            "title": job_title,
            "company": job_company,
            "job_url": str(job_url),
            "description": job.get("description"),
            "location": job.get("location"),
            "created_at": job.get('created_at', datetime.now().isoformat()),
            "status": "Applied",
            "user_id": user_id,
            "search_id": search_id,
            "is_tracked": False
        })
        
        # Add to set to prevent duplicate *within this same batch*
        existing_job_set.add((job_title.lower(), job_company.lower()))

    # 3. Perform one single batch insert
    if jobs_to_save:
        log.info(f"Saving {len(jobs_to_save)} new jobs to database. Skipping {skipped_count}.")
        insert_response = supabase.table("jobs").insert(jobs_to_save).execute()
        
        if hasattr(insert_response, 'error') and insert_response.error:
            log.error(f"Batch insert failed: {insert_response.error}")
            raise Exception(str(insert_response.error))
        
        return len(jobs_to_save)
    else:
        log.info(f"No new jobs to save. Skipping {skipped_count}.")
        return 0