import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, CheckConstraint, Index
from sqlalchemy.orm import relationship

from database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False,
    )
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    qr_code = Column(Text, nullable=True)
    push_subscription = Column(Text, nullable=True)

    # Relationships
    transactions = relationship(
        "Transaction", back_populates="sender", lazy="dynamic"
    )
    audit_logs = relationship(
        "AuditLog",
        back_populates="performer",
        foreign_keys="AuditLog.performed_by",
        lazy="dynamic",
    )

    __table_args__ = (
        CheckConstraint(
            "role IN ('Sender', 'Receiver')",
            name="ck_users_role",
        ),
    )

    def to_dict(self):
        """Return a JSON-serializable dictionary representation."""
        return {
            "id": str(self.id),
            "username": self.username,
            "role": self.role,
            "qr_code": self.qr_code,
            "push_subscription": self.push_subscription,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"
