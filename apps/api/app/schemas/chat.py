"""Chat & Message schemas."""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


Role = Literal["user", "assistant", "system"]


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: Role
    content: str
    created_at: datetime


class ChatRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    model: str
    created_at: datetime
    updated_at: datetime


class ChatDetailRead(ChatRead):
    messages: list[MessageRead]


class ChatCreate(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=20_000)
