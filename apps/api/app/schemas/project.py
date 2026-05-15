"""Project / ProjectFile / Analysis schemas."""
import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

ProjectStatus = Literal["pending", "analyzing", "ready", "failed"]
ProjectSource = Literal["upload", "github"]
AnalysisType = Literal["summary", "readme", "file_review"]


class ProjectFileMeta(BaseModel):
    """File listing (no content)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    path: str
    language: str | None
    size_bytes: int


class ProjectFileRead(ProjectFileMeta):
    """Full file (with content)."""

    content: str | None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    source: ProjectSource
    github_url: str | None
    description: str | None
    default_branch: str | None
    primary_lang: str | None
    file_count: int
    total_bytes: int
    status: ProjectStatus
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class ProjectDetailRead(ProjectRead):
    files: list[ProjectFileMeta]


class AnalysisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    analysis_type: AnalysisType
    result: dict[str, Any]
    model: str | None
    created_at: datetime
