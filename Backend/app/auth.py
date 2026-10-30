import os
import hashlib
import hmac
import secrets
import base64
import json
import time
from typing import Optional
from fastapi import HTTPException, status, Header, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from .database import get_db

SECRET_KEY = os.getenv("FINANCEIQ_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("FINANCEIQ_SECRET_KEY is missing from environment variables.")


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """
    Cryptographic password hashing via PBKDF2-HMAC-SHA256 with 100,000 iterations.
    Generates a unique 16-byte random salt if not provided.
    """
    if not salt:
        salt = secrets.token_hex(16)
    
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    
    return pwd_hash, salt


def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """
    Verifies plain password against stored hash using constant-time comparison.
    """
    new_hash, _ = hash_password(plain_password, salt)
    return hmac.compare_digest(new_hash, hashed_password)


def create_access_token(user_data: dict, expires_in_seconds: int = 86400 * 7) -> str:
    """
    Generates an HMAC-SHA256 cryptographically signed session token.
    """
    payload = {
        "user_id": user_data.get("user_id"),
        "email": user_data.get("email"),
        "full_name": user_data.get("full_name"),
        "role": user_data.get("role", "user"),
        "exp": int(time.time()) + expires_in_seconds,
        "iat": int(time.time())
    }
    
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode('utf-8').rstrip('=')
    
    signature = hmac.new(
        SECRET_KEY.encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return f"{payload_b64}.{signature}"


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodes and verifies HMAC-SHA256 signed session token.
    """
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None
            
        payload_b64, signature = parts
        
        expected_sig = hmac.new(
            SECRET_KEY.encode('utf-8'),
            payload_b64.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_sig, signature):
            return None
            
        padding = len(payload_b64) % 4
        if padding:
            payload_b64 += '=' * (4 - padding)
            
        payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode('utf-8'))
        
        if payload.get("exp") and payload["exp"] < time.time():
            return None
            
        return payload
    except Exception:
        return None


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[dict]:
    """
    Optional authentication dependency: extracts user if valid token present,
    otherwise returns None without raising 401.
    """
    if not authorization:
        return None
        
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            return None
    except Exception:
        return None
        
    payload = decode_access_token(token)
    if not payload or not payload.get("user_id"):
        return None
        
    # Check user in DB
    result = db.execute(
        text("SELECT id, user_id, email, full_name, COALESCE(role, 'user') AS role FROM users WHERE user_id = :user_id"),
        {"user_id": payload["user_id"]}
    )
    row = result.fetchone()
    if not row:
        return None
        
    return {
        "id": row.id,
        "user_id": row.user_id,
        "email": row.email,
        "full_name": row.full_name,
        "role": row.role or "user"
    }


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> dict:
    """
    Strict authentication dependency: raises 401 if missing or invalid token.
    """
    user = get_current_user_optional(authorization, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Strict admin authorization dependency: raises 403 if user is not an admin.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privileges required."
        )
    return current_user
