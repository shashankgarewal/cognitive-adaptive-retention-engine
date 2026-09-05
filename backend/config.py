"""
CARE - Application Configuration
Dynamic secret resolution: Google Cloud Secret Manager in production,
falling back to local environment variables during development.
"""

import os
from functools import lru_cache
from typing import Optional
from dotenv import load_dotenv

# Load local .env if present
load_dotenv()


class Settings:
    PROJECT_NAME: str = "CARE - Cognitive & Adaptive Retention Engine"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", os.getenv("GOOGLE_CLOUD_PROJECT", "gen-lang-client-0116634243"))
    FIRESTORE_DATABASE_ID: str = os.getenv(
        "FIRESTORE_DATABASE_ID",
        "ai-studio-aicuratedrecalls-32bbfc5d-7c54-46b3-883d-c9ead24e489f"
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
