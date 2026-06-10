"""Transaction service handling CRUD and status transitions."""

from datetime import datetime, timezone

from sqlalchemy import cast, String
from sqlalchemy.orm import joinedload

from models.transaction import Transaction
from models.user import User
from models.audit_log import AuditLog


def create_transaction(db_session, sender, data: dict) -> tuple:
    """Create a new transaction request.

    Args:
        db_session: SQLAlchemy database session.
        sender: The User object of the sender creating the transaction.
        data: Validated dict with amount and optional purpose.

    Returns:
        tuple: (response_dict, status_code)
    """
    transaction = Transaction(
        sender_id=sender.id,
        amount=data["amount"],
        purpose=data.get("purpose"),
    )

    db_session.add(transaction)
    db_session.commit()
    db_session.refresh(transaction)

    # Ensure sender relationship is loaded for to_dict()
    if not transaction.sender:
        transaction.sender = sender

    return {"transaction": transaction.to_dict()}, 201


def get_transactions(db_session, user, status_filter=None, search=None) -> tuple:
    """Get transactions with optional filtering and search.

    Senders see only their own transactions. Receivers see all.

    Args:
        db_session: SQLAlchemy database session.
        user: The current User object.
        status_filter: Optional status string to filter by.
        search: Optional search string for username, purpose, or amount.

    Returns:
        tuple: (response_dict, status_code)
    """
    query = db_session.query(Transaction).options(
        joinedload(Transaction.sender)
    )

    # Role-based filtering
    if user.role == "Sender":
        query = query.filter(Transaction.sender_id == user.id)

    # Status filter
    if status_filter and status_filter in ("Pending", "Approved", "Rejected"):
        query = query.filter(Transaction.status == status_filter)

    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.join(Transaction.sender).filter(
            (User.username.ilike(search_term))
            | (Transaction.purpose.ilike(search_term))
            | (cast(Transaction.amount, String).ilike(search_term))
        )

    # Order by newest first
    query = query.order_by(Transaction.created_at.desc())

    transactions = query.all()

    return {
        "transactions": [t.to_dict() for t in transactions],
        "total": len(transactions),
    }, 200


def get_transaction_by_id(db_session, user, transaction_id: str) -> tuple:
    """Get a single transaction by ID.

    Senders can only view their own transactions. Receivers can view all.

    Args:
        db_session: SQLAlchemy database session.
        user: The current User object.
        transaction_id: The UUID string of the transaction.

    Returns:
        tuple: (response_dict, status_code)
    """
    transaction = (
        db_session.query(Transaction)
        .options(joinedload(Transaction.sender))
        .filter(Transaction.request_id == transaction_id)
        .first()
    )

    if not transaction:
        return {"error": "Transaction not found"}, 404

    # Access control: senders can only see their own transactions
    if user.role == "Sender" and transaction.sender_id != user.id:
        return {"error": "Transaction not found"}, 404

    return {"transaction": transaction.to_dict()}, 200


def approve_transaction(db_session, receiver, transaction_id: str) -> tuple:
    """Approve a pending transaction.

    Args:
        db_session: SQLAlchemy database session.
        receiver: The User object of the receiver approving the transaction.
        transaction_id: The UUID string of the transaction.

    Returns:
        tuple: (response_dict, status_code)
    """
    transaction = (
        db_session.query(Transaction)
        .options(joinedload(Transaction.sender))
        .filter(Transaction.request_id == transaction_id)
        .first()
    )

    if not transaction:
        return {"error": "Transaction not found"}, 404

    if transaction.status != "Pending":
        return {
            "error": f"Transaction cannot be approved. Current status: {transaction.status}"
        }, 400

    # Update status
    transaction.status = "Approved"
    transaction.updated_at = datetime.now(timezone.utc)

    # Create audit log
    audit_log = AuditLog(
        transaction_id=transaction.request_id,
        action="Approved",
        performed_by=receiver.id,
    )
    db_session.add(audit_log)
    db_session.commit()
    db_session.refresh(transaction)

    return {"transaction": transaction.to_dict()}, 200


def reject_transaction(db_session, receiver, transaction_id: str) -> tuple:
    """Reject a pending transaction.

    Args:
        db_session: SQLAlchemy database session.
        receiver: The User object of the receiver rejecting the transaction.
        transaction_id: The UUID string of the transaction.

    Returns:
        tuple: (response_dict, status_code)
    """
    transaction = (
        db_session.query(Transaction)
        .options(joinedload(Transaction.sender))
        .filter(Transaction.request_id == transaction_id)
        .first()
    )

    if not transaction:
        return {"error": "Transaction not found"}, 404

    if transaction.status != "Pending":
        return {
            "error": f"Transaction cannot be rejected. Current status: {transaction.status}"
        }, 400

    # Update status
    transaction.status = "Rejected"
    transaction.updated_at = datetime.now(timezone.utc)

    # Create audit log
    audit_log = AuditLog(
        transaction_id=transaction.request_id,
        action="Rejected",
        performed_by=receiver.id,
    )
    db_session.add(audit_log)
    db_session.commit()
    db_session.refresh(transaction)

    return {"transaction": transaction.to_dict()}, 200
