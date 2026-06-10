"""Authentication and authorization middleware decorators for Flask."""

import functools

from flask import request, jsonify, g

from utils.security import decode_access_token
from database.connection import get_db, close_db
from models.user import User


def token_required(f):
    """Decorator that validates JWT Bearer token and injects current_user.

    Extracts the Bearer token from the Authorization header, decodes it,
    loads the user from the database, and passes `current_user` as a
    keyword argument to the wrapped function.

    Returns 401 JSON response if the token is missing, invalid, or expired,
    or if the user no longer exists.
    """

    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        print(f"[DEBUG AUTH] Path: {request.path}, Method: {request.method}")
        print(f"[DEBUG AUTH] Auth Header: {auth_header}")

        if not auth_header:
            print("[DEBUG AUTH] Missing authorization header")
            return jsonify({"error": "Authorization header is missing"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            print("[DEBUG AUTH] Invalid authorization header format")
            return jsonify({"error": "Invalid authorization header format. Use: Bearer <token>"}), 401

        token = parts[1]

        try:
            payload = decode_access_token(token)
            print(f"[DEBUG AUTH] Token decoded successfully, payload sub: {payload.get('sub')}")
        except ValueError as e:
            print(f"[DEBUG AUTH] Token decoding failed: {e}")
            return jsonify({"error": str(e)}), 401

        user_id = payload.get("sub")
        if not user_id:
            print("[DEBUG AUTH] Token payload missing 'sub'")
            return jsonify({"error": "Invalid token payload"}), 401

        # Get or create a DB session for this request
        db = getattr(g, "_database", None)
        if db is None:
            db = get_db()
            g._database = db

        current_user = db.query(User).filter(User.id == user_id).first()
        if not current_user:
            print(f"[DEBUG AUTH] User not found for id {user_id}")
            return jsonify({"error": "User not found"}), 401

        print(f"[DEBUG AUTH] Authenticated user: {current_user.username} (Role: {current_user.role})")
        kwargs["current_user"] = current_user
        return f(*args, **kwargs)

    return decorated


def role_required(*roles):
    """Decorator factory that restricts access to specified user roles.

    Must be used AFTER the token_required decorator so that current_user
    is available in kwargs.

    Args:
        *roles: One or more role strings (e.g., 'Sender', 'Receiver').

    Returns 403 JSON response if the user's role is not in the allowed roles.

    Usage:
        @app.route('/example')
        @token_required
        @role_required('Receiver')
        def example(current_user):
            ...
    """

    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            current_user = kwargs.get("current_user")
            if not current_user:
                return jsonify({"error": "Authentication required"}), 401

            if current_user.role not in roles:
                return jsonify({
                    "error": f"Access denied. Required role(s): {', '.join(roles)}"
                }), 403

            return f(*args, **kwargs)

        return decorated

    return decorator
