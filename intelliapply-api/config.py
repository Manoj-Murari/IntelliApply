# config.py
import os
from dotenv import load_dotenv
import logging
from typing import Any, List, Optional

# Set up logging FIRST
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("❌ GEMINI_API_KEY not found in .env file!")

# Set GOOGLE_API_KEY for LiteLLM
os.environ['GOOGLE_API_KEY'] = GEMINI_API_KEY
log.info("✅ GOOGLE_API_KEY set from GEMINI_API_KEY")

# Import after setting env vars
import google.generativeai as genai
from supabase import create_client, Client
from pydantic import Field
from langchain_core.language_models.llms import LLM
from langchain_core.callbacks.manager import CallbackManagerForLLMRun
import litellm

# Configure LiteLLM to suppress verbose logs
litellm.suppress_debug_info = True

# --- Custom LLM Wrapper for CrewAI ---
class GeminiLLM(LLM):
    """Custom LLM wrapper using LiteLLM for Gemini"""
    
    model: str = Field(default="gemini/gemini-2.5-flash")
    temperature: float = Field(default=0.7)
    max_tokens: int = Field(default=4096)
    
    @property
    def _llm_type(self) -> str:
        return "gemini"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Call the Gemini API via LiteLLM"""
        try:
            response = litellm.completion(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                api_key=os.getenv("GOOGLE_API_KEY")
            )
            return response.choices[0].message.content
        except Exception as e:
            log.error(f"LiteLLM call failed: {e}")
            raise

# --- Supabase Client ---
SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
supabase: Client = None

if not SUPABASE_URL or not SUPABASE_KEY:
    log.warning("⚠️ Supabase URL/Key not found. Database functions will be disabled.")
else:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    log.info("✅ Supabase client initialized.")

# --- Gemini Client ---
gemini_model = None
crew_llm = None

# Configure google-generativeai (direct SDK - for non-CrewAI usage)
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('models/gemini-2.5-flash')
log.info("✅ Gemini SDK client initialized: models/gemini-2.5-flash")

# Configure custom LLM for CrewAI using LiteLLM
crew_llm = GeminiLLM(
    model="gemini/gemini-2.5-flash",
    temperature=0.7,
    max_tokens=4096
)
log.info("✅ CrewAI LLM initialized with LiteLLM: gemini/gemini-2.5-flash")
log.info(f"🔍 Crew LLM type: {crew_llm._llm_type}, model: {crew_llm.model}")

def is_ready():
    return supabase is not None and gemini_model is not None and crew_llm is not None