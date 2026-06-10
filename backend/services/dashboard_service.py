"""Dashboard service providing aggregate statistics."""

from sqlalchemy import func

from models.transaction import Transaction


def get_dashboard_stats(db_session) -> dict:
    """Get aggregate dashboard statistics for all transactions.

    Args:
        db_session: SQLAlchemy database session.

    Returns:
        dict with total_requests, pending_requests, approved_requests,
        rejected_requests, and total_amount_approved.
    """
    # Total requests
    total_requests = db_session.query(func.count(Transaction.request_id)).scalar() or 0

    # Count by status
    pending_requests = (
        db_session.query(func.count(Transaction.request_id))
        .filter(Transaction.status == "Pending")
        .scalar()
        or 0
    )

    approved_requests = (
        db_session.query(func.count(Transaction.request_id))
        .filter(Transaction.status == "Approved")
        .scalar()
        or 0
    )

    rejected_requests = (
        db_session.query(func.count(Transaction.request_id))
        .filter(Transaction.status == "Rejected")
        .scalar()
        or 0
    )

    # Sum of approved amounts
    total_amount_approved = (
        db_session.query(
            func.coalesce(func.sum(Transaction.amount), 0)
        )
        .filter(Transaction.status == "Approved")
        .scalar()
    )

    return {
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "rejected_requests": rejected_requests,
        "total_amount_approved": float(total_amount_approved),
    }
