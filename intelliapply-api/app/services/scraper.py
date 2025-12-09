
# app/services/scraper.py
import pandas as pd
from jobspy import scrape_jobs
import logging
import json

log = logging.getLogger(__name__)

def run_job_scrape(search_term: str, location: str, hours_old: int) -> list[dict]:
    """
    Uses JobSpy to scrape jobs based on a search config.
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
        
        json_string = jobs_df.to_json(orient='records', date_format='iso')
        jobs_list = json.loads(json_string)
        
        log.info(f"jobspy: Found and sanitized {len(jobs_list)} potential new jobs.")
        return jobs_list
        
    except Exception as e:
        log.error(f"jobspy: An error occurred during scraping.")
        log.error(f"jobspy: ERROR DETAILS: {e}")
        return []
