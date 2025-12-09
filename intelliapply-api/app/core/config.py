
# app/core/config.py
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
    # Use warning instead of raise to allow CI/Test execution without real keys
    log.warning("❌ GEMINI_API_KEY not found in .env file!")
else:
    # Set GOOGLE_API_KEY for LiteLLM
    os.environ['GOOGLE_API_KEY'] = GEMINI_API_KEY
    log.info("✅ GOOGLE_API_KEY set from GEMINI_API_KEY")

# Import after setting env vars
import google.generativeai as genai
from supabase import create_client, Client
from pydantic import Field
try:
    from langchain_core.language_models.llms import LLM
    from langchain_core.callbacks.manager import CallbackManagerForLLMRun
    import litellm
except ImportError:
    log.error("Failed to import langchain/litellm dependencies. AI features may fail.")
    LLM = object # Mock

# Configure LiteLLM to suppress verbose logs
try:
    litellm.suppress_debug_info = True
except:
    pass

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
                **kwargs
            )
            return response.choices[0].message.content
        except Exception as e:
            raise ValueError(f"LiteLLM call failed: {e}")

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Optional[Client] = None
if not SUPABASE_URL or not SUPABASE_KEY:
    log.warning("⚠️ SUPABASE_URL or SUPABASE_KEY not found. Database features will fail.")
else:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        log.info("✅ Supabase client initialized")
    except Exception as e:
        log.error(f"❌ Failed to initialize Supabase: {e}")

# Configure google-generativeai (direct SDK - for non-CrewAI usage)
gemini_model = None
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('models/gemini-2.5-flash')
        log.info("✅ Gemini SDK client initialized: models/gemini-2.5-flash")
    except Exception as e:
        log.error(f"Failed to init Gemini SDK: {e}")

# Configure custom LLM for CrewAI using LiteLLM
crew_llm = None
try:
    crew_llm = GeminiLLM(
        model="gemini/gemini-2.5-flash",
        temperature=0.7,
        max_tokens=4096
    )
    log.info("✅ CrewAI LLM initialized with LiteLLM: gemini/gemini-2.5-flash")
except Exception as e:
    log.error(f"Failed to init CrewAI LLM: {e}")

def is_ready():
    return supabase is not None and gemini_model is not None and crew_llm is not None
