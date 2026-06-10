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
