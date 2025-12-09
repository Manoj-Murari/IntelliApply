
# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1.endpoints import jobs, ai, resume

api_router = APIRouter()

api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI"])
api_router.include_router(resume.router, prefix="/resume", tags=["Resume Builder"])
