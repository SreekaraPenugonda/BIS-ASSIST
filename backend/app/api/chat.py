import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_optional_user
from app.database.connection import SessionLocal, get_db
from app.models.chat import Conversation, Message
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, StructuredAnswer
from app.services.chat_service import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


def _resolve_conversation(db: Session, user: User | None, conversation_id: int | None, language: str) -> Conversation:
    if conversation_id:
        conv = db.get(Conversation, conversation_id)
        if conv is not None:
            return conv
    conv = Conversation(user_id=user.id if user else None, language=language)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def _persist(db: Session, user: User | None, payload: ChatRequest, structured: StructuredAnswer, mode: str) -> Conversation:
    conv = _resolve_conversation(db, user, payload.conversation_id, payload.language)
    db.add(
        Message(conversation_id=conv.id, role="user", content=payload.message, language=payload.language)
    )
    db.add(
        Message(
            conversation_id=conv.id,
            role="assistant",
            content=structured.answer,
            sources=json.dumps([s.model_dump() for s in structured.sources], ensure_ascii=False),
            intent=structured.intent,
            language=payload.language,
            response_mode=mode,
            confidence=structured.confidence,
        )
    )
    conv.language = payload.language
    db.commit()
    return conv


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest):
    result = chat_service.process(
        payload.message, payload.language, [t.model_dump() for t in payload.history]
    )
    structured = StructuredAnswer.model_validate(result["structured"])
    return ChatResponse(
        conversation_id=payload.conversation_id or 0,
        user_message=payload.message,
        response_mode=result["mode"],
        language=payload.language,
        structured=structured,
        created_at=datetime.now(timezone.utc),
    )


@router.post("/stream")
def chat_stream(payload: ChatRequest, user: User | None = Depends(get_optional_user)):
    async def event_source():
        final = None
        async for event in chat_service.stream(
            payload.message, payload.language, [t.model_dump() for t in payload.history]
        ):
            stream_out = {
                "type": event["type"],
                "content": event.get("content"),
                "meta": event.get("meta"),
            }
            yield f"data: {json.dumps(stream_out, ensure_ascii=False)}\n\n"
            if event["type"] == "meta":
                final = event.get("meta")
        # persist after streaming completes (fresh session, outlives request scope)
        if final is not None:
            db = SessionLocal()
            try:
                structured = StructuredAnswer.model_validate(final)
                _persist(db, user, payload, structured, "ai" if "simulation" not in (final.get("disclaimer") or "") else "simulation")
            finally:
                db.close()
        yield "data: {\"type\": \"close\"}\n\n"

    return StreamingResponse(event_source(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})