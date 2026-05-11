"""GitHub REST API client + URL parsing.

Public-repo focused. PAT 토큰이 있으면 rate limit 5000/hr.
"""
import logging
import re
from dataclasses import dataclass

import httpx

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"
RAW_BASE = "https://raw.githubusercontent.com"

_URL_PATTERNS = [
    re.compile(r"^https?://github\.com/([^/\s]+)/([^/\s.]+?)(?:\.git)?/?$"),
    re.compile(r"^git@github\.com:([^/\s]+)/([^/\s.]+?)(?:\.git)?/?$"),
    re.compile(r"^([\w.-]+)/([\w.-]+)$"),
]


class GitHubError(Exception):
    """User-safe error message."""


@dataclass
class RepoRef:
    owner: str
    repo: str

    @property
    def slug(self) -> str:
        return f"{self.owner}/{self.repo}"


def parse_repo_url(url: str) -> RepoRef:
    """URL → (owner, repo). 실패 시 GitHubError."""
    url = url.strip()
    for pat in _URL_PATTERNS:
        m = pat.match(url)
        if m:
            return RepoRef(owner=m.group(1), repo=m.group(2))
    raise GitHubError(
        "올바른 GitHub URL 형식이 아닙니다. (예: https://github.com/owner/repo)"
    )


def _headers() -> dict[str, str]:
    h = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "codementor-ai/0.1.0",
    }
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


async def fetch_repo_meta(ref: RepoRef) -> dict:
    """저장소 메타데이터."""
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{GITHUB_API}/repos/{ref.slug}", headers=_headers())
        if r.status_code == 404:
            raise GitHubError(
                "저장소를 찾을 수 없어요. (private 저장소이거나 잘못된 URL)"
            )
        if r.status_code == 403:
            raise GitHubError("GitHub API 한도에 도달했어요. 잠시 후 다시 시도해주세요.")
        if r.status_code >= 400:
            raise GitHubError("GitHub API 호출에 실패했어요.")
        return r.json()


async def fetch_tree(ref: RepoRef, branch: str) -> list[dict]:
    """전체 파일 트리 (recursive=1)."""
    url = f"{GITHUB_API}/repos/{ref.slug}/git/trees/{branch}?recursive=1"
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(url, headers=_headers())
        if r.status_code >= 400:
            raise GitHubError("저장소 구조를 가져오지 못했어요.")
        data = r.json()
        if data.get("truncated"):
            logger.warning("Tree truncated for %s (>100k entries)", ref.slug)
        return [e for e in data.get("tree", []) if e.get("type") == "blob"]


async def fetch_file_raw(ref: RepoRef, branch: str, path: str) -> str | None:
    """raw.githubusercontent.com 직접 호출. 바이너리/실패 시 None."""
    url = f"{RAW_BASE}/{ref.slug}/{branch}/{path}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, follow_redirects=True)
        if r.status_code != 200:
            return None
        if b"\x00" in r.content[:8192]:
            return None  # binary
        try:
            return r.content.decode("utf-8")
        except UnicodeDecodeError:
            return None
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to fetch %s: %s", path, exc)
        return None
