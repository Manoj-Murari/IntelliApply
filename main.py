# main.py
from fastapi import FastAPI, HTTPException
from arq.connections import RedisSettings
from arq import create_pool
import logging
from pydantic import BaseModel, HttpUrl

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = FastAPI(
    title="IntelliApply API",
    description="The new unified backend for IntelliApply 2.0",
    version="2.0.0"
)

# Global ARQ pool
ARQ_REDIS = None

@app.on_event("startup")
async def startup():
    """
    On startup, create the connection pool to Redis.
    """
    global ARQ_REDIS
    log.info("Connecting to Arq/Redis at localhost:6379...")
    try:
        ARQ_REDIS = await create_pool(RedisSettings(host='127.0.0.1', port=6379))
        log.info("Successfully connected to Redis.")
    except Exception as e:
        log.error(f"Failed to connect to Redis: {e}")
        log.error("Make sure Redis is running. (e.g., via Docker)")

@app.on_event("shutdown")
async def shutdown():
    """
    On shutdown, close the connection pool.
    """
    if ARQ_REDIS:
        await ARQ_REDIS.close()
        log.info("Closed Redis connection pool.")

@app.get("/")
async def get_root():
    """
    Health check endpoint.
    """
    return {"status": "ok", "message": "IntelliApply API v2.0 is running."}

# --- Pydantic Model ---
# This defines the "shape" of the data we expect from the frontend
class ManualJobIn(BaseModel):
    title: str
    company: str
    job_url: HttpUrl # FastAPI will auto-validate this is a real URL
    description: str
class ScrapeRequest(BaseModel):
    search_term: str
    location: str
    hours_old: int = 24

# --- NEW ENDPOINT to trigger the scrape ---
@app.post("/api/v1/searches/trigger-scrape")
async def trigger_scrape(request: ScrapeRequest):
    """
    This endpoint triggers the 'scrape_and_fanout' job.
    """
    if not ARQ_REDIS:
        raise HTTPException(status_code=503, detail="Job queue (Redis) is not connected.")

    log.info(f"API: Received scrape request for: '{request.search_term}'")
    
    await ARQ_REDIS.enqueue_job(
        "scrape_and_fanout",   # The name of our new conductor job
        request.model_dump()   # Pass the search config
    )
    
    return {"status": "ok", "message": "Scrape job enqueued."}

@app.post("/test-job")
async def trigger_test_job():
    """
    This endpoint enqueues a new 'test_job' for the Arq worker.
    """
    if not ARQ_REDIS:
        raise HTTPException(status_code=503, detail="Job queue (Redis) is not connected.")

    log.info("API: Enqueuing test job...")
    job = await ARQ_REDIS.enqueue_job(
        "test_job",  # The name of the function in arq_worker.py
        "Hello from the API!" # The arguments to pass to the function
    )
    
    return {
        "status": "ok", 
        "message": "Job enqueued.", 
        "job_id": job.job_id
    }

@app.post("/api/v1/jobs/manual-analyze")
async def enqueue_manual_analysis(job: ManualJobIn):
    """
    This is the REAL endpoint.
    It receives a job from the frontend and enqueues it for analysis.
    """
    if not ARQ_REDIS:
        raise HTTPException(status_code=503, detail="Job queue (Redis) is not connected.")

    log.info(f"API: Received manual job for analysis: '{job.title}'")
    
    # Enqueue the job.
    # Note: We convert the Pydantic model to a dict for Arq.
    job_dict = job.model_dump()
    
    await ARQ_REDIS.enqueue_job(
        "analyze_and_save_job", # The Arq function name
        job_dict                  # The data to pass
    )
    
    return {"status": "ok", "message": "Job enqueued for analysis."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)