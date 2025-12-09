
# app/api/v1/endpoints/ai.py
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.core.config import is_ready, supabase
from app.schemas.ai import AIRequest, OptimizedResumeRequest, ResumeFromTextRequest
from app.services.ai_analysis import get_interview_prep, get_resume_suggestions, get_cover_letter
from app.services.ai_crew import run_resume_crew
import logging

router = APIRouter()
log = logging.getLogger(__name__)

# --- Helper ---
def get_profile_context(profile_id: str, user_id: str):
    if not is_ready():
        raise HTTPException(status_code=503, detail="DB client not configured.")
    try:
        profile_res = supabase.table("profiles") \
            .select("*") \
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

@router.post("/interview-prep")
async def generate_interview_prep_endpoint(request: AIRequest, user_id: str = Depends(get_current_user)):
    log.info(f"API: Received interview prep request for profile {request.profile_id}...")
    profile = get_profile_context(request.profile_id, user_id)
    prep_data = get_interview_prep(profile.get("resume_context"), request.job_description)
    if not prep_data:
        raise HTTPException(status_code=500, detail="AI failed to generate prep data.")
    return prep_data

@router.post("/tailor-resume")
async def generate_resume_suggestions_endpoint(request: AIRequest, user_id: str = Depends(get_current_user)):
    log.info(f"API: Received resume tailoring request for profile {request.profile_id}...")
    profile = get_profile_context(request.profile_id, user_id)
    suggestions = get_resume_suggestions(profile.get("resume_context"), request.job_description)
    if not suggestions:
        raise HTTPException(status_code=500, detail="AI failed to generate suggestions.")
    return suggestions

@router.post("/generate-cover-letter")
async def generate_cover_letter_endpoint(request: AIRequest, user_id: str = Depends(get_current_user)):
    log.info(f"API: Received cover letter request for profile {request.profile_id}...")
    if not request.company or not request.title:
        raise HTTPException(status_code=400, detail="Company and Title are required for cover letters.")
    profile = get_profile_context(request.profile_id, user_id)
    letter = get_cover_letter(profile.get("resume_context"), request.job_description, request.company, request.title)
    if not letter:
        raise HTTPException(status_code=500, detail="AI failed to generate cover letter.")
    return letter

@router.post("/generate-optimized-resume")
async def generate_optimized_resume(request: OptimizedResumeRequest, user_id: str = Depends(get_current_user)):
    log.info(f"API: Received resume optimization request for job {request.job_id} from user {user_id}")
    try:
        profile_data = get_profile_context(request.profile_id, user_id)
        resume_context = profile_data.get("resume_context")

        job_res = supabase.table("jobs") \
            .select("description") \
            .eq("id", request.job_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        
        if hasattr(job_res, 'error') and job_res.error:
            raise Exception(str(job_res.error))
        if not job_res.data or not job_res.data.get("description"):
            raise HTTPException(status_code=404, detail="Job description not found for this job.")
        
        job_description = job_res.data["description"]
        
        log.info("Handing off to AI Crew...")
        
        optimized_resume = await asyncio.to_thread(
            run_resume_crew, 
            job_description=job_description, 
            resume_context=resume_context,
            profile_data=profile_data
        )
        log.info("AI Crew finished. Returning result.")
        
        if optimized_resume.startswith("Error:"):
            raise Exception(optimized_resume)
            
        return {"optimized_resume": optimized_resume}
        
    except HTTPException as he:
        log.error(f"HTTP exception: {he.detail}")
        raise he
    except Exception as e:
        log.error(f"Failed to generate optimized resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-resume-from-text")
async def generate_resume_from_text(request: ResumeFromTextRequest, user_id: str = Depends(get_current_user)):
    log.info(f"API: Received resume-from-text request for profile {request.profile_id} from user {user_id}")
    try:
        profile_data = get_profile_context(request.profile_id, user_id)
        
        resume_context = request.resume_context
        job_description = request.job_description

        if not resume_context or not job_description:
            raise HTTPException(status_code=400, detail="Resume context and job description are required.")

        log.info("Handing off to AI Crew...")
        
        optimized_resume = await asyncio.to_thread(
            run_resume_crew, 
            job_description=job_description, 
            resume_context=resume_context,
            profile_data=profile_data
        )
        log.info("AI Crew finished. Returning result.")
        
        if optimized_resume.startswith("Error:"):
            raise Exception(optimized_resume)
            
        return {"optimized_resume": optimized_resume}
        
    except HTTPException as he:
        log.error(f"HTTP exception: {he.detail}")
        raise he
    except Exception as e:
        log.error(f"Failed to generate optimized resume from text: {e}")
        raise HTTPException(status_code=500, detail=str(e))
