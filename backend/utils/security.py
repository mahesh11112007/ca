"""Security utilities for password hashing and JWT token management."""

from datetime import datetime, timedelta, timezone

from werkzeug.security import generate_password_hash, check_password_hash
from jose import jwt, JWTError, ExpiredSignatureError

from config.settings import get_settings


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt.

    Args:
        password: The plaintext password to hash.

    Returns:
        The hashed password string.
    """
    return generate_password_hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a hashed password.

    Args:
        plain: The plaintext password to verify.
        hashed: The hashed password to compare against.

    Returns:
        True if the password matches, False otherwise.
    """
    return check_password_hash(hashed, plain)


def create_access_token(data: dict) -> str:
    """Create a JWT access token.

    Args:
        data: Dictionary containing claims to encode. Must include 'sub' key.

    Returns:
        Encoded JWT token string.
    """
    settings = get_settings()
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_EXPIRATION_MINUTES
    )
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token.

    Args:
        token: The JWT token string to decode.

    Returns:
        The decoded payload dictionary.

    Raises:
        ValueError: If the token is invalid or expired.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except ExpiredSignatureError:
        raise ValueError("Token has expired")
    except JWTError:
        raise ValueError("Invalid token")
