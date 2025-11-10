# config.py
import os
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

log = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# --- Supabase Client ---
SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
supabase: Client = None

if not SUPABASE_URL or not SUPABASE_KEY:
    log.warning("Supabase URL/Key not found. Database functions will be disabled.")
else:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    log.info("Supabase client initialized.")

# --- Gemini Client ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None

if not GEMINI_API_KEY:
    log.warning("Gemini API Key not found. AI functions will be disabled.")
else:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    log.info("Gemini client initialized.")

# --- Helper to check readiness ---
def is_ready():
    return supabase is not None and gemini_model is not None