import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from database.connection import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False,
    )
    transaction_id = Column(
        String(36),
        ForeignKey("transactions.request_id"),
        nullable=False,
        index=True,
    )
    action = Column(String(50), nullable=False)
    performed_by = Column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
    )
    performed_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    transaction = relationship("Transaction", back_populates="audit_logs")
    performer = relationship(
        "User",
        back_populates="audit_logs",
        foreign_keys=[performed_by],
    )

    # __table_args__ = (
    #     Index("ix_audit_logs_transaction_id", "transaction_id"),
    # )

    def to_dict(self):
        """Return a JSON-serializable dictionary representation."""
        return {
            "id": str(self.id),
            "transaction_id": str(self.transaction_id),
            "action": self.action,
            "performed_by": str(self.performed_by),
            "performer_username": (
                self.performer.username if self.performer else None
            ),
            "performed_at": (
                self.performed_at.isoformat() if self.performed_at else None
            ),
        }

    def __repr__(self):
        return (
            f"<AuditLog(id={self.id}, action={self.action}, "
            f"transaction_id={self.transaction_id})>"
        )
