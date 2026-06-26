from database.connection import Base, engine


def init_db():
    """Initialize the database by creating all tables.

    Imports all models to ensure they are registered with Base.metadata
    before calling create_all.
    """
    # Import all models so they register with Base.metadata
    import models.user  # noqa: F401
    import models.transaction  # noqa: F401
    import models.audit_log  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # SQLite/Postgres local schema migration check for 'type' column and 'upi_link' column
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('transactions')]
        if 'type' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE transactions ADD COLUMN type VARCHAR(20) DEFAULT 'Payment' NOT NULL"))
                print("Database Migration: Added 'type' column to 'transactions' table.")
        
        columns_users = [col['name'] for col in inspector.get_columns('users')]
        if 'upi_link' not in columns_users:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN upi_link TEXT"))
                print("Database Migration: Added 'upi_link' column to 'users' table.")
    except Exception as e:
        print(f"Skipped database migration check: {e}")
