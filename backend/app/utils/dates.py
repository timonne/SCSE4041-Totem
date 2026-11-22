from datetime import datetime, timezone


def utc_now() -> datetime:
    """Returns naive UTC datetime for seamless SQLite / SQLAlchemy compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
