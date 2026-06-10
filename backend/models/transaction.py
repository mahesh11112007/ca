import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    Numeric,
    ForeignKey,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import relationship

from database.connection import Base


class Transaction(Base):
    __tablename__ = "transactions"

    request_id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False,
    )
    sender_id = Column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    amount = Column(Numeric(12, 2), nullable=False)
    purpose = Column(Text, nullable=True)
    status = Column(String(20), default="Pending", nullable=False, index=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    sender = relationship("User", back_populates="transactions", lazy="joined")
    audit_logs = relationship(
        "AuditLog", back_populates="transaction", lazy="dynamic"
    )

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_transactions_amount_positive"),
        CheckConstraint(
            "status IN ('Pending', 'Approved', 'Rejected')",
            name="ck_transactions_status",
        ),
    )

    def to_dict(self):
        """Return a JSON-serializable dictionary representation."""
        return {
            "request_id": str(self.request_id),
            "sender_id": str(self.sender_id),
            "sender_username": self.sender.username if self.sender else None,
            "amount": float(self.amount) if self.amount is not None else None,
            "purpose": self.purpose,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return (
            f"<Transaction(request_id={self.request_id}, "
            f"amount={self.amount}, status={self.status})>"
        )
