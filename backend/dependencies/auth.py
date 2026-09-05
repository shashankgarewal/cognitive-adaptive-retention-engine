"""
SynapseDS - Firebase Auth Token Verification Dependency
Extracts and validates Firebase JWT tokens to enforce user isolation.
"""

from typing import Dict, Any, Optional
from fastapi import Header, HTTPException, status, Depends
from firebase_admin import auth
from backend.dependencies.firebase_client import get_firebase_app


async def verify_firebase_token(
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    FastAPI dependency that parses and validates the Firebase ID token
    from the HTTP Authorization header (format: 'Bearer <token>').
    Returns the decoded token claims containing uid, email, etc.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    id_token = parts[1]

    try:
        # Ensure Firebase app is initialized
        get_firebase_app()
        # Verify the ID token using Firebase Admin
        decoded_token = auth.verify_id_token(id_token, check_revoked=True)
        uid = decoded_token.get("uid")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain a valid user identifier (uid)",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return decoded_token
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.InvalidIdTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Catch unexpected verification exceptions
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication verification failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
