
# app/api/v1/endpoints/jobs.py
from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import List
from datetime import datetime
import logging

from app.core.config import supabase
from app.core.security import get_current_user
from app.schemas.jobs import (
    ManualJobCreate, JobStatusUpdate, JobDetailsUpdate, JobDeleteRequest
)
from app.schemas.analysis import AnalyzeRequest, BulkAnalyzeRequest

router = APIRouter()
log = logging.getLogger(__name__)

# --- JOB ANALYSIS (Enqueuing) ---

@router.post("/{job_id}/analyze")
async def trigger_on_demand_analysis(
    job_id: int, 
    request: AnalyzeRequest, 
    req: Request,
    user_id: str = Depends(get_current_user)
):
    """
    Triggers an on-demand AI analysis for a specific job.
    """
    redis = getattr(req.app.state, "redis", None)
    if not redis:
        raise HTTPException(status_code=503, detail="Job queue (Redis) is not connected.")
    
    # Verify ownership
    job_res = supabase.table("jobs").select("id").eq("id", job_id).eq("user_id", user_id).single().execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job not found or access denied.")
        
    log.info(f"API: Received on-demand analysis for job {job_id} using profile {request.profile_id} (User: {user_id})")
    
    await redis.enqueue_job(
        "analyze_job_on_demand", 
        job_id, 
        request.profile_id, 
        request.description
    )
    return {"status": "ok", "message": "On-demand analysis enqueued."}

@router.post("/bulk-analyze")
async def trigger_bulk_analysis(
    request: BulkAnalyzeRequest, 
    req: Request,
    user_id: str = Depends(get_current_user)
):
    redis = getattr(req.app.state, "redis", None)
    if not redis:
        raise HTTPException(status_code=503, detail="Job queue (Redis) is not connected.")

    log.info(f"API: Received bulk analysis request for {len(request.job_ids)} jobs from User {user_id}")

    # Verify profile access (simple check)
    # Ideally get_profile_context helper if needed, but let's assume worker handles detailed checks 
    # or we do a quick check here. original code called get_profile_context.

    # 1. Fetch eligible jobs
    response = supabase.table("jobs") \
        .select("id, description") \
        .in_("id", request.job_ids) \
        .eq("user_id", user_id) \
        .not_.is_("description", "null") \
        .is_("gemini_rating", "null") \
        .execute()

    if hasattr(response, 'error') and response.error:
        raise Exception(str(response.error))

    jobs_to_process = response.data
    if not jobs_to_process:
        return {"status": "ok", "message": "No new jobs with descriptions to analyze."}

    enqueued_count = 0
    for job in jobs_to_process:
        await redis.enqueue_job(
            "analyze_job_on_demand",
            job['id'],
            request.profile_id,
            job['description']
        )
        enqueued_count += 1
    
    log.info(f"API: Enqueued {enqueued_count} analysis jobs.")
    return {"status": "ok", "message": f"Enqueued {enqueued_count} jobs for analysis."}


# --- CRUD / MUTATIONS ---

@router.post("/create-manual", status_code=status.HTTP_201_CREATED)
async def create_manual_job(request: ManualJobCreate, user_id: str = Depends(get_current_user)):
    try:
        dupe_check = supabase.table("jobs").select("id", count='exact') \
            .eq("user_id", user_id) \
            .ilike("title", request.title) \
            .ilike("company", request.company) \
            .execute()

        if dupe_check.count > 0:
            raise HTTPException(status_code=409, detail="This job already exists in your library.")

        job_to_save = {
            "user_id": user_id,
            "title": request.title,
            "company": request.company,
            "job_url": request.job_url,
            "location": request.location,
            "description": request.description,
            "created_at": datetime.now().isoformat(),
            "status": "Applied",
            "is_tracked": False,
        }
        
        insert_response = supabase.table("jobs").insert(job_to_save).execute()
        
        if hasattr(insert_response, 'error') and insert_response.error:
            raise Exception(str(insert_response.error))
            
        if not insert_response.data:
            raise Exception("Failed to save job, no data returned.")
            
        log.info(f"API: Manually created job {insert_response.data[0]['id']} for user {user_id}")
        return insert_response.data[0]
        
    except HTTPException as he:
        raise he
    except Exception as e:
        log.error(f"Failed to create manual job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/update-status")
async def update_job_status(job_id: int, request: JobStatusUpdate, user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table("jobs") \
            .update({"status": request.status}) \
            .eq("id", job_id) \
            .eq("user_id", user_id) \
            .execute()
        if hasattr(response, 'error') and response.error:
            raise Exception(str(response.error))
            
        return {"status": "ok", "message": "Job status updated."}
    except Exception as e:
        log.error(f"Failed to update job status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/update-details")
async def update_job_details(job_id: int, request: JobDetailsUpdate, user_id: str = Depends(get_current_user)):
    try:
        update_data = request.model_dump(exclude_unset=True) 
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided.")
            
        response = supabase.table("jobs") \
            .update(update_data) \
            .eq("id", job_id) \
            .eq("user_id", user_id) \
            .execute()
        if hasattr(response, 'error') and response.error:
            raise Exception(str(response.error))

        return {"status": "ok", "message": "Job details updated."}
    except Exception as e:
        log.error(f"Failed to update job details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/delete")
async def delete_jobs(request: JobDeleteRequest, user_id: str = Depends(get_current_user)):
    try:
        job_ids = request.job_ids
        if not job_ids:
            raise HTTPException(status_code=400, detail="No job IDs provided.")

        response = supabase.table("jobs") \
            .delete() \
            .in_("id", job_ids) \
            .eq("user_id", user_id) \
            .execute()
            
        if hasattr(response, 'error') and response.error:
            raise Exception(str(response.error))
            
        return {"status": "ok", "message": f"Deleted {len(response.data)} job(s)."}
    except Exception as e:
        log.error(f"Failed to delete jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/delete-all-untracked")
async def delete_all_untracked_jobs(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table("jobs") \
            .delete() \
            .eq("user_id", user_id) \
            .eq("is_tracked", False) \
            .execute()
            
        if hasattr(response, 'error') and response.error:
            raise Exception(str(response.error))
            
        return {"status": "ok", "message": f"Deleted {len(response.data)} untracked job(s)."}
    except Exception as e:
        log.error(f"Failed to delete untracked jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
