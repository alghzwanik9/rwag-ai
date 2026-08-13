import os
from pathlib import Path
from dotenv import load_dotenv

# Root directory of the repository
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env file from root
dotenv_path = BASE_DIR / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path)

# Static & DB directories
OUTPUTS_DIR = BASE_DIR / "frontend" / "public" / "outputs"
ASSETS_DIR = BASE_DIR / "frontend" / "public" / "assets"
LANCEDB_DIR = BASE_DIR / ".lancedb"

# Ensure required directories exist
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
ASSETS_DIR.mkdir(parents=True, exist_ok=True)
LANCEDB_DIR.mkdir(parents=True, exist_ok=True)

# Environment variables
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()]
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
FAL_KEY = os.getenv("FAL_KEY", "")
