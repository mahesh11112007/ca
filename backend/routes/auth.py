"""Authentication routes Blueprint."""

from flask import Blueprint, request, jsonify, g

from schemas.validators import validate_register, validate_login
from services.auth_service import register_user, authenticate_user
from middleware.auth import token_required, role_required
from database.connection import get_db, close_db
from models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _get_db_session():
    """Get or create a DB session for the current request."""
    db = getattr(g, "_database", None)
    if db is None:
        db = get_db()
        g._database = db
    return db


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user account.

    Expects JSON body with: username, password, role.
    Returns JWT access token and user profile on success.
    """
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    cleaned, error = validate_register(data)
    if error:
        return jsonify({"error": error}), 400

    db = _get_db_session()
    response, status_code = register_user(db, cleaned)
    return jsonify(response), status_code


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate a user and return a JWT token.

    Expects JSON body with: username, password.
    Returns JWT access token and user profile on success.
    """
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    cleaned, error = validate_login(data)
    if error:
        return jsonify({"error": error}), 400

    db = _get_db_session()
    response, status_code = authenticate_user(db, cleaned)
    return jsonify(response), status_code


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me(current_user):
    """Get the current authenticated user's profile.

    Requires a valid JWT Bearer token in the Authorization header.
    """
    return jsonify({"user": current_user.to_dict()}), 200


@auth_bp.route("/qr", methods=["PUT"])
@token_required
@role_required("Receiver")
def upload_qr(current_user):
    """Upload a payment QR code (Base64)."""
    data = request.get_json(silent=True)
    if not data or "qr_code" not in data:
        return jsonify({"error": "Missing qr_code in body"}), 400

    db = _get_db_session()
    current_user.qr_code = data["qr_code"]
    db.commit()
    return jsonify({"message": "QR code updated successfully"}), 200


@auth_bp.route("/qr", methods=["GET"])
@token_required
def get_qr(current_user):
    """Get the active payment QR code from a Receiver."""
    db = _get_db_session()
    receiver = db.query(User).filter(User.role == "Receiver", User.qr_code.isnot(None)).first()
    
    qr_code = receiver.qr_code if receiver else None
    return jsonify({"qr_code": qr_code}), 200


@auth_bp.route("/vapid-public-key", methods=["GET"])
def get_vapid_public_key():
    """Get the VAPID Public Key for Web Push subscriptions."""
    from config.settings import get_settings
    settings = get_settings()
    return jsonify({"public_key": settings.VAPID_PUBLIC_KEY}), 200


@auth_bp.route("/subscribe", methods=["POST"])
@token_required
def subscribe(current_user):
    """Save the current user's Web Push subscription."""
    data = request.get_json(silent=True)
    if not data or "subscription" not in data:
        return jsonify({"error": "Missing subscription in request body"}), 400

    import json
    db = _get_db_session()
    
    # Store subscription as JSON string
    subscription_data = data["subscription"]
    if subscription_data is None:
        current_user.push_subscription = None
    else:
        current_user.push_subscription = json.dumps(subscription_data)

    db.commit()
    return jsonify({"message": "Web Push subscription saved successfully"}), 200
