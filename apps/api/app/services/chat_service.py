"""Chat / Message business logic."""
import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.chat import Chat
from app.db.models.message import Message


class ChatError(Exception):
    pass


class ChatNotFound(ChatError):
    pass


async def list_chats(db: AsyncSession, user_id: uuid.UUID) -> list[Chat]:
    result = await db.scalars(
        select(Chat).where(Chat.user_id == user_id).order_by(desc(Chat.updated_at))
    )
    return list(result)


async def create_chat(
    db: AsyncSession, user_id: uuid.UUID, title: str | None = None
) -> Chat:
    chat = Chat(user_id=user_id, title=title or "New Chat")
    db.add(chat)
    await db.commit()
    await db.refresh(chat)
    return chat


async def get_chat_owned(
    db: AsyncSession, chat_id: uuid.UUID, user_id: uuid.UUID
) -> Chat:
    chat = await db.scalar(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id)
    )
    if chat is None:
        raise ChatNotFound()
    return chat


async def get_messages(db: AsyncSession, chat_id: uuid.UUID) -> list[Message]:
    result = await db.scalars(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at)
    )
    return list(result)


async def add_message(
    db: AsyncSession, chat_id: uuid.UUID, role: str, content: str
) -> Message:
    msg = Message(chat_id=chat_id, role=role, content=content)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def delete_chat(
    db: AsyncSession, chat_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    chat = await get_chat_owned(db, chat_id, user_id)
    await db.delete(chat)
    await db.commit()


async def update_title_if_default(
    db: AsyncSession, chat: Chat, source_content: str
) -> None:
    """첫 응답 후 호출. title이 기본값이면 첫 user 메시지로 갱신."""
    if chat.title != "New Chat":
        return
    snippet = source_content.strip().replace("\n", " ")
    chat.title = (snippet[:40] + "…") if len(snippet) > 40 else snippet[:40]
    await db.commit()
