"""Chat CRUD + SSE streaming."""
import json
import logging
import uuid
from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.core.deps import CurrentUser, DbSession
from app.db.session import AsyncSessionLocal
from app.schemas.chat import (
    ChatCreate,
    ChatDetailRead,
    ChatRead,
    MessageCreate,
    MessageRead,
)
from app.services import chat_service
from app.services.llm.gemini import ChatTurn, LLMError, stream_chat

router = APIRouter()
logger = logging.getLogger(__name__)


def _sse(event_type: str, data: dict) -> str:
    """SSE event line. ensure_ascii=False for Korean text."""
    payload = {"type": event_type, **data}
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


# ============================================================
# CRUD
# ============================================================


@router.get("", response_model=list[ChatRead])
async def list_chats(user: CurrentUser, db: DbSession) -> list[ChatRead]:
    chats = await chat_service.list_chats(db, user.id)
    return [ChatRead.model_validate(c) for c in chats]


@router.post("", response_model=ChatRead, status_code=status.HTTP_201_CREATED)
async def create_chat(
    payload: ChatCreate, user: CurrentUser, db: DbSession
) -> ChatRead:
    chat = await chat_service.create_chat(db, user.id, payload.title)
    return ChatRead.model_validate(chat)


@router.get("/{chat_id}", response_model=ChatDetailRead)
async def get_chat(
    chat_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> ChatDetailRead:
    try:
        chat = await chat_service.get_chat_owned(db, chat_id, user.id)
    except chat_service.ChatNotFound as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "채팅을 찾을 수 없습니다."
        ) from exc
    messages = await chat_service.get_messages(db, chat_id)
    return ChatDetailRead(
        id=chat.id,
        title=chat.title,
        model=chat.model,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        messages=[MessageRead.model_validate(m) for m in messages],
    )


@router.get("/{chat_id}/messages", response_model=list[MessageRead])
async def list_messages(
    chat_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> list[MessageRead]:
    try:
        await chat_service.get_chat_owned(db, chat_id, user.id)
    except chat_service.ChatNotFound as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "채팅을 찾을 수 없습니다."
        ) from exc
    messages = await chat_service.get_messages(db, chat_id)
    return [MessageRead.model_validate(m) for m in messages]


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> None:
    try:
        await chat_service.delete_chat(db, chat_id, user.id)
    except chat_service.ChatNotFound as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "채팅을 찾을 수 없습니다."
        ) from exc


# ============================================================
# SSE Streaming
# ============================================================


@router.post("/{chat_id}/messages/stream")
async def stream_message(
    chat_id: uuid.UUID,
    payload: MessageCreate,
    user: CurrentUser,
):
    """User 메시지를 받아 Gemini 응답을 SSE로 흘려보냄.

    Generator 내부에서 자체 세션 사용 — request 세션은 response 시작 후
    닫힐 수 있음. 스트리밍이 끝날 때까지 세션이 살아있어야 마지막 저장 가능.
    """
    content = payload.content.strip()
    if not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "메시지를 입력해주세요.")

    async def event_stream() -> AsyncIterator[str]:
        async with AsyncSessionLocal() as db:
            # 1) 소유권 확인
            try:
                chat = await chat_service.get_chat_owned(db, chat_id, user.id)
            except chat_service.ChatNotFound:
                yield _sse("error", {"message": "채팅을 찾을 수 없습니다."})
                return

            # 2) user 메시지 저장
            try:
                user_msg = await chat_service.add_message(
                    db, chat_id, "user", content
                )
            except Exception:
                logger.exception("Failed to save user message")
                yield _sse("error", {"message": "메시지 저장 중 오류가 발생했어요."})
                return

            yield _sse("user_saved", {"id": str(user_msg.id)})

            # 3) 히스토리 로드
            history = await chat_service.get_messages(db, chat_id)
            turns = [ChatTurn(role=m.role, content=m.content) for m in history]
            history_len = len(history)

            # 4) Gemini streaming
            full_response = ""
            try:
                async for token in stream_chat(turns):
                    full_response += token
                    yield _sse("token", {"text": token})
            except LLMError as exc:
                logger.warning("LLM error: %s", exc.__cause__ or exc, exc_info=True)
                yield _sse("error", {"message": str(exc)})
                return
            except Exception:
                logger.exception("Unexpected error during LLM streaming")
                yield _sse(
                    "error",
                    {"message": "AI 응답 중 알 수 없는 오류가 발생했어요."},
                )
                return

            if not full_response.strip():
                yield _sse("error", {"message": "AI가 빈 응답을 보냈어요."})
                return

            # 5) assistant 메시지 저장
            try:
                asst_msg = await chat_service.add_message(
                    db, chat_id, "assistant", full_response
                )
            except Exception:
                logger.exception("Failed to save assistant message")
                yield _sse("error", {"message": "응답 저장 중 오류가 발생했어요."})
                return

            # 6) 첫 대화면 title 갱신
            if history_len == 1:  # 방금 추가한 user 메시지만 있던 시점
                await chat_service.update_title_if_default(db, chat, content)

            yield _sse(
                "done",
                {"message_id": str(asst_msg.id), "chat_id": str(chat_id)},
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
