"""Transaction routes Blueprint."""

from flask import Blueprint, request, jsonify, g

from schemas.validators import validate_transaction
from services.transaction_service import (
    create_transaction,
    get_transactions,
    get_transaction_by_id,
    approve_transaction,
    reject_transaction,
)
from middleware.auth import token_required, role_required
from database.connection import get_db

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")


def _get_db_session():
    """Get or create a DB session for the current request."""
    db = getattr(g, "_database", None)
    if db is None:
        db = get_db()
        g._database = db
    return db


@transactions_bp.route("", methods=["POST"])
@transactions_bp.route("/", methods=["POST"])
@token_required
@role_required("Sender")
def create(current_user):
    """Create a new transaction request.

    Only accessible by users with 'Sender' role.
    Expects JSON body with: amount (required), purpose (optional).
    """
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    cleaned, error = validate_transaction(data)
    if error:
        return jsonify({"error": error}), 400

    db = _get_db_session()
    response, status_code = create_transaction(db, current_user, cleaned)
    return jsonify(response), status_code


@transactions_bp.route("", methods=["GET"])
@transactions_bp.route("/", methods=["GET"])
@token_required
def list_transactions(current_user):
    """List transactions with optional filtering.

    Senders see only their own transactions. Receivers see all.
    Query params: status (Pending|Approved|Rejected), search (string).
    """
    status_filter = request.args.get("status")
    search = request.args.get("search")

    db = _get_db_session()
    response, status_code = get_transactions(
        db, current_user, status_filter=status_filter, search=search
    )
    return jsonify(response), status_code


@transactions_bp.route("/<transaction_id>", methods=["GET"])
@token_required
def get_single(current_user, transaction_id):
    """Get a single transaction by ID.

    Senders can only view their own. Receivers can view all.
    """
    db = _get_db_session()
    response, status_code = get_transaction_by_id(db, current_user, transaction_id)
    return jsonify(response), status_code


@transactions_bp.route("/<transaction_id>/approve", methods=["PATCH"])
@token_required
@role_required("Receiver")
def approve(current_user, transaction_id):
    """Approve a pending transaction.

    Only accessible by users with 'Receiver' role.
    Transaction must be in 'Pending' status.
    """
    db = _get_db_session()
    response, status_code = approve_transaction(db, current_user, transaction_id)
    return jsonify(response), status_code


@transactions_bp.route("/<transaction_id>/reject", methods=["PATCH"])
@token_required
@role_required("Receiver")
def reject(current_user, transaction_id):
    """Reject a pending transaction.

    Only accessible by users with 'Receiver' role.
    Transaction must be in 'Pending' status.
    """
    db = _get_db_session()
    response, status_code = reject_transaction(db, current_user, transaction_id)
    return jsonify(response), status_code
