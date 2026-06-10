"""Authentication service handling user registration and login."""

from models.user import User
from utils.security import hash_password, verify_password, create_access_token


def register_user(db_session, data: dict) -> tuple:
    """Register a new user.

    Args:
        db_session: SQLAlchemy database session.
        data: Validated dict with username, password, role.

    Returns:
        tuple: (response_dict, status_code)
    """
    # Check for duplicate username
    existing_user = (
        db_session.query(User)
        .filter(User.username == data["username"])
        .first()
    )
    if existing_user:
        return {"error": "Username already exists"}, 409

    # Only one Receiver is allowed in the system
    if data["role"] == "Receiver":
        existing_receiver = (
            db_session.query(User)
            .filter(User.role == "Receiver")
            .first()
        )
        if existing_receiver:
            return {"error": "Only one Receiver is permitted in the system. Registration as Receiver is blocked."}, 400

    # Create new user
    user = User(
        username=data["username"],
        password_hash=hash_password(data["password"]),
        role=data["role"],
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Generate JWT token
    access_token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_dict(),
    }, 201


def authenticate_user(db_session, data: dict) -> tuple:
    """Authenticate a user by username and password.

    Args:
        db_session: SQLAlchemy database session.
        data: Validated dict with username, password.

    Returns:
        tuple: (response_dict, status_code)
    """
    user = (
        db_session.query(User)
        .filter(User.username == data["username"])
        .first()
    )

    if not user:
        return {"error": "Invalid username or password"}, 401

    if not verify_password(data["password"], user.password_hash):
        return {"error": "Invalid username or password"}, 401

    # Generate JWT token
    access_token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_dict(),
    }, 200
