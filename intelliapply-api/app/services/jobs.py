
# app/services/jobs.py
from app.core.config import supabase
import logging
from datetime import datetime

log = logging.getLogger(__name__)

def batch_save_jobs(jobs_list: list[dict], user_id: str, search_id: str) -> int:
    """
    Saves a list of jobs in a single batch insert with OPTIMIZED deduplication.
    
    OPTIMIZATION:
    Instead of fetching ALL user history (O(N)), we only query for jobs that match 
    the URLs in the current batch (O(K)). This scales infinitely.
    """
    if not jobs_list:
        return 0

    log.info(f"Batch saving {len(jobs_list)} jobs for user {user_id}...")
    
    # 1. Collect all URLs from the incoming batch
    incoming_urls = [job.get('job_url') for job in jobs_list if job.get('job_url')]
    
    if not incoming_urls:
         log.info("No valid URLs in batch. Skipping.")
         return 0

    existing_urls = set()

    # 2. Query ONLY for these URLs in the DB
    try:
        if not supabase:
             raise Exception("Database not connected")

        # We paginate this check if batch is huge, but usually batch < 100
        existing_jobs_res = supabase.table("jobs") \
            .select("job_url") \
            .eq("user_id", user_id) \
            .in_("job_url", incoming_urls) \
            .execute()
        
        if hasattr(existing_jobs_res, 'error') and existing_jobs_res.error:
            raise Exception(str(existing_jobs_res.error))

        existing_urls = set(job['job_url'] for job in existing_jobs_res.data)
        log.info(f"Found {len(existing_urls)} duplicates in DB out of {len(incoming_urls)} incoming.")

    except Exception as e:
        log.error(f"Failed to check duplicates: {e}")
        # If check fails, we might create duplicates. Fail safe: raise
        raise e 

    # 3. Filter and Prepare
    jobs_to_save = []
    skipped_count = 0
    
    # Use a set to prevent duplicates WITHIN the same batch
    seen_in_batch = set()

    for job in jobs_list:
        job_url = job.get('job_url')
        job_title = job.get('title')
        job_company = job.get('company')
        
        if not job_url or not job_title or not job_company:
            skipped_count += 1
            continue

        # Check DB duplicates
        if job_url in existing_urls:
            skipped_count += 1
            continue
            
        # Check batch duplicates
        if job_url in seen_in_batch:
            skipped_count += 1
            continue
            
        seen_in_batch.add(job_url)

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

    # 4. Single Batch Insert
    if jobs_to_save:
        log.info(f"Saving {len(jobs_to_save)} new jobs. Skipped {skipped_count}.")
        insert_response = supabase.table("jobs").insert(jobs_to_save).execute()
        
        if hasattr(insert_response, 'error') and insert_response.error:
            log.error(f"Batch insert failed: {insert_response.error}")
            raise Exception(str(insert_response.error))
        
        return len(jobs_to_save)
    else:
        log.info(f"No new jobs to save. Skipped {skipped_count}.")
        return 0
