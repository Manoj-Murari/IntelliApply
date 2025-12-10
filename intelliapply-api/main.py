
# main.py (Unified Entrypoint)
import logging
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from arq import create_pool
from arq.connections import RedisSettings
import os

from app.core.config import is_ready
from app.api.v1.router import api_router

# --- Logging ---
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# --- Lifespan Manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Connect to Redis (Shared with worker)
    redis_url = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379')
    log.info(f"Connecting to Redis at {redis_url}...")
    
    try:
        # Create pool and store in app.state for endpoints to use
        app.state.redis = await create_pool(RedisSettings.from_dsn(redis_url))
        log.info("✅ Redis connected (Job Queue Ready).")
    except Exception as e:
        log.error(f"❌ Failed to connect to Redis: {e}")
        # We don't raise here to allow the app to start even if Queue is down (it will error 503 on use)
        app.state.redis = None

    # 2. Check Core Config
    if not is_ready():
        log.warning("⚠️ App is starting but some AI/DB keys are missing. Check .env")

    yield
    
    # 3. Cleanup
    log.info("Shutting down...")
    if getattr(app.state, "redis", None):
        await app.state.redis.close()
    log.info("Redis connection closed.")

# --- Create App ---
app = FastAPI(
    title="IntelliApply API",
    description="Unified Backend for IntelliApply 2.0 (Refactored)",
    version="2.1.0",
    lifespan=lifespan
)

# --- CORS ---
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://ai-job-scraper-zeta.vercel.app",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev/extension
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# --- Routes ---
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def get_root():
    return {
        "status": "ok", 
        "message": "IntelliApply API v2.1 (Refactored) is running.",
        "redis_connected": bool(getattr(app.state, "redis", None))
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)