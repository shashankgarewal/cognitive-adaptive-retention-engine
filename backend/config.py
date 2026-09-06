"""
CARE - Application Configuration
Dynamic secret resolution: Google Cloud Secret Manager in production,
falling back to local environment variables during development.
"""

import os
import json
from functools import lru_cache
from typing import Optional
from dotenv import load_dotenv

# Load local .env if present
load_dotenv()

# Read authoritative firebase-applet-config.json if available
firebase_applet_config = {}
config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase-applet-config.json")
if os.path.exists(config_path):
    try:
        with open(config_path, "r") as f:
            firebase_applet_config = json.load(f)
    except Exception:
        pass


class Settings:
    PROJECT_NAME: str = "CARE - Cognitive & Adaptive Retention Engine"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    USE_VERTEX_AI: bool = os.getenv("USE_VERTEX_AI", "true").lower() in ("true", "1", "yes")
    GCP_PROJECT_ID: str = os.getenv(
        "GCP_PROJECT_ID",
        firebase_applet_config.get("projectId", "care-recall")
    )
    GCP_LOCATION: str = os.getenv("GCP_LOCATION", "us-central1")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    FALLBACK_MODELS: list = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-3.8-flash"]
    FIRESTORE_DATABASE_ID: str = os.getenv(
        "FIRESTORE_DATABASE_ID",
        firebase_applet_config.get(
            "firestoreDatabaseId",
            "(default)"
        )
    )
    PORT: int = int(os.getenv("PORT", "3000"))

    @classmethod
    def is_production(cls) -> bool:
        return cls.ENVIRONMENT.lower() == "production"


@lru_cache()
def get_gemini_api_key() -> str:
    """
    Fetches the Gemini API key securely:
    - Production: Accesses Google Cloud Secret Manager.
    - Development/Preview: Resolves from local environment variables.
    """
    if Settings.is_production():
        try:
            from google.cloud import secretmanager
            client = secretmanager.SecretManagerServiceClient()
            secret_name = f"projects/{Settings.GCP_PROJECT_ID}/secrets/GEMINI_API_KEY/versions/latest"
            response = client.access_secret_version(request={"name": secret_name})
            key = response.payload.data.decode("UTF-8").strip()
            if key:
                return key
        except Exception as e:
            # Fallback to local env var if Secret Manager lookup fails
            print(f"[WARN] Secret Manager lookup failed ({e}); checking fallback env var.")

    key = os.getenv("GEMINI_API_KEY", "")
    return key.strip()


settings = Settings()
