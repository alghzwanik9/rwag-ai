from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import OUTPUTS_DIR, ASSETS_DIR, CORS_ORIGINS
from backend.app.api.routes import router
from backend.app.services.rag_service import get_retriever


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing global RAG Retriever...")
    get_retriever()
    print("RAG Retriever initialized successfully.")
    yield


app = FastAPI(title="Atelier AI Orchestrator", lifespan=lifespan)

# Static mounts
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# CORS setup
cors_origins = CORS_ORIGINS if CORS_ORIGINS else ["http://localhost:3000", "http://127.0.0.1:3000"]
allow_credentials = False if "*" in cors_origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)
