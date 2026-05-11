"""GitHub repository import."""
from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.github import GitHubImportRequest
from app.schemas.project import ProjectRead
from app.services import project_service
from app.services.github_service import GitHubError

router = APIRouter()


@router.post(
    "/import",
    response_model=ProjectRead,
    status_code=status.HTTP_202_ACCEPTED,
    summary="GitHub URL 임포트 (비동기)",
)
async def import_repo(
    payload: GitHubImportRequest,
    background: BackgroundTasks,
    user: CurrentUser,
    db: DbSession,
) -> ProjectRead:
    """URL 검증 후 pending 프로젝트를 즉시 반환.
    실제 fetch는 BackgroundTask 가 진행 → 프론트에서 status 폴링.
    """
    try:
        project = await project_service.create_pending_github_project(
            db, user.id, payload.url
        )
    except GitHubError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc

    background.add_task(project_service.run_github_import, project.id)
    return ProjectRead.model_validate(project)
