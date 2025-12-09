from pydantic import BaseModel
from typing import Optional

class OptimizedResumeRequest(BaseModel):
    profile_id: str
    job_id: int

class AIRequest(BaseModel):
    job_description: str
    profile_id: str
    company: str | None = None
    title: str | None = None

class ResumeFromTextRequest(BaseModel):
    profile_id: str
    job_description: str
    resume_context: str 
