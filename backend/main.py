"""
CARE - FastAPI Server Entry Point
Includes CORS middleware, API routers, and static file serving for Cloud Run.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.routers.auth import router as auth_router
from backend.routers.journal import router as journal_router
from backend.routers.recall import router as recall_router
from backend.routers.interview import router as interview_router
from backend.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Cognitive & Adaptive Retention Engine for Data Science professionals",
)

# -----------------------------------------------------------------------------
# CORS Middleware
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Strict origin allowed; '*' permitted during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# API Routers
# -----------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(journal_router)
app.include_router(recall_router)
app.include_router(interview_router)


@app.get("/api/health")
async def health_check():
    """Liveness probe for Cloud Run."""
    return {
        "status": "healthy",
        "service": "CARE Engine",
        "environment": settings.ENVIRONMENT,
        "databaseId": settings.FIRESTORE_DATABASE_ID,
        "vertexAi": settings.USE_VERTEX_AI,
        "gcpProject": settings.GCP_PROJECT_ID,
        "location": settings.GCP_LOCATION,
    }


# -----------------------------------------------------------------------------
# Static Frontend Serving (Cloud Run Unified Production Mode)
# -----------------------------------------------------------------------------
frontend_dist_path = os.path.join(os.getcwd(), "dist")

if os.path.exists(frontend_dist_path):
    # Mount assets folder
    assets_path = os.path.join(frontend_dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    # Serve index.html for client-side routing fallback
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not catch /api routes
        if full_path.startswith("api"):
            return {"error": "Not Found", "path": full_path}
        file_path = os.path.join(frontend_dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
