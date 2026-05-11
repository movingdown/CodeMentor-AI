"""Project orchestration: file selection, GitHub import workflow, CRUD."""
import logging
import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.project import Project
from app.db.models.project_file import ProjectFile
from app.db.session import AsyncSessionLocal
from app.services import github_service

logger = logging.getLogger(__name__)


# ============================================================
# File selection rules — "AI가 봐야 하는 파일만 저장"
# ============================================================

PRIORITY_FILES = {
    "README.md", "README.rst", "README.txt", "README",
    "LICENSE", "LICENSE.md",
    "package.json", "package-lock.json",
    "requirements.txt", "pyproject.toml", "Pipfile",
    "Cargo.toml", "go.mod",
    "build.gradle", "build.gradle.kts", "pom.xml",
    "Gemfile", "composer.json",
    "tsconfig.json", "vite.config.ts", "vite.config.js",
    "next.config.js", "next.config.ts",
    "webpack.config.js", "tailwind.config.js", "tailwind.config.ts",
    "docker-compose.yml", "docker-compose.yaml", "Dockerfile",
    ".env.example", ".env.template",
}

ENTRY_POINTS = {
    "main.py", "app.py", "__main__.py", "manage.py", "wsgi.py", "asgi.py",
    "index.ts", "index.tsx", "index.js", "index.jsx",
    "App.tsx", "App.jsx", "App.ts", "App.js",
    "server.js", "server.ts", "main.ts", "main.tsx",
    "Main.java", "main.go", "main.rs",
}

EXCLUDE_DIRS = {
    "node_modules", ".git", "dist", "build", "out", "target",
    "__pycache__", ".next", ".venv", "venv", ".tox",
    ".pytest_cache", ".mypy_cache", ".ruff_cache",
    "coverage", ".nyc_output", ".idea", ".vscode",
    "vendor", "deps", ".gradle",
}

EXCLUDE_EXTS = {
    ".lock", ".min.js", ".min.css", ".map",
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".mp4", ".mp3", ".mov", ".wav",
    ".zip", ".tar", ".gz", ".rar", ".7z",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".exe", ".dll", ".so", ".dylib", ".class",
}

SOURCE_EXTS: dict[str, str] = {
    ".py": "python", ".pyi": "python",
    ".ts": "typescript", ".tsx": "typescript",
    ".js": "javascript", ".jsx": "javascript", ".mjs": "javascript",
    ".java": "java", ".kt": "kotlin",
    ".go": "go", ".rs": "rust",
    ".rb": "ruby", ".php": "php",
    ".cpp": "cpp", ".cc": "cpp", ".c": "c", ".h": "c", ".hpp": "cpp",
    ".cs": "csharp", ".swift": "swift", ".scala": "scala",
    ".sh": "shell", ".bash": "shell",
    ".sql": "sql",
    ".html": "html", ".css": "css", ".scss": "css",
    ".md": "markdown", ".rst": "markdown",
    ".json": "json", ".yml": "yaml", ".yaml": "yaml", ".toml": "toml",
}

MAX_FILE_SIZE = 256 * 1024
MAX_FILES = 50
MAX_TOTAL_BYTES = 5 * 1024 * 1024
MAX_REPO_SIZE_KB = 50 * 1024


def _filename(path: str) -> str:
    return path.rsplit("/", 1)[-1]


def _ext(path: str) -> str:
    name = _filename(path)
    if "." not in name:
        return ""
    return "." + name.rsplit(".", 1)[-1].lower()


def detect_language(path: str) -> str | None:
    return SOURCE_EXTS.get(_ext(path))


def _is_excluded(path: str) -> bool:
    parts = path.split("/")
    if any(p in EXCLUDE_DIRS for p in parts):
        return True
    if any(_filename(path).endswith(e) for e in EXCLUDE_EXTS):
        return True
    return False


def _priority_score(path: str) -> int:
    """Lower = higher priority (fetched first)."""
    name = _filename(path)
    depth = path.count("/")
    if name in PRIORITY_FILES:
        return 0
    if name in ENTRY_POINTS:
        return 10 + depth
    return 100 + depth * 10


def select_files_to_fetch(tree: list[dict]) -> list[dict]:
    """트리에서 분석할 파일만 선별 + 우선순위 정렬."""
    candidates = []
    for entry in tree:
        path = entry.get("path", "")
        size = entry.get("size", 0) or 0
        if _is_excluded(path):
            continue
        if size > MAX_FILE_SIZE:
            continue
        if _filename(path) not in PRIORITY_FILES and _ext(path) not in SOURCE_EXTS:
            continue
        candidates.append({"path": path, "size": size})

    candidates.sort(key=lambda x: _priority_score(x["path"]))

    selected = []
    total = 0
    for c in candidates:
        if len(selected) >= MAX_FILES:
            break
        if total + c["size"] > MAX_TOTAL_BYTES:
            break
        selected.append(c)
        total += c["size"]
    return selected


def detect_primary_lang(files: list[ProjectFile]) -> str | None:
    """가장 흔한 source language."""
    counts: dict[str, int] = {}
    skip = {"markdown", "json", "yaml", "toml"}
    for f in files:
        if f.language and f.language not in skip:
            counts[f.language] = counts.get(f.language, 0) + 1
    if not counts:
        return None
    return max(counts.items(), key=lambda kv: kv[1])[0]


# ============================================================
# CRUD
# ============================================================


class ProjectError(Exception):
    pass


class ProjectNotFound(ProjectError):
    pass


async def list_projects(db: AsyncSession, user_id: uuid.UUID) -> list[Project]:
    result = await db.scalars(
        select(Project)
        .where(Project.user_id == user_id)
        .order_by(desc(Project.created_at))
    )
    return list(result)


async def get_project_owned(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> Project:
    project = await db.scalar(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    if project is None:
        raise ProjectNotFound()
    return project


async def list_files(db: AsyncSession, project_id: uuid.UUID) -> list[ProjectFile]:
    result = await db.scalars(
        select(ProjectFile)
        .where(ProjectFile.project_id == project_id)
        .order_by(ProjectFile.path)
    )
    return list(result)


async def get_file(db: AsyncSession, file_id: uuid.UUID) -> ProjectFile | None:
    return await db.scalar(select(ProjectFile).where(ProjectFile.id == file_id))


async def delete_project(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    project = await get_project_owned(db, project_id, user_id)
    await db.delete(project)
    await db.commit()


# ============================================================
# Import workflow
# ============================================================


async def create_pending_github_project(
    db: AsyncSession, user_id: uuid.UUID, github_url: str
) -> Project:
    """URL 검증 후 pending 상태로 즉시 생성. 실제 fetch는 background task."""
    ref = github_service.parse_repo_url(github_url)
    project = Project(
        user_id=user_id,
        name=ref.slug,
        source="github",
        github_url=github_url,
        status="pending",
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


async def run_github_import(project_id: uuid.UUID) -> None:
    """BackgroundTasks 에서 실행. 자체 세션 사용."""
    async with AsyncSessionLocal() as db:
        project = await db.scalar(select(Project).where(Project.id == project_id))
        if project is None or project.github_url is None:
            return

        try:
            ref = github_service.parse_repo_url(project.github_url)

            meta = await github_service.fetch_repo_meta(ref)
            if meta.get("size", 0) > MAX_REPO_SIZE_KB:
                raise github_service.GitHubError(
                    f"저장소가 너무 큽니다. ({meta.get('size', 0) // 1024} MB > "
                    f"{MAX_REPO_SIZE_KB // 1024} MB 한도)"
                )

            project.description = meta.get("description")
            project.default_branch = meta.get("default_branch") or "main"
            project.status = "analyzing"
            await db.commit()

            tree = await github_service.fetch_tree(ref, project.default_branch)
            to_fetch = select_files_to_fetch(tree)

            total_bytes = 0
            saved_files: list[ProjectFile] = []
            for entry in to_fetch:
                content = await github_service.fetch_file_raw(
                    ref, project.default_branch, entry["path"]
                )
                if content is None:
                    continue
                size = len(content.encode("utf-8"))
                pf = ProjectFile(
                    project_id=project.id,
                    path=entry["path"],
                    language=detect_language(entry["path"]),
                    size_bytes=size,
                    content=content,
                )
                db.add(pf)
                saved_files.append(pf)
                total_bytes += size

            await db.flush()
            project.file_count = len(saved_files)
            project.total_bytes = total_bytes
            project.primary_lang = detect_primary_lang(saved_files) or (
                (meta.get("language") or "").lower() or None
            )
            project.status = "ready"
            project.error_message = None
            await db.commit()

            logger.info("Imported %s with %d files", project.name, len(saved_files))

        except github_service.GitHubError as exc:
            logger.warning("GitHub import failed: %s", exc)
            project.status = "failed"
            project.error_message = str(exc)
            await db.commit()
        except Exception as exc:  # noqa: BLE001
            logger.exception("Unexpected import failure for project %s", project_id)
            project.status = "failed"
            project.error_message = f"예기치 못한 오류: {type(exc).__name__}"
            await db.commit()
