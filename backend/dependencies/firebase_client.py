"""
CARE - Firebase Admin & Firestore Client
Initializes the Firebase Admin SDK and scopes Firestore queries.
"""

import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from backend.config import settings

_firebase_app = None
_firestore_db = None


def get_firebase_app():
    global _firebase_app
    if _firebase_app is None:
        try:
            # Check for service account json or use default application credentials
            cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                _firebase_app = firebase_admin.initialize_app(cred, {
                    "projectId": settings.GCP_PROJECT_ID
                })
            else:
                # Default application credentials (Cloud Run / Google Cloud environment)
                _firebase_app = firebase_admin.initialize_app(options={
                    "projectId": settings.GCP_PROJECT_ID
                })
        except ValueError:
            # App already initialized
            _firebase_app = firebase_admin.get_app()
        except Exception as e:
            print(f"[Firebase Admin Init Warning]: {e}")
            try:
                _firebase_app = firebase_admin.get_app()
            except Exception:
                _firebase_app = None
    return _firebase_app


def get_firestore_client():
    global _firestore_db
    if _firestore_db is None:
        get_firebase_app()
        try:
            # Connect using specific firestore database ID
            _firestore_db = firestore.client(
                app=_firebase_app,
                database_id=settings.FIRESTORE_DATABASE_ID,
            )
        except Exception as e:
            print(f"[Firestore Client Fallback]: {e}")
            try:
                # Standard default database fallback
                _firestore_db = firestore.client(app=_firebase_app)
            except Exception as inner_e:
                print(f"[Firestore Connection Error]: {inner_e}")
                _firestore_db = None
    return _firestore_db
