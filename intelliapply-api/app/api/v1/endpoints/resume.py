
# app/api/v1/endpoints/resume.py
from fastapi import APIRouter, File, UploadFile, Body, HTTPException, Response
from app.services.parser import parse_resume_to_json
from app.services.intelligence import analyze_gaps
from app.services.generator import tailor_resume, write_cover_letter
from app.services.renderer import render_resume_pdf, render_cover_letter_pdf
from app.schemas.resume import GapAnalysisRequest, GapAnalysisResponse, CoverLetterRequest, CoverLetterResponse
from app.core.config import supabase
import logging

router = APIRouter()
log = logging.getLogger(__name__)

@router.post("/ingest")
async def ingest_resume(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDFs allowed.")

    content = await file.read()

    try:
        parsed_data = parse_resume_to_json(content)
    except Exception as e:
        raise HTTPException(500, f"Parser failed: {e}")

    public_url = ""
    try:
        path = f"resumes/{file.filename}"
        # Using upsert to avoid errors during testing re-uploads
        if supabase:
            supabase.storage.from_("raw_resumes").upload(path, content, {"upsert": "true"})
            public_url = supabase.storage.from_("raw_resumes").get_public_url(path)
    except Exception as e:
        logging.error(f"Storage upload failed: {e}")

    return {"status": "success", "data": parsed_data, "file_url": public_url}

@router.post("/analyze-gaps", response_model=GapAnalysisResponse)
async def analyze_resume_gaps(request: GapAnalysisRequest = Body(...)):
    if not request.job_description or len(request.job_description) < 50:
        raise HTTPException(400, "Job description is too short.")

    try:
        analysis = analyze_gaps(request.resume_data, request.job_description)
        return analysis
    except Exception as e:
        logging.error(f"Gap Analysis Error: {e}")
        raise HTTPException(500, "Failed to analyze gaps.")

@router.post("/generate-tailored")
async def generate_tailored_resume_endpoint(
    resume_data: dict = Body(...),
    job_description: str = Body(...),
    gap_answers: dict = Body(default=None)
):
    try:
        tailored_json = tailor_resume(resume_data, job_description, gap_answers)
        return tailored_json
    except Exception as e:
        logging.error(f"Generation Error: {e}")
        raise HTTPException(500, f"Generation failed: {e}")

@router.post("/render-pdf")
async def render_pdf_endpoint(resume_data: dict = Body(...)):
    """
    Converts Resume JSON -> PDF (Auto-switching between Standard and Compact).
    """
    try:
        pdf_bytes = render_resume_pdf(resume_data)
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        logging.error(f"PDF Rendering Error: {e}")
        raise HTTPException(500, f"Failed to render PDF: {e}")

@router.post("/generate-cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter_endpoint_builder(request: CoverLetterRequest = Body(...)):
    if not request.job_description or len(request.job_description) < 50:
        raise HTTPException(400, "Job description is too short.")
        
    try:
        letter_text = write_cover_letter(request.resume_data, request.job_description)
        return {"cover_letter_text": letter_text}
    except Exception as e:
        logging.error(f"Cover Letter Error: {e}")
        raise HTTPException(500, "Failed to generate cover letter.")

@router.post("/render-cover-letter-pdf")
async def render_cover_letter_pdf_endpoint(
    resume_data: dict = Body(...),
    cover_letter_text: str = Body(...)
):
    """
    Converts Cover Letter Text + Resume Header -> PDF.
    """
    try:
        pdf_bytes = render_cover_letter_pdf(resume_data, cover_letter_text)
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        logging.error(f"Cover Letter PDF Error: {e}")
        raise HTTPException(500, f"Failed to render Cover Letter PDF: {e}")
