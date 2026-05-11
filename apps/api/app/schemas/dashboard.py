"""Dashboard response shapes."""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class StatsSummary(BaseModel):
    total_chats: int
    total_projects: int
    total_analyses: int
    ai_requests_this_month: int


class UsageDay(BaseModel):
    date: str  # ISO YYYY-MM-DD
    count: int


class RecentChatItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    updated_at: datetime


class RecentProjectItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    status: Literal["pending", "analyzing", "ready", "failed"]
    primary_lang: str | None
    created_at: datetime


class RecentAnalysisItem(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    project_name: str
    analysis_type: Literal["summary", "readme", "file_review"]
    created_at: datetime


class DashboardSummary(BaseModel):
    stats: StatsSummary
    usage_7days: list[UsageDay]
    recent_chats: list[RecentChatItem]
    recent_projects: list[RecentProjectItem]
    recent_analyses: list[RecentAnalysisItem]
