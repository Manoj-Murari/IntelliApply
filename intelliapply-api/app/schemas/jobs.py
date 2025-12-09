from pydantic import BaseModel
from typing import List, Optional

class ScrapeRequest(BaseModel):
    search_term: str
    location: str
    hours_old: int = 24
    search_id: str 

class ManualJobCreate(BaseModel):
    title: str
    company: str
    job_url: str
    location: Optional[str] = None
    description: Optional[str] = None

class JobStatusUpdate(BaseModel):
    status: str

class JobDetailsUpdate(BaseModel):
    notes: Optional[str] = None
    contacts: Optional[list] = None
    is_tracked: Optional[bool] = None
    status: Optional[str] = None
    description: Optional[str] = None

class JobDeleteRequest(BaseModel):
    job_ids: List[int]
