# core/scraping.py
import pandas as pd
from jobspy import scrape_jobs
import logging

log = logging.getLogger(__name__)

def run_job_scrape(search_term: str, location: str, hours_old: int) -> list[dict]:
    """
    Uses JobSpy to scrape jobs based on a search config.
    This will be called by our Arq worker.
    """
    log.info(f"--- Starting jobspy scrape ---")
    log.info(f"Term: {search_term}, Location: {location}, Hours: {hours_old}")
    
    try:
        jobs_df: pd.DataFrame = scrape_jobs(
            site_name=["linkedin","indeed"], # Per your request, starting with LinkedIn
            search_term=search_term,
            location=location,
            country_indeed='India', # Force India for Indeed
            hours_old=hours_old,
            job_type='fulltime', 
            results_wanted=20, # Keep it reasonable
            timeout=120
        )
        
        if jobs_df.empty:
            log.info("jobspy: No new jobs found matching criteria.")
            return []
        
        # Clean data for JSON serialization (replace NaN)
        jobs_df = jobs_df.where(pd.notnull(jobs_df), None)
        jobs_list = jobs_df.to_dict('records')
        
        log.info(f"jobspy: Found {len(jobs_list)} potential new jobs.")
        return jobs_list
        
    except Exception as e:
        log.error(f"jobspy: An error occurred during scraping.")
        log.error(f"jobspy: ERROR DETAILS: {e}")
        return []