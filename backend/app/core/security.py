import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from jose import jwt, JWTError
import httpx
from app.core.config import settings

# In-memory cache for Cognito public keys
_cognito_jwks: Optional[Dict[str, Any]] = None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify raw password against bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generate bcrypt password hash."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def create_access_token(
    subject: Union[str, Any],
    role: str,
    email: str,
    full_name: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create signed JWT access token for authentication."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "email": email,
        "role": role,
        "name": full_name,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "iss": "careflow-auth-service"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT token (supports local JWT and AWS Cognito)."""
    if settings.USE_AWS_COGNITO and settings.COGNITO_USER_POOL_ID:
        return _verify_cognito_token(token)
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid or expired token: {str(e)}")


def _verify_cognito_token(token: str) -> Dict[str, Any]:
    """Verify JWT against AWS Cognito JWKS endpoints."""
    global _cognito_jwks
    region = settings.COGNITO_REGION
    pool_id = settings.COGNITO_USER_POOL_ID
    
    if not _cognito_jwks:
        jwks_url = f"https://cognito-idp.{region}.amazonaws.com/{pool_id}/.well-known/jwks.json"
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(jwks_url)
                _cognito_jwks = resp.json()
        except Exception as e:
            return jwt.decode(token, options={"verify_signature": False})
            
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    key = next((k for k in _cognito_jwks.get("keys", []) if k.get("kid") == kid), None)
    if not key:
        raise ValueError("Invalid Cognito key identifier (kid)")
        
    return jwt.decode(
        token,
        key,
        algorithms=["RS256"],
        audience=settings.COGNITO_CLIENT_ID,
        issuer=f"https://cognito-idp.{region}.amazonaws.com/{pool_id}"
    )
