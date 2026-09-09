"""Idempotent seed: demo users, standards table, sample documents, demo apps."""
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.data.knowledge_base import STANDARDS
from app.data.sample_documents import SAMPLE_DOCUMENTS
from app.models.application import Application
from app.models.chat import Conversation, Message
from app.models.document import Document, DocumentChunk
from app.models.standard import Standard
from app.models.user import User

DEMO_USERS = [
    ("Consumer User", "consumer@bis.ai", "consumer123", "consumer"),
    ("MSME User", "msme@bis.ai", "msme123", "msme"),
    ("Admin User", "admin@bis.ai", "admin123", "admin"),
]


def seed_all(db: Session) -> dict:
    counts = {"users": 0, "standards": 0, "documents": 0, "chunks": 0, "applications": 0}

    for name, email, password, role in DEMO_USERS:
        if db.query(User).filter(User.email == email).first() is None:
            db.add(User(name=name, email=email, password_hash=hash_password(password), role=role))
            counts["users"] += 1

    for std in STANDARDS:
        if db.query(Standard).filter(Standard.is_number == std["is_number"]).first() is None:
            db.add(
                Standard(
                    is_number=std["is_number"],
                    title=std["title"],
                    product_category=std["product_category"],
                    description=std["description"],
                    scope=std["scope"],
                    requirements="\n".join(std["requirements"]),
                    keywords=std["keywords"],
                    status=std["status"],
                    is_mandatory=std["is_mandatory"],
                    published_date=std["published_date"],
                )
            )
            counts["standards"] += 1

    document_cache: dict[str, Document] = {}
    for doc in SAMPLE_DOCUMENTS:
        existing = db.query(Document).filter(Document.filename == doc["filename"]).first()
        if existing is not None:
            document_cache[doc["filename"]] = existing
            continue
        row = Document(filename=doc["filename"], document_type=doc["document_type"], chunk_count=len(doc["sections"]))
        db.add(row)
        db.flush()
        document_cache[doc["filename"]] = row
        counts["documents"] += 1
        for section in doc["sections"]:
            content = str(section["content"])
            db.add(
                DocumentChunk(
                    document_id=row.id,
                    page_number=section.get("page", 1),
                    section=section.get("section", ""),
                    content=content,
                    token_count=len(content.split()),
                )
            )
            counts["chunks"] += 1

    msme = db.query(User).filter(User.email == "msme@bis.ai").first()
    if msme is not None and db.query(Application).filter(Application.user_id == msme.id).count() == 0:
        db.add_all(
            [
                Application(
                    application_number="BIS-2026-100234",
                    user_id=msme.id,
                    product_name="Electric Kettle 1.75L",
                    category="Electrical & Electronics",
                    is_number="IS 302 (Part 2-15):2018",
                    standard_title="Safety of Household Electrical Appliances — Heating Appliances for Liquids",
                    status="Under Review",
                    notes="Samples dispatched for testing at a BIS-recognised laboratory.",
                ),
                Application(
                    application_number="BIS-2026-100235",
                    user_id=msme.id,
                    product_name="LED Bulb (A19)",
                    category="Lighting Products (LED)",
                    is_number="IS 16102:2013",
                    standard_title="LED Luminaires — Performance Requirements",
                    status="Submitted",
                    notes="Complete application awaiting review by the scheme officer.",
                ),
            ]
        )
        counts["applications"] += 1

    if db.query(Conversation).count() == 0:
        consumer = db.query(User).filter(User.email == "consumer@bis.ai").first()
        conv = Conversation(user_id=consumer.id if consumer else None, language="en", topic="Welcome")
        db.add(conv)
        db.flush()
        db.add_all(
            [
                Message(conversation_id=conv.id, role="user", content="Hello! What can you help me with?"),
                Message(
                    conversation_id=conv.id,
                    role="assistant",
                    content="Namaste! I am the BIS AI Standards Assistant...",
                    response_mode="simulation",
                ),
            ]
        )

    db.commit()
    return counts