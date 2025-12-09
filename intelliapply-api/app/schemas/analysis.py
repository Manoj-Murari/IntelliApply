from pydantic import BaseModel
from typing import List, Optional

class AnalyzeRequest(BaseModel):
    profile_id: str
    description: Optional[str] = None

class BulkAnalyzeRequest(BaseModel):
    profile_id: str
    job_ids: List[int]
