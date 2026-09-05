"""
SynapseDS - Authentication & User Profile Router
Provides user provisioning and profile synchronization under /users/{userId}.
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from backend.dependencies.auth import verify_firebase_token
from backend.dependencies.firebase_client import get_firestore_client
from backend.models.schemas import (
    UserProfile,
    UserStats,
    UserPreferences,
    SyncUserRequest,
    UserAuthResponse,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.get("/me", response_model=UserAuthResponse)
async def get_current_user_profile(
    user_claims: dict = Depends(verify_firebase_token),
):
    """
    Validates token, verifies or provisions the user profile in Firestore under /users/{userId},
    and returns current stats and preferences.
    """
    uid = user_claims.get("uid")
    email = user_claims.get("email", "")
    display_name = user_claims.get("name")
    photo_url = user_claims.get("picture")
    sign_in_provider = user_claims.get("firebase", {}).get("sign_in_provider", "google.com")

    db = get_firestore_client()
    if db is None:
        # Fallback profile in memory if firestore admin is unavailable
        profile = UserProfile(
            uid=uid,
            email=email,
            displayName=display_name,
            photoURL=photo_url,
            authProvider=sign_in_provider,
        )
        return UserAuthResponse(status="ok", user=profile, isNewUser=False)

    user_doc_ref = db.collection("users").document(uid)
    doc_snapshot = user_doc_ref.get()

    if not doc_snapshot.exists:
        # First-time provisioning
        new_profile = UserProfile(
            uid=uid,
            email=email,
            displayName=display_name,
            photoURL=photo_url,
            authProvider=sign_in_provider,
            createdAt=datetime.utcnow().isoformat(),
            updatedAt=datetime.utcnow().isoformat(),
            stats=UserStats(),
            preferences=UserPreferences(),
        )
        # Mandated Firestore Payload Hygiene: exclude_none=True
        payload = new_profile.to_firestore_dict()
        user_doc_ref.set(payload)
        return UserAuthResponse(status="ok", user=new_profile, isNewUser=True)

    # Document exists, load and return
    data = doc_snapshot.to_dict()
    profile = UserProfile(**data)
    return UserAuthResponse(status="ok", user=profile, isNewUser=False)


@router.post("/sync", response_model=UserAuthResponse)
async def sync_user_profile(
    req: SyncUserRequest,
    user_claims: dict = Depends(verify_firebase_token),
):
    """
    Updates mutable user profile attributes (e.g. display name or photo).
    """
    uid = user_claims.get("uid")
    db = get_firestore_client()

    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service currently unavailable",
        )

    user_doc_ref = db.collection("users").document(uid)
    doc_snapshot = user_doc_ref.get()

    if not doc_snapshot.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Please invoke /api/auth/me first.",
        )

    data = doc_snapshot.to_dict()
    current_profile = UserProfile(**data)

    if req.displayName is not None:
        current_profile.displayName = req.displayName
    if req.photoURL is not None:
        current_profile.photoURL = req.photoURL
    current_profile.updatedAt = datetime.utcnow().isoformat()

    # Mandated Firestore Payload Hygiene
    user_doc_ref.set(current_profile.to_firestore_dict(), merge=True)

    return UserAuthResponse(status="ok", user=current_profile, isNewUser=False)
