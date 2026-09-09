"""Reset & seed the database manually:  python scripts/seed.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # backend root

from app.core.logging import configure_logging, get_logger  # noqa: E402
from app.database import seed  # noqa: E402
from app.database.connection import SessionLocal, init_db  # noqa: E402

configure_logging()


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        counts = seed.seed_all(db)
        logger = get_logger("seed")
        logger.info("Seed complete: %s", counts)
    finally:
        db.close()


if __name__ == "__main__":
    main()