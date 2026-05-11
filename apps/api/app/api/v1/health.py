"""Liveness + readiness endpoints."""
from fastapi import APIRouter
from sqlalchemy import text

from app.core.deps import DbSession
from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def liveness() -> HealthResponse:
    return HealthResponse(status="ok", service="codementor-api")


@router.get("/health/db", response_model=HealthResponse)
async def readiness(db: DbSession) -> HealthResponse:
    await db.execute(text("SELECT 1"))
    return HealthResponse(
        status="ok",
        service="codementor-api",
        database="reachable",
    )
