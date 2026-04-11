"""
auth_middleware.py — Firebase ID token verification.

Protects API routes so only authenticated users can call them.

Usage in any router:
    from auth_middleware import get_current_user

    @router.post("/url")
    async def analyze(request: URLRequest, user=Depends(get_current_user)):
        ...
"""

import os
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

# Initialise Firebase Admin SDK once
_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-service-account.json")
_cred_json  = os.getenv("FIREBASE_CREDENTIALS_JSON")

if not firebase_admin._apps:
    if _cred_json:
        import json
        cred = credentials.Certificate(json.loads(_cred_json))
    elif os.path.exists(_cred_path):
        cred = credentials.Certificate(_cred_path)
    else:
        # Allow running without Firebase in development (skip token check)
        cred = None

    if cred:
        firebase_admin.initialize_app(cred)

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    token: HTTPAuthorizationCredentials = Security(_bearer),
):
    """
    Dependency — extracts and verifies the Firebase ID token from
    the Authorization: Bearer <token> header.
    Returns the decoded token dict (contains uid, email, etc.).
    Raises 401 if missing or invalid.
    """
    # Dev mode: no Firebase app initialised → skip auth
    if not firebase_admin._apps:
        return {"uid": "dev-user", "email": "dev@localhost"}

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )
    try:
        decoded = firebase_auth.verify_id_token(token.credentials)
        return decoded
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
        )