# main.py
from fastapi import FastAPI, HTTPException, Depends
from arq.connections import RedisSettings
from arq import create_pool
import logging
from pydantic import BaseModel, HttpUrl
from typing import List

from arq.connections import RedisSettings as Settings 
from config import is_ready, supabase
from core.ai_analysis import (
    get_interview_prep, 
    get_resume_suggestions, 
    get_cover_letter,
    get_gemini_analysis 
)
# --- Import auth dependency ---
from core.auth import get_current_user

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = FastAPI(
    title="IntelliApply API",
    description="The new unified backend for IntelliApply 2.0",
    version="2.0.0"
)

# --- CORS MIDDLEWARE ---
from fastapi.middleware.cors import CORSMiddleware
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)
# --- END CORS MIDDLEWARE ---

ARQ_REDIS = None

@app.on_event("startup")
async def startup():
    global ARQ_REDIS
    log.info("Connecting to Arq/Redis at localhost:6379...")
    try:
        ARQ_REDIS = await create_pool(Settings(host='127.0.0.1', port=6379)) 
        log.info("Successfully connected to Redis.")
    except Exception as e:
        log.error(f"Failed to connect to Redis: {e}")

@app.on_event("shutdown")
async def shutdown():
    if ARQ_REDIS:
        await ARQ_REDIS.close()
        log.info("Closed Redis connection pool.")

@app.get("/")
async def get_root():
    return {"status": "ok", "message": "IntelliApply API v2.0 is running."}

# --- Pydantic Models ---
class ScrapeRequest(BaseModel):
    search_term: str
    location: str
    hours_old: int = 24
    search_id: str 

class AnalyzeRequest(BaseModel):
    profile_id: str  # <-- THIS WAS THE FIX (changed from 'int')

class AIRequest(BaseModel):
    job_description: str
    profile_id: str  # <-- PROACTIVE FIX (changed from 'int')
    company: str | None = None
    title: str | None = None

# --- NEW: Models for Job Mutations ---
class JobStatusUpdate(BaseModel):
    status: str

class JobDetailsUpdate(BaseModel):
    notes: str | None = None
    contacts: list | None = None

class JobDeleteRequest(BaseModel):
    job_ids: List[int]

# --- Re-usable function to get profile context ---
# --- UPDATED: To verify user_id ---
def get_profile_context(profile_id: str, user_id: str): # <-- PROACTIVE FIX (changed from 'int')
    if not is_ready():
        raise HTTPException(status_code=503, detail="DB client not configured.")
    try:
        # Check that the profile belongs to the user
        profile_res = supabase.table("profiles") \
            .select("resume_context, experience_level") \
            .eq("id", profile_id) \
            .eq("user_id", user_id) \
            .single().execute()
            
        profile = profile_res.data
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found or access denied.")
        return profile
    except Exception as e:
        log.error(f"Failed to fetch profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail="Database error.")

# --- API Endpoints ---
# --- All endpoints are now protected by `user_id: str = Depends(get_current_user)` ---

@app.post("/api/v1/searches/trigger-scrape")
async def trigger_scrape(request: ScrapeRequest, user_id: str = Depends(get_current_user)):
    if not ARQ_REDIS:
        raise HTTPException(status_code=503, detail="Job queue (Redis) is not connected.")
    log.info(f"API: Received scrape request for: '{request.search_term}' from User {user_id}")
    
    # We pass the user_id and search_id to the worker
    await ARQ_REDIS.enqueue_job(
        "scrape_and_save", 
        request.model_dump(), 
        user_id, 
        request.search_id
    )
    return {"status": "ok", "message": "Scrape-and-save job enqueued."}


@app.post("/api/v1/jobs/{job_id}/analyze")
async def trigger_on_demand_analysis(job_id: int, request: AnalyzeRequest, user_id: str = Depends(get_current_user)):
    if not ARQ_REDIS:
        raise HTTPException(status_code=503, detail="Job queue (Redis) is not connected.")
    
    # --- SECURITY CHECK ---
    # Verify the job belongs to the user before enqueuing
    job_res = supabase.table("jobs").select("id").eq("id", job_id).eq("user_id", user_id).single().execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job not found or access denied.")
        
    log.info(f"API: Received on-demand analysis for job {job_id} using profile {request.profile_id} (User: {user_id})")
    await ARQ_REDIS.enqueue_job("analyze_job_on_demand", job_id, request.profile_id)
    return {"status": "ok", "message": "On-demand analysis enqueued."}

@app.post("/api/v1/ai/interview-prep")
async def generate_interview_prep(request: AIRequest, user_id: str = Depends(get_current_user)):
    log.info(f"API: Received interview prep request for profile {request.profile_id}...")
    profile = get_profile_context(request.profile_id, user_id) # Pass user_id for verification
    prep_data = get_interview_prep(profile.get("resume_context"), request.job_description)
    if not prep_data:
        raise HTTPException(status_code=500, detail="AI failed to generate prep data.")
    return prep_data

@app.post("/api/v1/ai/tailor-resume")
async def generate_resume_suggestions(request: AIRequest, user_id: str = Depends(get_current_user)):
    log.info(f"API: Received resume tailoring request for profile {request.profile_id}...")
    profile = get_profile_context(request.profile_id, user_id) # Pass user_id for verification
    suggestions = get_resume_suggestions(profile.get("resume_context"), request.job_description)
    if not suggestions:
        raise HTTPException(status_code=500, detail="AI failed to generate suggestions.")
    return suggestions

@app.post("/api/v1/ai/generate-cover-letter")
async def generate_cover_letter(request: AIRequest, user_id: str = Depends(get_current_user)):
    log.info(f"API: Received cover letter request for profile {request.profile_id}...")
    if not request.company or not request.title:
        raise HTTPException(status_code=400, detail="Company and Title are required for cover letters.")
    profile = get_profile_context(request.profile_id, user_id) # Pass user_id for verification
    letter = get_cover_letter(profile.get("resume_context"), request.job_description, request.company, request.title)
    if not letter:
        raise HTTPException(status_code=500, detail="AI failed to generate cover letter.")
    return letter

# --- NEW: SECURE JOB MUTATION ENDPOINTS ---

@app.post("/api/v1/jobs/{job_id}/update-status")
async def update_job_status(job_id: int, request: JobStatusUpdate, user_id: str = Depends(get_current_user)):
    try:
        data, error = supabase.table("jobs") \
            .update({"status": request.status}) \
            .eq("id", job_id) \
            .eq("user_id", user_id) \
            .execute()
        if error:
            raise error
        return {"status": "ok", "message": "Job status updated."}
    except Exception as e:
        log.error(f"Failed to update job status: {e}")
        raise HTTPException(status_code=500, detail="Database error.")

@app.post("/api/v1/jobs/{job_id}/update-details")
async def update_job_details(job_id: int, request: JobDetailsUpdate, user_id: str = Depends(get_current_user)):
    try:
        update_data = request.model_dump(exclude_unset=True) # Only update fields that were sent
        if not update_data:
             raise HTTPException(status_code=400, detail="No data provided.")
             
        data, error = supabase.table("jobs") \
            .update(update_data) \
            .eq("id", job_id) \
            .eq("user_id", user_id) \
            .execute()
        if error:
            raise error
        return {"status": "ok", "message": "Job details updated."}
    except Exception as e:
        log.error(f"Failed to update job details: {e}")
        raise HTTPException(status_code=500, detail="Database error.")

@app.post("/api/v1/jobs/delete")
async def delete_jobs(request: JobDeleteRequest, user_id: str = Depends(get_current_user)):
    try:
        job_ids = request.job_ids
        if not job_ids:
             raise HTTPException(status_code=400, detail="No job IDs provided.")

        data, error = supabase.table("jobs") \
            .delete() \
            .in_("id", job_ids) \
            .eq("user_id", user_id) \
            .execute()
            
        if error:
            raise error
        return {"status": "ok", "message": f"Deleted {len(data)} job(s)."}
    except Exception as e:
        log.error(f"Failed to delete jobs: {e}")
        raise HTTPException(status_code=500, detail="Database error.")

@app.post("/api/v1/jobs/delete-all-untracked")
async def delete_all_untracked_jobs(user_id: str = Depends(get_current_user)):
    try:
        data, error = supabase.table("jobs") \
            .delete() \
            .eq("user_id", user_id) \
            .eq("is_tracked", False) \
            .execute()
            
        if error:
            raise error
        return {"status": "ok", "message": f"Deleted {len(data)} untracked job(s)."}
    except Exception as e:
        log.error(f"Failed to delete untracked jobs: {e}")
        raise HTTPException(status_code=500, detail="Database error.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)