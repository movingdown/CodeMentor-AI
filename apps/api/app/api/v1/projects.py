"""Project CRUD endpoints."""
import uuid

from fastapi import APIRouter, HTTPException, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.project import (
    ProjectDetailRead,
    ProjectFileMeta,
    ProjectFileRead,
    ProjectRead,
)
from app.services import project_service

router = APIRouter()


@router.get("", response_model=list[ProjectRead])
async def list_projects(user: CurrentUser, db: DbSession) -> list[ProjectRead]:
    projects = await project_service.list_projects(db, user.id)
    return [ProjectRead.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectDetailRead)
async def get_project(
    project_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> ProjectDetailRead:
    try:
        project = await project_service.get_project_owned(db, project_id, user.id)
    except project_service.ProjectNotFound as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "프로젝트를 찾을 수 없습니다."
        ) from exc
    files = await project_service.list_files(db, project_id)
    return ProjectDetailRead(
        **ProjectRead.model_validate(project).model_dump(),
        files=[ProjectFileMeta.model_validate(f) for f in files],
    )


@router.get("/{project_id}/files/{file_id}", response_model=ProjectFileRead)
async def get_file(
    project_id: uuid.UUID,
    file_id: uuid.UUID,
    user: CurrentUser,
    db: DbSession,
) -> ProjectFileRead:
    try:
        await project_service.get_project_owned(db, project_id, user.id)
    except project_service.ProjectNotFound as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "프로젝트를 찾을 수 없습니다."
        ) from exc
    file = await project_service.get_file(db, file_id)
    if file is None or file.project_id != project_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "파일을 찾을 수 없습니다.")
    return ProjectFileRead.model_validate(file)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> None:
    try:
        await project_service.delete_project(db, project_id, user.id)
    except project_service.ProjectNotFound as exc:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "프로젝트를 찾을 수 없습니다."
        ) from exc
