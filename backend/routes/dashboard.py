"""Dashboard routes Blueprint."""

from flask import Blueprint, jsonify, g

from services.dashboard_service import get_dashboard_stats
from middleware.auth import token_required, role_required
from database.connection import get_db

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


def _get_db_session():
    """Get or create a DB session for the current request."""
    db = getattr(g, "_database", None)
    if db is None:
        db = get_db()
        g._database = db
    return db


@dashboard_bp.route("/stats", methods=["GET"])
@token_required
@role_required("Sender", "Receiver")
def stats(current_user):
    """Get aggregate dashboard statistics.

    Only accessible by users with 'Receiver' role.
    Returns total, pending, approved, rejected counts and total approved amount.
    """
    db = _get_db_session()
    result = get_dashboard_stats(db)
    return jsonify(result), 200
