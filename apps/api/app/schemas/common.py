"""Shared response schemas."""
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    database: str | None = None


class MessageResponse(BaseModel):
    message: str
