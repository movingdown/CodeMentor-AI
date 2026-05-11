"""AI analyzer — generates summary / README from project files."""
import logging
import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.analysis import Analysis
from app.db.models.project import Project
from app.db.models.project_file import ProjectFile
from app.services.llm.gemini import LLMError, generate_text

logger = logging.getLogger(__name__)

MAX_CONTEXT_CHARS = 30_000
PER_FILE_CHARS = 3_000


SUMMARY_SYSTEM = """당신은 시니어 소프트웨어 엔지니어입니다.
프로젝트 파일을 보고 다음을 한국어로 분석하세요:
1. 프로젝트가 무엇을 하는지 (2-3문장)
2. 사용된 주요 기술 스택
3. 코드 구조의 특징
4. 강점과 개선이 필요한 영역
마크다운으로 작성하되 전체를 코드 펜스로 감싸지 마세요.
"""

README_SYSTEM = """당신은 프로페셔널 오픈소스 README 작성자입니다.
입력된 프로젝트 정보를 바탕으로 완성도 높은 README.md를 작성하세요.

포함할 섹션:
- Title (제목 + 한 줄 태그라인)
- Description (2-3문장)
- Features (불릿 리스트)
- Tech Stack (테이블 또는 배지)
- Getting Started (Installation + Usage)
- Project Structure (간단히)
- License

규칙:
- 출력은 순수 markdown만. 코드 펜스로 전체를 감싸지 말 것.
- 추측 금지. 파일에서 확인 가능한 내용만 포함하세요.
"""


def _build_context(project: Project, files: list[ProjectFile]) -> str:
    parts: list[str] = []
    parts.append(f"# Project: {project.name}")
    if project.description:
        parts.append(f"Description: {project.description}")
    if project.primary_lang:
        parts.append(f"Primary language: {project.primary_lang}")
    if project.github_url:
        parts.append(f"GitHub: {project.github_url}")
    parts.append("")

    file_list = "\n".join(f"- {f.path}" for f in files)
    parts.append(f"## File tree\n{file_list}\n")

    parts.append("## File contents (truncated)")
    for f in files:
        if not f.content:
            continue
        content = f.content[:PER_FILE_CHARS]
        if len(f.content) > PER_FILE_CHARS:
            content += "\n... (truncated)"
        parts.append(f"\n### {f.path}\n```{f.language or ''}\n{content}\n```\n")

    full = "\n".join(parts)
    return full[:MAX_CONTEXT_CHARS]


def _strip_outer_fence(text: str) -> str:
    """LLM이 ```markdown ... ``` 으로 감싼 경우 벗기기."""
    text = text.strip()
    if not text.startswith("```"):
        return text
    lines = text.split("\n")
    if len(lines) > 2 and lines[-1].strip() == "```":
        return "\n".join(lines[1:-1])
    return text


async def generate_summary(
    db: AsyncSession, project: Project, user_id: uuid.UUID
) -> Analysis:
    files = list(
        await db.scalars(
            select(ProjectFile)
            .where(ProjectFile.project_id == project.id)
            .order_by(ProjectFile.path)
        )
    )
    if not files:
        raise LLMError("분석할 파일이 없습니다.")

    prompt = f"다음 프로젝트를 분석해주세요.\n\n{_build_context(project, files)}"
    text = await generate_text(prompt, system_instruction=SUMMARY_SYSTEM, temperature=0.4)

    analysis = Analysis(
        project_id=project.id,
        user_id=user_id,
        analysis_type="summary",
        result={"text": text},
        model="gemini-2.5-flash",
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis


async def generate_readme(
    db: AsyncSession, project: Project, user_id: uuid.UUID
) -> Analysis:
    files = list(
        await db.scalars(
            select(ProjectFile)
            .where(ProjectFile.project_id == project.id)
            .order_by(ProjectFile.path)
        )
    )
    if not files:
        raise LLMError("분석할 파일이 없습니다.")

    prompt = f"이 프로젝트의 README.md를 생성해주세요.\n\n{_build_context(project, files)}"
    text = await generate_text(prompt, system_instruction=README_SYSTEM, temperature=0.5)
    text = _strip_outer_fence(text)

    analysis = Analysis(
        project_id=project.id,
        user_id=user_id,
        analysis_type="readme",
        result={"markdown": text},
        model="gemini-2.5-flash",
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis


async def latest_analysis(
    db: AsyncSession, project_id: uuid.UUID, analysis_type: str
) -> Analysis | None:
    return await db.scalar(
        select(Analysis)
        .where(
            Analysis.project_id == project_id,
            Analysis.analysis_type == analysis_type,
        )
        .order_by(desc(Analysis.created_at))
        .limit(1)
    )
