
# app/api/v1/endpoints/scraper.py
from fastapi import APIRouter, Depends, HTTPException, Request
from app.core.security import get_current_user
from app.schemas.jobs import ScrapeRequest
import logging

router = APIRouter()
log = logging.getLogger(__name__)

@router.post("/trigger-scrape")
async def trigger_scrape(
    request: ScrapeRequest, 
    req: Request,
    user_id: str = Depends(get_current_user)
):
    redis = getattr(req.app.state, "redis", None)
    if not redis:
        raise HTTPException(status_code=503, detail="Job queue (Redis) is not connected.")
        
    log.info(f"API: Received scrape request for: '{request.search_term}' from User {user_id}")
    
    await redis.enqueue_job(
        "scrape_and_save", 
        request.model_dump(), 
        user_id, 
        request.search_id
    )
    return {"status": "ok", "message": "Scrape-and-save job enqueued."}
