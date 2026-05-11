"""AI analysis endpoints — summary / readme."""
import uuid

from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.project import AnalysisRead
from app.services import analyzer_service, project_service
from app.services.llm.gemini import LLMError

router = APIRouter()


@router.post(
    "/projects/{project_id}/analyze",
    response_model=AnalysisRead,
    status_code=status.HTTP_201_CREATED,
)
async def analyze_project(
    project_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> AnalysisRead:
    try:
        project = await project_service.get_project_owned(db, project_id, user.id)
    except project_service.ProjectNotFound as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "프로젝트를 찾을 수 없습니다."
        ) from exc

    if project.status != "ready":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"프로젝트가 아직 준비되지 않았어요. (현재 상태: {project.status})",
        )

    try:
        analysis = await analyzer_service.generate_summary(db, project, user.id)
    except LLMError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    return AnalysisRead.model_validate(analysis)


@router.post(
    "/projects/{project_id}/readme",
    response_model=AnalysisRead,
    status_code=status.HTTP_201_CREATED,
)
async def generate_readme(
    project_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> AnalysisRead:
    try:
        project = await project_service.get_project_owned(db, project_id, user.id)
    except project_service.ProjectNotFound as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "프로젝트를 찾을 수 없습니다."
        ) from exc

    if project.status != "ready":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"프로젝트가 아직 준비되지 않았어요. (현재 상태: {project.status})",
        )

    try:
        analysis = await analyzer_service.generate_readme(db, project, user.id)
    except LLMError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    return AnalysisRead.model_validate(analysis)


@router.get(
    "/projects/{project_id}/analyses/latest",
    response_model=AnalysisRead | None,
)
async def get_latest_analysis(
    project_id: uuid.UUID,
    user: CurrentUser,
    db: DbSession,
    type: str = Query(default="summary", pattern="^(summary|readme|file_review)$"),
) -> AnalysisRead | None:
    """저장된 마지막 분석 반환 (없으면 null)."""
    try:
        await project_service.get_project_owned(db, project_id, user.id)
    except project_service.ProjectNotFound as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "프로젝트를 찾을 수 없습니다."
        ) from exc

    a = await analyzer_service.latest_analysis(db, project_id, type)
    return AnalysisRead.model_validate(a) if a else None
