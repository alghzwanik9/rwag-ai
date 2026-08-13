from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import OUTPUTS_DIR, ASSETS_DIR, CORS_ORIGINS
from backend.app.api.routes import router
from backend.app.services.rag_service import get_retriever

app = FastAPI(title="Atelier AI Orchestrator")

# Static mounts
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    print("Initializing global RAG Retriever...")
    get_retriever()
    print("RAG Retriever initialized successfully.")

# Include API routes
app.include_router(router)
