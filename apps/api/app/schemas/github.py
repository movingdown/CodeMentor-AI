"""GitHub-related schemas."""
from pydantic import BaseModel, Field


class GitHubImportRequest(BaseModel):
    url: str = Field(min_length=1, max_length=500)
