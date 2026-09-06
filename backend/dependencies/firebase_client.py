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
            target_project_id = settings.GCP_PROJECT_ID

            # Check candidate credential file paths or use default application credentials
            candidate_paths = [
                os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
                os.path.join(os.getcwd(), "care-recall-credentials.json"),
                os.path.join(os.getcwd(), "firebase-credentials.json"),
                os.path.join(os.getcwd(), "serviceAccountKey.json"),
            ]
            valid_cred_path = next((p for p in candidate_paths if p and os.path.exists(p)), None)

            if valid_cred_path:
                print(f"[Firebase Admin] Initializing with service account credentials: {valid_cred_path}")
                cred = credentials.Certificate(valid_cred_path)
                _firebase_app = firebase_admin.initialize_app(cred, {
                    "projectId": target_project_id
                })
            else:
                # Default application credentials (Cloud Run / Google Cloud environment)
                print(f"[Firebase Admin] Initializing with application default credentials for project: {target_project_id}")
                _firebase_app = firebase_admin.initialize_app(options={
                    "projectId": target_project_id
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
            # Connect using specific database ID or default
            db_id = settings.FIRESTORE_DATABASE_ID
            if db_id and db_id not in ("(default)", "default", ""):
                _firestore_db = firestore.client(
                    app=_firebase_app,
                    database_id=db_id,
                )
            else:
                _firestore_db = firestore.client(app=_firebase_app)
        except Exception as e:
            print(f"[Firestore Client Fallback]: {e}")
            try:
                # Standard default database fallback
                _firestore_db = firestore.client(app=_firebase_app)
            except Exception as inner_e:
                print(f"[Firestore Connection Error]: {inner_e}")
                _firestore_db = None
    return _firestore_db
