# core/scraping.py
import pandas as pd
from jobspy import scrape_jobs
import logging
import json # <-- NEW IMPORT

log = logging.getLogger(__name__)

def run_job_scrape(search_term: str, location: str, hours_old: int) -> list[dict]:
    """
    Uses JobSpy to scrape jobs based on a search config.
    This will be called by our Arq worker.
    
    FINAL VERSION:
    - Removes 'naukri' (blocked by reCAPTCHA)
    - Adds robust data sanitization to fix date and NaN errors.
    """
    log.info(f"--- Starting jobspy scrape ---")
    log.info(f"Term: {search_term}, Location: {location}, Hours: {hours_old}")
    
    try:
        jobs_df: pd.DataFrame = scrape_jobs(
            # We are removing "naukri" (blocked) and keeping the working ones
            site_name=["linkedin", "indeed", "glassdoor"], 
            search_term=search_term,
            location=location,
            country_indeed='India',
            hours_old=hours_old,
            job_type='fulltime', 
            results_wanted=20, # 20 per site
            timeout=120
        )
        
        if jobs_df.empty:
            log.info("jobspy: No new jobs found matching criteria.")
            return []
        
        # --- NEW DATA SANITIZATION STEP ---
        # This is the most robust way to fix BOTH errors.
        # 1. pandas.to_json() correctly converts `date` objects to ISO strings
        #    and `NaN` floats to `null`.
        # 2. json.loads() converts the `null` values to Python's `None`.
        
        # Convert DataFrame to a JSON string, which handles bad data types
        json_string = jobs_df.to_json(orient='records', date_format='iso')
        
        # Convert the clean JSON string back into a Python list of dicts
        jobs_list = json.loads(json_string)
        
        log.info(f"jobspy: Found and sanitized {len(jobs_list)} potential new jobs.")
        return jobs_list
        
    except Exception as e:
        log.error(f"jobspy: An error occurred during scraping.")
        log.error(f"jobspy: ERROR DETAILS: {e}")
        return []