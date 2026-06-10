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

    # Sum of approved amounts by type
    approved_payments_sum = (
        db_session.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.status == "Approved", Transaction.type == "Payment")
        .scalar()
        or 0
    )

    approved_requests_sum = (
        db_session.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.status == "Approved", Transaction.type == "Request")
        .scalar()
        or 0
    )

    approved_debts_sum = (
        db_session.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.status == "Approved", Transaction.type == "Debt")
        .scalar()
        or 0
    )

    net_balance = float(approved_payments_sum - approved_requests_sum - approved_debts_sum)

    return {
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "rejected_requests": rejected_requests,
        "total_payments_approved": float(approved_payments_sum),
        "total_requests_approved": float(approved_requests_sum),
        "total_debts_approved": float(approved_debts_sum),
        "net_balance": net_balance,
    }
